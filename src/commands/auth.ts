import { Command } from 'commander';
import { config, saveToken, clearAuth, resolveToken } from '../auth.js';
import { buildUrl, request } from '../lib/http.js';
import { printOutput, type OutputFormat } from '../lib/output.js';

interface BufferUser {
  id: string;
  name: string;
  email?: string;
  plan?: string;
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Manage authentication');

  auth
    .command('login')
    .description('Save a Buffer access token')
    .argument('<token>', 'Buffer OAuth2 access token')
    .action(async (token: string) => {
      saveToken(token);
      console.log('Access token saved successfully.');
      console.log(`Config stored at: ${config.getConfigPath()}`);
    });

  auth
    .command('status')
    .description('Show current authentication status')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .action(async (opts: { output: OutputFormat }) => {
      const token = resolveToken();
      if (!token) {
        console.log('Not authenticated. Run: buffer auth login <token>');
        return;
      }

      try {
        const url = buildUrl('/user.json', token);
        const user = await request<BufferUser>(url);
        const data = {
          authenticated: true,
          user_id: user.id,
          name: user.name,
          email: user.email ?? 'N/A',
          plan: user.plan ?? 'N/A',
          config_path: config.getConfigPath(),
        };
        printOutput(data, opts.output);
      } catch {
        const data = {
          authenticated: true,
          token_present: true,
          token_preview: `${token.slice(0, 8)}...`,
          config_path: config.getConfigPath(),
          note: 'Could not verify token with API (may be offline)',
        };
        printOutput(data, opts.output);
      }
    });

  auth
    .command('logout')
    .description('Remove stored credentials')
    .action(() => {
      clearAuth();
      console.log('Credentials removed.');
    });
}
