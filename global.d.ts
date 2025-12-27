type ThemeMode = 'dark' | 'light' | 'system';
/**
 * 窗口 API 接口
 * 用于渲染进程与主进程通信，控制窗口行为
 */
interface WindowApi {
    /** 关闭窗口 */
    closeWindow: () => void;

    /** 最小化窗口 */
    minimizeWindow: () => void;

    /** 切换窗口最大化/还原状态 */
    maximizeWindow: () => void;

    /** 
     * 监听窗口最大化状态变化
     * @param callback 当窗口最大化状态改变时调用的回调函数，参数为当前是否最大化
     */
    onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;

    /** 
     * 检查窗口是否处于最大化状态
     * @returns 返回一个 Promise，解析为窗口是否最大化
     */
    isWindowMaximized: () => Promise<boolean>;
    /**
     * 设置主题模式
     * @param mode 主题模式，可选值：'dark' | 'light' | 'system'
     * @returns 返回一个 Promise，解析为当前是否为暗色模式
     */
    setThemeMode: (mode: ThemeMode) => Promise<boolean>;
    getThemeMode: () => Promise<ThemeMode>;
    isDarkTheme: () => Promise<boolean>;
    onSystemThemeChange: (callback: (isDark: boolean) => void) => void;
    // 设置对话菜单API
    showContextMenu: (menuId: string, dynamicOptions?: string) => Promise<any>;
    contextMenuItemClick: (menuId: string, cb: (id: string) => void) => void;
    removeContextMenuListener: (menuId: string) => void;

    logger: {
        debug: (message: string, ...meta: any[]) => void;
        info: (message: string, ...meta: any[]) => void;
        warn: (message: string, ...meta: any[]) => void;
        error: (message: string, ...meta: any[]) => void;
    }
}

/**
 * 扩展 Window 接口，添加 window.api 属性
 */
declare interface Window {
    /** 窗口控制 API */
    api: WindowApi;
}