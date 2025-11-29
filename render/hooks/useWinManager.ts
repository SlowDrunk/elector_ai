/**
 * 窗口管理器 Hook
 * 
 * 提供窗口控制功能，包括关闭、最小化、最大化等操作
 * 以及窗口最大化状态的响应式管理
 * 
 * @returns 返回窗口控制方法和状态
 */
export function useWinManager() {
    /** 窗口是否处于最大化状态的响应式引用 */
    const isMaximized = ref(false)
  
    /**
     * 关闭当前窗口
     */
    function closeWindow() {
      window.api.closeWindow();
    }
  
    /**
     * 最小化当前窗口
     */
    function minimizeWindow() {
      window.api.minimizeWindow();
    }
  
    /**
     * 切换窗口最大化/还原状态
     */
    function maximizeWindow() {
      window.api.maximizeWindow();
    }
  
    /**
     * 组件挂载时初始化窗口状态
     * - 获取当前窗口的最大化状态
     * - 监听窗口最大化状态变化并同步更新响应式状态
     */
    onMounted(async () => {
      await nextTick();
      // 获取初始最大化状态
      isMaximized.value = await window.api.isWindowMaximized();
      // 监听窗口最大化状态变化
      window.api.onWindowMaximized((_isMaximized: boolean) => isMaximized.value = _isMaximized);
    })
  
    return {
      /** 窗口是否处于最大化状态 */
      isMaximized,
      /** 关闭窗口方法 */
      closeWindow,
      /** 最小化窗口方法 */
      minimizeWindow,
      /** 切换窗口最大化/还原状态方法 */
      maximizeWindow
    }
  };
  
  export default useWinManager;