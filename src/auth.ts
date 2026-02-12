import { ConfigManager } from './lib/config.js';

const config = new ConfigManager('buffer');

export { config };

/**
 * Resolves the access token from flag > env > config.
 * Buffer uses OAuth2 access tokens (not API keys), but the flow is the same.
 */
export function resolveToken(flagValue?: string): string | undefined {
  if (flagValue) return flagValue;
  const envVal = process.env['BUFFER_ACCESS_TOKEN'];
  if (envVal) return envVal;
  return config.read().auth?.oauth_token;
}

/**
 * Requires an access token or exits with an error.
 */
export function requireToken(flagValue?: string): string {
  const token = resolveToken(flagValue);
  if (!token) {
    console.error(
      `No access token found. Provide one via:\n` +
        `  1. --access-token flag\n` +
        `  2. BUFFER_ACCESS_TOKEN environment variable\n` +
        `  3. buffer auth login`,
    );
    process.exit(1);
  }
  return token;
}

/**
 * Saves an access token to the config file.
 */
export function saveToken(token: string): void {
  const cfg = config.read();
  cfg.auth = { ...cfg.auth, oauth_token: token };
  config.write(cfg);
}

/**
 * Clears stored auth credentials.
 */
export function clearAuth(): void {
  const cfg = config.read();
  delete cfg.auth;
  config.write(cfg);
}
