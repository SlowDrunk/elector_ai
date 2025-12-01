import { IPC_EVENTS } from '@common/constants';
import { promisify } from 'util';
import { app, ipcMain } from 'electron';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 将部分 Node.js 原生的 `fs` 回调式方法转换为 Promise 形式，
 * 便于在后续的异步清理任务中使用 `async/await` 写法。
 */
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const unlinkAsync = promisify(fs.unlink);

/**
 * **LogService**
 *
 * - 负责统一管理主进程的日志记录逻辑（文件 + 控制台）；
 * - 通过 `electron-log` 将日志输出到按日期划分的日志文件中；
 * - 提供 `debug/info/warn/error` 四种日志级别的方法；
 * - 通过 `IPC` 暴露给渲染进程使用（例如 `window.electron.ipcRenderer.send(...)`）；
 * - 内置旧日志自动清理逻辑，避免日志无限增长占用磁盘。
 *
 * 此类采用 **单例模式（Singleton）**：
 * - 外部只能通过 `LogService.getInstance()` 获取唯一实例；
 * - 构造函数为 `private`，防止被随意 `new`。
 */
class LogService {
    /**
     * **单例实例缓存**
     *
     * - 第一次调用 `getInstance()` 时创建；
     * - 之后多次调用始终返回同一个实例。
     */
    private static _instance: LogService;

    /**
     * **日志保留天数**
     *
     * - 默认值为 `7`；
     * - 在 `_cleanupOldLogs` 中用于计算“过期时间点”，
     *   创建时间早于该时间点的 `.log` 文件会被删除。
     *
     * 如需修改日志保留时间，可调整此值，例如：
     * - `1`：只保留最近一天的日志；
     * - `30`：保留最近一个月的日志。
     */
    private LOG_RETENTION_DAYS = 7;

    /**
     * **自动清理周期（毫秒）**
     *
     * - 当前设置为 24 小时：`24 * 60 * 60 * 1000`；
     * - 会在构造函数中配合 `setInterval` 使用，实现定时清理旧日志。
     */
    private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

    /**
     * 构造函数私有化：
     *
     * - 设置日志目录；
     * - 初始化 `electron-log` 的路径、格式、级别等配置；
     * - 注册 IPC 事件，使渲染进程可以通过 IPC 写日志；
     * - 重写全局 `console` 方法，使得控制台输出也同步写入日志文件；
     * - 启动一次立即执行的旧日志清理；
     * - 开启定时任务，周期性清理过期日志。
     */
    private constructor() {
        /**
         * `logPath` 为实际日志存放目录，例如（Windows）：
         * `C:\Users\<username>\AppData\Roaming\<appName>\logs`
         *
         * - 使用 `app.getPath('userData')` 获取 Electron 用户数据目录；
         * - 在其下创建 `logs` 子目录。
         */
        const logPath = path.join(app.getPath('userData'), 'logs');

        // 创建日志目录（如果不存在则递归创建）
        try {
            if (!fs.existsSync(logPath)) {
                fs.mkdirSync(logPath, { recursive: true });
            }
        } catch (err) {
            // 如果目录创建失败，也尽量记录错误信息（若日志系统未就绪，此行可能退化为普通 console 输出）
            this.error('Failed to create log directory:', err);
        }

        /**
         * 配置 electron-log：动态决定日志文件的路径
         *
         * - 每天一个日志文件，格式为：`YYYY-MM-DD.log`；
         * - 通过 `resolvePathFn` 每次写日志时动态计算路径，
         *   可保证跨天后，新的日志会写入新的文件中。
         */
        log.transports.file.resolvePathFn = () => {
            // 使用当前日期作为日志文件名，格式为 YYYY-MM-DD.log
            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            return path.join(logPath, `${formattedDate}.log`);
        };

        /**
         * 配置文件日志格式：
         * - `{y}-{m}-{d} {h}:{i}:{s}.{ms}`：日期时间（精确到毫秒）；
         * - `{level}`：日志级别（debug/info/warn/error）；
         * - `{text}`：日志文本内容。
         *
         * 示例：
         * `[2025-01-01 12:00:00.123] [info] App started`
         */
        log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

        /**
         * 配置单个日志文件大小限制：
         * - 这里设置为 10MB；
         * - 当单个日志文件超过该大小时，electron-log 会根据其机制进行轮转或限制。
         */
        log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB

        /**
         * 配置控制台日志输出级别：
         * - 开发环境（`NODE_ENV=development`）：输出 `debug` 及以上的日志；
         * - 生产环境：默认从 `info` 级别开始输出，避免过多调试信息。
         */
        log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

        /**
         * 配置文件日志输出级别：
         * - 设置为 `debug`，意味着所有级别（debug/info/warn/error）都会写入日志文件；
         * - 如需减少磁盘占用，可根据需要提升最低级别。
         */
        log.transports.file.level = 'debug';

        /**
         * 通过 IPC 将日志能力暴露给渲染进程：
         * - 渲染进程可以通过 `IPC_EVENTS.LOG_xxx` 对应事件发送日志；
         * - 主进程收到后调用本服务的 `debug/info/warn/error` 方法，最终写入日志文件。
         */
        this._setupIpcEvents();

        /**
         * 重写 Node.js 全局 `console` 方法：
         * - `console.debug / log / info / warn / error` 均委托给 `electron-log`；
         * - 好处：不需要在项目中大量修改已有的 `console.xxx` 调用，
         *   即可自动将其输出写入到日志文件中。
         */
        this._rewriteConsole();

        // 初始化完成后记录一条信息日志，便于确认日志系统是否正常工作
        this.info('LogService initialized successfully.');

        // 启动一次立即执行的旧日志清理，避免首次运行时磁盘上已有大量旧文件
        this._cleanupOldLogs();

        /**
         * 启动定时任务：
         * - 每隔 `CLEANUP_INTERVAL_MS` 毫秒（默认 24 小时）执行一次 `_cleanupOldLogs`；
         * - 该计时器生命周期与主进程相同。
         */
        setInterval(() => this._cleanupOldLogs(), this.CLEANUP_INTERVAL_MS);
    }

