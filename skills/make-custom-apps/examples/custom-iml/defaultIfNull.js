function defaultIfNull(value, fallback) {
  for (const candidate of [value, fallback]) {
    const type = typeof candidate;
    const supported = candidate === null || candidate === undefined ||
      type === 'string' || type === 'boolean' ||
      (type === 'number' && Number.isFinite(candidate));
    if (!supported) {
      throw new TypeError('Expected a scalar or nullish value');
    }
  }
  return value === null || value === undefined ? fallback : value;
}
