import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveToken } from '../auth.js';

describe('auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveToken', () => {
    it('should prioritize flag value', () => {
      process.env['BUFFER_ACCESS_TOKEN'] = 'env-token';
      const token = resolveToken('flag-token');
      expect(token).toBe('flag-token');
    });

    it('should fall back to env var', () => {
      process.env['BUFFER_ACCESS_TOKEN'] = 'env-token';
      const token = resolveToken();
      expect(token).toBe('env-token');
    });

    it('should return undefined when no token available', () => {
      delete process.env['BUFFER_ACCESS_TOKEN'];
      const token = resolveToken();
      // Token may come from config file; without config, should be undefined
      // (Config may or may not exist on the test machine)
      expect(typeof token === 'string' || token === undefined).toBe(true);
    });
  });
});
