import type { OpenAISetting } from './types';
import { encode, decode } from 'js-base64';

/**
 * 防抖函数
 * 在指定延迟时间内，如果函数被多次调用，只执行最后一次调用
 * @param fn - 需要执行的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖处理后的函数，调用该函数会在延迟后执行原函数
 * @example
 * ```ts
 * const debouncedFn = debounce((value: string) => {
 *   console.log(value);
 * }, 300);
 * debouncedFn('hello'); // 300ms 后输出 'hello'
 * ```
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
 * 在指定时间间隔内，函数最多执行一次
 * @param fn - 需要执行的函数
 * @param interval - 间隔时间（毫秒）
 * @returns 节流处理后的函数，调用该函数会在间隔时间后执行原函数
 * @example
 * ```ts
 * const throttledFn = throttle((value: string) => {
 *   console.log(value);
 * }, 300);
 * throttledFn('hello'); // 立即执行
 * throttledFn('world'); // 被忽略（300ms 内）
 * ```
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
 * 深克隆函数
 * 递归克隆对象，创建完全独立的对象副本
 * @param obj - 需要克隆的对象
 * @returns 克隆后的新对象，与原对象完全独立
 * @example
 * ```ts
 * const original = { a: 1, b: { c: 2 } };
 * const cloned = cloneDeep(original);
 * cloned.b.c = 3;
 * console.log(original.b.c); // 仍然是 2
 * ```
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

/**
 * 简单深克隆函数
 * 使用 JSON 序列化/反序列化的方式实现深克隆
 * 注意：此方法无法处理函数、undefined、Symbol、循环引用等特殊值
 * @param obj - 需要克隆的对象
 * @returns 克隆后的新对象，如果克隆失败则返回原对象
 * @throws 当对象包含无法序列化的值时，会在控制台输出错误并返回原对象
 * @example
 * ```ts
 * const original = { a: 1, b: { c: 2 } };
 * const cloned = simpleCloneDeep(original);
 * cloned.b.c = 3;
 * console.log(original.b.c); // 仍然是 2
 * ```
 */
export function simpleCloneDeep<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('simpleCloneDeep failed:', error);
    return obj;
  }
}

/**
 * 将 OpenAI 设置对象序列化为 Base64 编码的字符串
 * @param setting - OpenAI 设置对象，包含 baseURL 和 apiKey 等配置
 * @returns Base64 编码的字符串，如果序列化失败则返回空字符串
 * @throws 当序列化失败时，会在控制台输出错误并返回空字符串
 * @example
 * ```ts
 * const setting = { baseURL: 'https://api.openai.com', apiKey: 'sk-xxx' };
 * const encoded = stringifyOpenAISetting(setting);
 * console.log(encoded); // Base64 编码的字符串
 * ```
 */
export function stringifyOpenAISetting(setting: OpenAISetting) {
  try {
    return encode(JSON.stringify(setting));
  } catch (error) {
    console.error('stringifyOpenAISetting failed:', error);
    return '';
  }
}

/**
 * 解析 Base64 编码的字符串为 OpenAI 设置对象
 * @param setting - Base64 编码的字符串
 * @returns 解析后的 OpenAI 设置对象，如果解析失败则返回空对象
 * @throws 当解析失败时，会在控制台输出错误并返回空对象
 * @example
 * ```ts
 * const encoded = 'eyJiYXNlVVJMIjoiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbSJ9';
 * const setting = parseOpenAISetting(encoded);
 * console.log(setting); // { baseURL: 'https://api.openai.com', ... }
 * ```
 */
export function parseOpenAISetting(setting: string): OpenAISetting {
  try {
    return JSON.parse(decode(setting));
  } catch (error) {
    console.error('parseOpenAISetting failed:', error);
    return {} as OpenAISetting;
  }
}