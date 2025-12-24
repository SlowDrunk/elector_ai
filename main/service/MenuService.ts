// Electron 相关导入
import { ipcMain, Menu, type MenuItemConstructorOptions } from "electron";
// IPC 事件常量
import { IPC_EVENTS } from "@common/constants";
// 日志服务
import logManager from "./LogService";
// 深拷贝工具函数
import { cloneDeep } from "@common/utils";

/**
 * 翻译函数，用于将菜单标签进行国际化处理
 * @param value 待翻译的字符串
 * @returns 翻译后的字符串（当前为直接返回原值）
 */
let t = (value: string | undefined) => value;

/**
 * 菜单服务类
 * 负责管理 Electron 应用的上下文菜单，支持菜单注册、显示、国际化等功能
 * 采用单例模式确保全局唯一实例
 */
class MenuService {
  /** 单例实例 */
  private static _instance: MenuService;
  /** 菜单模板映射表，key 为菜单 ID，value 为菜单项配置数组 */
  private _menutemplate: Map<string, MenuItemConstructorOptions[]> = new Map();
  /** 当前显示的菜单实例 */
  private _currentMenu?: Menu = void 0;

  /**
   * 私有构造函数，实现单例模式
   * 初始化时设置 IPC 监听器和语言变更监听器
   */
  private constructor() {
    this._setUpIpcListener();
    this._setupLanguageChangeListener();
    logManager.info("MenuService initialized successfully");
  }

  /**
   * 设置 IPC 监听器
   * 监听来自渲染进程的显示上下文菜单请求
   */
  private _setUpIpcListener() {
    ipcMain.handle(
      IPC_EVENTS.SHOW_CONTEXT_MENU,
      (_, menuId: string, dynamicOptions?: string) =>
        new Promise((resolve) =>
          this.showMenu(menuId, () => resolve(true), dynamicOptions)
        )
    );
  }

  /**
   * 设置语言变更监听器
   * 当应用语言切换时，更新翻译函数以支持新的语言
   * TODO: 实现语言变更监听逻辑
   */
  private _setupLanguageChangeListener() {
    // TODO: 监听语言变更事件，更新翻译函数 t
  }

  /**
   * 获取 MenuService 单例实例
   * @returns MenuService 实例
   */
  public static getInstance(): MenuService {
    if (!this._instance) {
      this._instance = new MenuService();
    }
    return this._instance;
  }

  /**
   * 注册菜单
   * @param menuId 菜单唯一标识符
   * @param template 菜单项配置模板数组
   * @returns 返回注册的菜单 ID
   */
  public register(menuId: string, template: MenuItemConstructorOptions[]) {
    this._menutemplate.set(menuId, template);
    return menuId;
  }

  /**
   * 显示指定的上下文菜单
   * @param menuId 要显示的菜单 ID
   * @param onClose 菜单关闭时的回调函数
   * @param dynamicOptions 动态菜单选项，可以是 JSON 字符串或数组，用于运行时修改菜单项
   */
  public showMenu(
    menuId: string,
    onClose?: () => void,
    dynamicOptions?: string
  ) {
    // 如果已有菜单正在显示，则直接返回，避免重复显示
    if (this._currentMenu) return;

    // 深拷贝菜单模板，避免修改原始模板
    const template = cloneDeep(this._menutemplate.get(menuId));

    // 如果菜单不存在，记录警告并执行关闭回调
    if (!template) {
      logManager.warn(`Menu ${menuId} not found.`);
      onClose?.();
      return;
    }

    // 解析动态选项
    let _dynamicOptions: Array<
      Partial<MenuItemConstructorOptions> & { id: string }
    > = [];
    try {
      // 如果 dynamicOptions 是数组则直接使用，否则尝试解析 JSON 字符串
      _dynamicOptions = Array.isArray(dynamicOptions)
        ? dynamicOptions
        : JSON.parse(dynamicOptions ?? "[]");
    } catch (error) {
      // 解析失败时记录错误，但不影响菜单显示
      logManager.error(
        `Failed to parse dynamicOptions for menu ${menuId}: ${error}`
      );
    }

    /**
     * 递归翻译菜单项及其子菜单
     * @param item 菜单项配置
     * @returns 翻译后的菜单项配置
     */
    const translationItem = (
      item: MenuItemConstructorOptions
    ): MenuItemConstructorOptions => {
      // 如果存在子菜单，递归处理子菜单项
      if (item.submenu) {
        return {
          ...item,
          label: t(item?.label) ?? void 0,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map(
            (item: MenuItemConstructorOptions) => translationItem(item)
          ),
        };
      }
      // 普通菜单项，直接翻译标签
      return {
        ...item,
        label: t(item?.label) ?? void 0,
      };
    };

    // 处理菜单模板，应用翻译和动态选项
    const localizedTemplate = template.map((item) => {
      // 如果没有动态选项，直接翻译并返回
      if (!Array.isArray(_dynamicOptions) || !_dynamicOptions.length) {
        return translationItem(item);
      }

      // 查找匹配的动态选项
      const dynamicItem = _dynamicOptions.find((_item) => _item.id === item.id);

      // 如果找到匹配的动态选项，合并到菜单项中
      if (dynamicItem) {
        const mergedItem = { ...item, ...dynamicItem };
        return translationItem(mergedItem);
      }

      // 如果菜单项有子菜单，处理子菜单中的动态选项
      if (item.submenu) {
        return translationItem({
          ...item,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map(
            (__item: MenuItemConstructorOptions) => {
              // 查找子菜单项匹配的动态选项
              const dynamicItem = _dynamicOptions.find(
                (_item) => _item.id === __item.id
              );
              // 合并动态选项到子菜单项
              return { ...__item, ...dynamicItem };
            }
          ),
        });
      }

      // 默认情况，直接翻译
      return translationItem(item);
    });

    // 从模板构建菜单实例
    const menu = Menu.buildFromTemplate(localizedTemplate);

    // 保存当前菜单实例
    this._currentMenu = menu;

    // 弹出菜单
    menu.popup({
      callback: () => {
        // 菜单关闭后清空当前菜单实例并执行关闭回调
        this._currentMenu = void 0;
        onClose?.();
      },
    });
  }

  /**
   * 销毁指定菜单
   * 从菜单模板映射表中删除指定的菜单配置
   * @param menuId 要销毁的菜单 ID
   */
  public distroyMenu(menuId: string) {
    this._menutemplate.delete(menuId);
  }

  /**
   * 清空所有菜单
   * 清除所有已注册的菜单模板和当前显示的菜单
   */
  public distroyed() {
    this._menutemplate.clear();
    this._currentMenu = void 0;
  }
}

// 导出单例实例
export const menuManger = MenuService.getInstance();
export default menuManger;
