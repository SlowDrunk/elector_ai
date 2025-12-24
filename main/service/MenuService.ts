import { ipcMain, Menu, type MenuItemConstructorOptions } from "electron";
import { IPC_EVENTS } from "@common/constants";
import logManager from "./LogService";
import { cloneDeep } from "@common/utils";

let t = (value: string | undefined) => value;

class MenuService {
  private static _instance: MenuService;
  private _menutemplate: Map<string, MenuItemConstructorOptions[]> = new Map();
  private _currentMenu?: Menu = void 0;

  private constructor() {
    this._setUpIpcListener();
    this._setupLanguageChangeListener();
    logManager.info("MenuService initialized successfully");
  }

  private _setUpIpcListener() {
    ipcMain.handle(
      IPC_EVENTS.SHOW_CONTEXT_MENU,
      (_, menuId: string, dynamicOptions?: string) =>
        new Promise((resolve) =>
          this.showMenu(menuId, () => resolve(true), dynamicOptions)
        )
    );
  }

  private _setupLanguageChangeListener() {
    // TODO:
  }

  public static getInstance(): MenuService {
    if (!this._instance) {
      this._instance = new MenuService();
    }
    return this._instance;
  }
  /**
   * 注册菜单
   * @param menuId 菜单id
   * @param template 菜单模板
   * @returns 菜单id
   * @returns
   */
  public register(menuId: string, template: MenuItemConstructorOptions[]) {
    this._menutemplate.set(menuId, template);
    return menuId;
  }

  public showMenu(
    menuId: string,
    onClose?: () => void,
    dynamicOptions?: string
  ) {
    if (this._currentMenu) return;

    const template = cloneDeep(this._menutemplate.get(menuId));

    if (!template) {
      logManager.warn(`Menu ${menuId} not found.`);
      onClose?.();
      return;
    }

    let _dynamicOptions: Array<
      Partial<MenuItemConstructorOptions> & { id: string }
    > = [];
    try {
      _dynamicOptions = Array.isArray(dynamicOptions)
        ? dynamicOptions
        : JSON.parse(dynamicOptions ?? "[]");
    } catch (error) {
      logManager.error(
        `Failed to parse dynamicOptions for menu ${menuId}: ${error}`
      );
    }

    const translationItem = (
      item: MenuItemConstructorOptions
    ): MenuItemConstructorOptions => {
      if (item.submenu) {
        return {
          ...item,
          label: t(item?.label) ?? void 0,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map(
            (item: MenuItemConstructorOptions) => translationItem(item)
          ),
        };
      }
      return {
        ...item,
        label: t(item?.label) ?? void 0,
      };
    };
    const localizedTemplate = template.map((item) => {
      if (!Array.isArray(_dynamicOptions) || !_dynamicOptions.length) {
        return translationItem(item);
      }

      const dynamicItem = _dynamicOptions.find((_item) => _item.id === item.id);

      if (dynamicItem) {
        const mergedItem = { ...item, ...dynamicItem };
        return translationItem(mergedItem);
      }

      if (item.submenu) {
        return translationItem({
          ...item,
          submenu: (item.submenu as MenuItemConstructorOptions[])?.map(
            (__item: MenuItemConstructorOptions) => {
              const dynamicItem = _dynamicOptions.find(
                (_item) => _item.id === __item.id
              );
              return { ...__item, ...dynamicItem };
            }
          ),
        });
      }

      return translationItem(item);
    });

    const menu = Menu.buildFromTemplate(localizedTemplate);

    this._currentMenu = menu;

    menu.popup({
      callback: () => {
        this._currentMenu = void 0;
        onClose?.();
      },
    });
  }
  /**
   * 销毁菜单
   * @param menuId
   */
  public distroyMenu(menuId: string) {
    this._menutemplate.delete(menuId);
  }
  /**
   * 清空所有菜单
   */
  public distroyed() {
    this._menutemplate.clear();
    this._currentMenu = void 0;
  }
}

export const menuManger = MenuService.getInstance();
export default menuManger;
