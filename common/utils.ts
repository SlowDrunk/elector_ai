
/**
 * 防抖函数
 * @param fn 需要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: NodeJS.Timeout | null = null;
    return function (this: any, ...args: Parameters<T>) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
  
  /**
   * 节流函数
   * @param fn 需要执行的函数
   * @param interval 间隔时间（毫秒）
   * @returns 节流处理后的函数
   */
  export function throttle<T extends (...args: any[]) => any>(fn: T, interval: number): (...args: Parameters<T>) => void {
    let lastTime = 0;
    return function (this: any, ...args: Parameters<T>) {
      const now = Date.now();
      if (now - lastTime >= interval) {
        fn.apply(this, args);
        lastTime = now;
      }
    };
  }

  /**
   * 深克隆
   * @param obj 需要克隆的对象
   * @returns 克隆后的新对象
   */
  export function cloneDeep<T>(obj: T): T {
    // 处理 null 和 undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // 处理原始类型
    if (typeof obj !== 'object') {
      return obj;
    }

    // 处理 Date 对象
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    // 处理 RegExp 对象
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as T;
    }

    // 处理 Map
    if (obj instanceof Map) {
      const clonedMap = new Map();
      obj.forEach((value, key) => {
        clonedMap.set(cloneDeep(key), cloneDeep(value));
      });
      return clonedMap as T;
    }

    // 处理 Set
    if (obj instanceof Set) {
      const clonedSet = new Set();
      obj.forEach((value) => {
        clonedSet.add(cloneDeep(value));
      });
      return clonedSet as T;
    }

    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => cloneDeep(item)) as T;
    }

    // 处理普通对象
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = cloneDeep(obj[key]);
      }
    }

    return clonedObj;
  }