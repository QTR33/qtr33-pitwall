import { IS_DEV } from '../env.js';

const noop = () => {};

/** Console logging for development only; every method is a no-op in production. */
export const logger = {
  debug: IS_DEV ? console.debug.bind(console) : noop,
  info: IS_DEV ? console.info.bind(console) : noop,
  warn: IS_DEV ? console.warn.bind(console) : noop,
  error: IS_DEV ? console.error.bind(console) : noop,
  /** Raw feed message. Logged at debug level so it stays hidden unless "Verbose" is enabled. */
  signal: IS_DEV
    ? (topic: string, data: unknown) => console.debug(`[signal] ${topic}`, data)
    : noop,
};
