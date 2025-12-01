import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { setupWindows } from './wins';
import logManager from './service/LogService';

// 处理 Windows 安装/卸载时创建/删除快捷方式的情况
if (started) {
  app.quit();
}
// 捕获未捕获的异常(同步)
process.on('uncaughtException', (error) => {
  logManager.error('Uncaught exception:', error);
});

// 捕获未捕获的拒绝(异步)
process.on('unhandledRejection', (reason, promise) => {
  logManager.error('Unhandled rejection:', reason, promise);
});
// 当 Electron 完成初始化并准备好创建浏览器窗口时，将调用此方法
// 某些 API 只能在此事件发生后使用
app.whenReady().then(() => {
  setupWindows();

  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，通常会重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      setupWindows();
    }
  });
});

// 当所有窗口关闭时退出应用，但在 macOS 上除外
// 在 macOS 上，应用程序及其菜单栏通常会保持活动状态，直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在此文件中，您可以包含应用程序的其余特定主进程代码
// 您也可以将它们放在单独的文件中并在这里导入