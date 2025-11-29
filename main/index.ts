import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// 处理在 Windows 上安装/卸载时创建/删除快捷方式。
if (started) {
  app.quit();
}

const createWindow = () => {
  // 创建浏览器窗口。
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 800,
    icon:path.join(__dirname,'public/logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 并加载应用的 index.html。
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}${'/html/'}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../render/${MAIN_WINDOW_VITE_NAME}/html/index.html`));
  }

  // 打开开发者工具。
  // mainWindow.webContents.openDevTools();
};

// 当 Electron 完成初始化并准备好创建浏览器窗口时，将调用此方法。
// 某些 API 只能在此事件发生后使用。
app.whenReady().then(() => {
  createWindow();

  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，
  // 通常会在应用中重新创建一个窗口。
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出，但在 macOS 上除外。在 macOS 上，
// 应用程序及其菜单栏通常会保持活动状态，直到用户使用 Cmd + Q 明确退出。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在此文件中，您可以包含应用程序特定的其余主进程代码。
// 您也可以将它们放在单独的文件中并在此处导入。
