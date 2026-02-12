import { Command } from 'commander';
import { requireToken } from '../auth.js';
import { buildUrl, request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface BufferProfile {
  id: string;
  service: string;
  formatted_username: string;
  avatar: string;
  default: boolean;
  counts: {
    sent: number;
    pending: number;
    drafts: number;
  };
  created_at: number;
  [key: string]: unknown;
}

export function registerProfilesCommands(program: Command): void {
  const profiles = program.command('profiles').description('Manage Buffer social profiles');

  profiles
    .command('list')
    .description('List all connected social profiles')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { accessToken?: string; output: OutputFormat; quiet?: boolean; verbose?: boolean }) => {
      try {
        const token = requireToken(opts.accessToken);
        const url = buildUrl('/profiles.json', token);

        if (opts.verbose) {
          console.error(`GET ${url.replace(token, '***')}`);
        }

        const profiles = await request<BufferProfile[]>(url);
        const data = profiles.map((p) => ({
          id: p.id,
          service: p.service,
          username: p.formatted_username,
          pending: p.counts?.pending ?? 0,
          sent: p.counts?.sent ?? 0,
          drafts: p.counts?.drafts ?? 0,
          default: p.default,
        }));

        printOutput(data, opts.output);
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });

  profiles
    .command('get')
    .description('Get details for a specific profile')
    .requiredOption('--profile-id <id>', 'Profile ID')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { profileId: string; accessToken?: string; output: OutputFormat; quiet?: boolean; verbose?: boolean }) => {
      try {
        const token = requireToken(opts.accessToken);
        const url = buildUrl(`/profiles/${opts.profileId}.json`, token);

        if (opts.verbose) {
          console.error(`GET ${url.replace(token, '***')}`);
        }

        const profile = await request<BufferProfile>(url);
        const data = {
          id: profile.id,
          service: profile.service,
          username: profile.formatted_username,
          avatar: profile.avatar,
          default: profile.default,
          pending: profile.counts?.pending ?? 0,
          sent: profile.counts?.sent ?? 0,
          drafts: profile.counts?.drafts ?? 0,
          created_at: new Date(profile.created_at * 1000).toISOString(),
        };

        printOutput(data, opts.output);
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });
}
