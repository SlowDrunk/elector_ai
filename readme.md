这是一个使用 Electron + Vue 3 + TypeScript + Tailwind CSS 构建的现代化桌面应用程序。
## 核心架构特点：
Electron Forge + Vite 构建系统
使用 @electron-forge/plugin-vite 插件，将Vite的快速构建能力集成到Electron开发中
分离的配置文件：vite.main.config.ts、vite.preload.config.ts、vite.renderer.config.ts
## 多进程架构
主进程 (src/main.ts) - 管理应用生命周期和窗口
预加载脚本 (src/preload.ts) - 安全地暴露Node.js API到渲染进程
渲染进程 (src/App.vue) - Vue 3前端界面
## 现代化技术栈
Vue 3 Composition API + <script setup> 语法
TypeScript 提供类型安全
Tailwind CSS 4 用于样式设计