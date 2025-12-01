import type { ComponentPublicInstance, Plugin } from 'vue';
import logger from './logger';

/**
 * 将各种错误对象转换成可安全序列化的数据，避免
 * “An object could not be cloned”。
 */
const toSerializable = (value: unknown): unknown => {
  if (value instanceof Error) {
    const { name, message, stack } = value;
    const cause = (value as Error & { cause?: unknown }).cause;
    return {
      name,
      message,
      stack,
      ...(cause ? { cause: toSerializable(cause) } : {})
    };
  }

  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value.name || 'anonymous function';

  if (value && typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value.constructor?.name ?? '[Unserializable Object]';
    }
  }

  return value;
};

const getComponentName = (instance: ComponentPublicInstance | null) =>
  instance?.$options?.name ||
  instance?.$options?.__file ||
  'anonymous-component';

export const errorHandler: Plugin = function (app) {
  app.config.errorHandler = (err, instance, info) => {
    logger.error('Vue error:', toSerializable(err), {
      component: getComponentName(instance),
      info
    });
  };

  window.onerror = (message, source, lineno, colno, error) => {
    logger.error(
      'Window error:',
      message,
      source,
      lineno,
      colno,
      toSerializable(error)
    );
  };

  window.onunhandledrejection = (event) => {
    logger.error(
      'Unhandled Promise Rejection:',
      toSerializable(event.reason ?? event.type)
    );
  };
};

export default errorHandler;