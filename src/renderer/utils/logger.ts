const isDevelopment = (): boolean => {
  if (typeof process === 'undefined') {
    return false;
  }

  return process.env.NODE_ENV === 'development';
};

export function log(...args: unknown[]): void {
  if (isDevelopment()) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export function error(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.error(...args);
}