    /**
     * 注册与日志相关的 IPC 事件监听
     *
     * - 渲染进程可以发送事件：`IPC_EVENTS.LOG_DEBUG/LOG_INFO/LOG_WARN/LOG_ERROR`；
     * - 主进程接收到相应事件后，会调用内部对应级别的日志方法。
     *
     * 典型使用示例（渲染进程）：
     * ```ts
     * window.electron.ipcRenderer.send(IPC_EVENTS.LOG_INFO, '页面加载完成', { route: '/home' });
     * ```
     */
    private _setupIpcEvents() {
        ipcMain.on(IPC_EVENTS.LOG_DEBUG, (_e, message: string, ...meta: any[]) => this.debug(message, ...meta));
        ipcMain.on(IPC_EVENTS.LOG_INFO, (_e, message: string, ...meta: any[]) => this.info(message, ...meta));
        ipcMain.on(IPC_EVENTS.LOG_WARN, (_e, message: string, ...meta: any[]) => this.warn(message, ...meta));
        ipcMain.on(IPC_EVENTS.LOG_ERROR, (_e, message: string, ...meta: any[]) => this.error(message, ...meta));
    }

    /**
     * 重写全局 `console` 方法
     *
     * - 将 `console.debug` 映射到 `log.debug`；
     * - 将 `console.log` / `console.info` 映射到 `log.info`；
     * - 将 `console.warn` 映射到 `log.warn`；
     * - 将 `console.error` 映射到 `log.error`。
     *
     * 这样既保持控制台输出行为不变，又能保证所有控制台日志统一进入日志系统。
     */
    private _rewriteConsole() {
        console.debug = log.debug;
        console.log = log.info;
        console.info = log.info;
        console.warn = log.warn;
        console.error = log.error;
    }

