import { Command } from 'commander';
import { requireToken } from '../auth.js';
import { buildUrl, request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface BufferUpdate {
  id: string;
  text: string;
  status: string;
  sent_at?: number;
  statistics?: {
    reach?: number;
    clicks?: number;
    retweets?: number;
    favorites?: number;
    mentions?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface UpdatesResponse {
  updates: BufferUpdate[];
  total: number;
}

export function registerAnalyticsCommands(program: Command): void {
  const analytics = program.command('analytics').description('View profile analytics and post interactions');

  analytics
    .command('get')
    .description('Get analytics for sent posts on a profile (interaction statistics)')
    .requiredOption('--profile-id <id>', 'Profile ID')
    .option('--count <n>', 'Number of sent posts to analyze', '20')
    .option('--page <n>', 'Page number', '1')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: {
      profileId: string;
      count: string;
      page: string;
      accessToken?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
    }) => {
      try {
        const token = requireToken(opts.accessToken);
        const url = buildUrl(`/profiles/${opts.profileId}/updates/sent.json`, token, {
          count: opts.count,
          page: opts.page,
        });

        if (opts.verbose) {
          console.error(`GET ${url.replace(token, '***')}`);
        }

        const result = await request<UpdatesResponse>(url);

        if (!opts.quiet) {
          console.error(`Analyzing ${result.updates.length} sent posts (total: ${result.total})`);
        }

        const data = result.updates.map((u) => ({
          id: u.id,
          text: u.text?.length > 60 ? u.text.slice(0, 57) + '...' : u.text,
          sent_at: u.sent_at ? new Date(u.sent_at * 1000).toISOString() : 'N/A',
          reach: u.statistics?.reach ?? 0,
          clicks: u.statistics?.clicks ?? 0,
          retweets: u.statistics?.retweets ?? 0,
          favorites: u.statistics?.favorites ?? 0,
          mentions: u.statistics?.mentions ?? 0,
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
}
