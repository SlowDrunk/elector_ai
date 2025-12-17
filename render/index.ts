/**
 * 此文件将由 vite 自动加载并在 "renderer" 上下文中运行。
 * 要了解 Electron 中 "main" 和 "renderer" 上下文之间的区别，请访问：
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * 默认情况下，此文件中的 Node.js 集成已禁用。在渲染器进程中启用 Node.js 集成时，
 * 请注意潜在的安全隐患。您可以在此处阅读有关安全风险的更多信息：
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * 要在此文件中启用 Node.js 集成，请打开 `main.js` 并启用 `nodeIntegration` 标志：
 *
 * ```
 *  // 创建浏览器窗口。
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './styles/index.css';
import 'vfonts/Lato.css';

import { createApp, type Plugin } from 'vue';
import i18n from './i18n';
import errorHandler from './utils/errorHandler';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia } from 'pinia';

import App from '../render/App.vue';
import TitleBar from './components/TitleBar.vue';
import DragRegion from './components/DragRegion.vue';



const components: Plugin = function (app) {
  app.component('TitleBar', TitleBar)
  app.component('DragRegion', DragRegion)
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./views/index.vue'),
    }
  ]
})

const pinia = createPinia();

createApp(App)
  .use(pinia)
  .use(router)
  .use(components)
  .use(await i18n)
  .use(errorHandler)
  .mount('#app');