    /**
     * **异步清理过期日志文件**
     *
     * - 扫描日志目录下的所有 `.log` 文件；
     * - 通过文件的 `birthtime` 判断是否早于“过期时间点”；
     * - 对过期日志文件执行删除操作；
     * - 最终输出删除数量（若有删除）。
     *
     * 注意：
     * - 如果目录不存在，则直接返回，不做任何处理；
     * - 单个文件删除失败不会中断整个清理流程，只会记录一条错误日志。
     */
    private async _cleanupOldLogs() {
        try {
            const logPath = path.join(app.getPath('userData'), 'logs');

            // 若日志目录不存在，则无需清理，直接结束
            if (!fs.existsSync(logPath)) return;

            const now = new Date();
            //   计算时间间隔，当前时间减去日志保留天数，得到过期时间点
            const expirationDate = new Date(now.getTime() - this.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

            // 读取日志目录下的所有文件名称
            const files = await readdirAsync(logPath);

            let deletedCount = 0;

            for (const file of files) {
                // 只处理 .log 结尾的文件，避免误删其他文件
                if (!file.endsWith('.log')) continue;
                const filePath = path.join(logPath, file);
                try {
                    const stats = await statAsync(filePath);

                    // 仅在为普通文件且创建时间早于“过期时间点”时才删除
                    if (stats.isFile() && (stats.birthtime < expirationDate)) {
                        await unlinkAsync(filePath);
                        deletedCount++;
                    }
                } catch (error) {
                    // 单个文件操作失败不会影响其他文件的清理
                    this.error(`Failed to delete old log file ${filePath}:`, error);
                }
            }

            // 有文件被删除时，输出一条汇总信息
            if (deletedCount > 0) {
                this.info(`Successfully cleaned up ${deletedCount} old log files.`);
            }
        } catch (err) {
            // 顶层异常捕获，防止清理逻辑抛出未捕获异常影响主进程稳定性
            this.error('Failed to cleanup old logs:', err);
        }
    }

    /**
     * 获取 `LogService` 的全局单例实例
     *
     * - 首次调用时会创建实例并执行构造函数内的初始化逻辑；
     * - 后续调用直接返回缓存的 `_instance`；
     * - 推荐在主进程入口处尽早调用一次，以尽快初始化日志系统。
     */
    public static getInstance(): LogService {
        if (!this._instance) {
            this._instance = new LogService();
        }
        return this._instance;
    }

    /**
     * 记录 **调试级别（debug）** 日志
     *
     * - 适合用于开发调试、打印详细上下文信息；
     * - 在生产环境中通常不会在控制台输出，但仍会写入文件（取决于配置）。
     *
     * @param message 日志消息内容
     * @param meta    可选的附加元数据，例如参数、上下文对象等
     */
    public debug(message: string, ...meta: any[]): void {
        log.debug(message, ...meta);
    }

    /**
     * 记录 **普通信息级别（info）** 日志
     *
     * - 用于记录正常的业务流程信息，例如“应用启动完成”、“用户登录成功”等；
     * - 建议在关键业务节点调用，方便后续问题排查和行为追踪。
     *
     * @param message 日志消息内容
     * @param meta    可选的附加元数据
     */
    public info(message: string, ...meta: any[]): void {
        log.info(message, ...meta);
    }

    /**
     * 记录 **警告级别（warn）** 日志
     *
     * - 用于记录非预期但尚不影响整体功能的情况；
     *   例如：配置缺失采用默认值、某些非关键请求失败等；
     * - 这些日志有助于提前发现潜在问题。
     *
     * @param message 日志消息内容
     * @param meta    可选的附加元数据
     */
    public warn(message: string, ...meta: any[]): void {
        log.warn(message, ...meta);
    }

    /**
     * 记录 **错误级别（error）** 日志
     *
     * - 用于记录真正的异常和错误场景；
     *   例如：接口请求失败、未捕获异常、关键业务流程中断等；
     * - 通常会附带 `Error` 对象，便于查看堆栈信息。
     *
     * @param message 日志消息内容
     * @param meta    可选的附加元数据，常见为 `Error` 或包含错误详情的对象
     */
    public error(message: string, ...meta: any[]): void {
        log.error(message, ...meta);
    }

}

/**
 * 默认导出的日志管理实例：
 *
 * - `logManager` 与 `default` 导出指向同一个单例实例；
 * - 在主进程其他模块中可直接：
 *   ```ts
 *   import logManager from './service/LogService';
 *   logManager.info('xxx');
 *   ```
 */
export const logManager = LogService.getInstance();
export default logManager;