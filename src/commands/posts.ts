import { Command } from 'commander';
import { requireToken } from '../auth.js';
import { buildUrl, request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface BufferUpdate {
  id: string;
  text: string;
  profile_id: string;
  status: string;
  created_at: number;
  sent_at?: number;
  due_at?: number;
  scheduled_at?: number;
  media?: {
    link?: string;
    picture?: string;
    description?: string;
  };
  statistics?: {
    reach?: number;
    clicks?: number;
    retweets?: number;
    favorites?: number;
    mentions?: number;
  };
  [key: string]: unknown;
}

interface UpdatesResponse {
  updates: BufferUpdate[];
  total: number;
}

interface CreateUpdateResponse {
  success: boolean;
  buffer_count: number;
  buffer_percentage: number;
  updates: BufferUpdate[];
  message?: string;
}

interface SimpleResponse {
  success: boolean;
  message?: string;
}

function formatUpdateRow(u: BufferUpdate): Record<string, unknown> {
  return {
    id: u.id,
    text: u.text?.length > 80 ? u.text.slice(0, 77) + '...' : u.text,
    status: u.status,
    profile_id: u.profile_id,
    created_at: new Date(u.created_at * 1000).toISOString(),
    due_at: u.due_at ? new Date(u.due_at * 1000).toISOString() : 'N/A',
  };
}

export function registerPostsCommands(program: Command): void {
  const posts = program.command('posts').description('Manage Buffer posts (updates)');

  posts
    .command('list')
    .description('List pending posts for a profile')
    .requiredOption('--profile-id <id>', 'Profile ID')
    .option('--count <n>', 'Number of posts to return', '20')
    .option('--page <n>', 'Page number (starting from 1)', '1')
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
        const url = buildUrl(`/profiles/${opts.profileId}/updates/pending.json`, token, {
          count: opts.count,
          page: opts.page,
        });

        if (opts.verbose) {
          console.error(`GET ${url.replace(token, '***')}`);
        }

        const result = await request<UpdatesResponse>(url);

        if (!opts.quiet) {
          console.error(`Total pending: ${result.total}`);
        }

        const data = result.updates.map(formatUpdateRow);
        printOutput(data, opts.output);
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });

  posts
    .command('sent')
    .description('List sent posts for a profile')
    .requiredOption('--profile-id <id>', 'Profile ID')
    .option('--count <n>', 'Number of posts to return', '20')
    .option('--page <n>', 'Page number (starting from 1)', '1')
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
          console.error(`Total sent: ${result.total}`);
        }

        const data = result.updates.map(formatUpdateRow);
        printOutput(data, opts.output);
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });

  posts
    .command('create')
    .description('Create a new post')
    .requiredOption('--profile-id <id...>', 'Profile ID(s) to post to')
    .requiredOption('--text <text>', 'Post text content')
    .option('--media-link <url>', 'URL to attach as media')
    .option('--media-description <text>', 'Description for the media attachment')
    .option('--scheduled-at <datetime>', 'Schedule time (ISO 8601 format)')
    .option('--now', 'Share immediately instead of adding to queue')
    .option('--dry-run', 'Show what would be sent without making the request')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: {
      profileId: string[];
      text: string;
      mediaLink?: string;
      mediaDescription?: string;
      scheduledAt?: string;
      now?: boolean;
      dryRun?: boolean;
      accessToken?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
    }) => {
      try {
        const token = requireToken(opts.accessToken);

        const formData: Record<string, string | string[]> = {
          'profile_ids[]': opts.profileId,
          text: opts.text,
        };

        if (opts.mediaLink) {
          formData['media[link]'] = opts.mediaLink;
        }
        if (opts.mediaDescription) {
          formData['media[description]'] = opts.mediaDescription;
        }
        if (opts.scheduledAt) {
          formData['scheduled_at'] = opts.scheduledAt;
        }
        if (opts.now) {
          formData['now'] = 'true';
        }

        if (opts.dryRun) {
          console.log('Dry run — would send:');
          printOutput(formData as Record<string, unknown>, opts.output);
          return;
        }

        const url = buildUrl('/updates/create.json', token);

        if (opts.verbose) {
          console.error(`POST ${url.replace(token, '***')}`);
          console.error(`Body: ${JSON.stringify(formData)}`);
        }

        const result = await request<CreateUpdateResponse>(url, {
          method: 'POST',
          formBody: formData,
        });

        if (result.success) {
          if (!opts.quiet) {
            console.error(`Post created successfully. Buffer count: ${result.buffer_count}`);
          }
          const data = result.updates.map(formatUpdateRow);
          printOutput(data, opts.output);
        } else {
          printError({ code: 'CREATE_FAILED', message: result.message ?? 'Failed to create post' }, opts.output);
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });

  posts
    .command('update')
    .description('Update an existing post')
    .requiredOption('--post-id <id>', 'Post/update ID')
    .requiredOption('--text <text>', 'New text content')
    .option('--media-link <url>', 'URL to attach as media')
    .option('--media-description <text>', 'Description for the media attachment')
    .option('--scheduled-at <datetime>', 'New schedule time (ISO 8601 format)')
    .option('--dry-run', 'Show what would be sent without making the request')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: {
      postId: string;
      text: string;
      mediaLink?: string;
      mediaDescription?: string;
      scheduledAt?: string;
      dryRun?: boolean;
      accessToken?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
    }) => {
      try {
        const token = requireToken(opts.accessToken);

        const formData: Record<string, string | string[]> = {
          text: opts.text,
        };

        if (opts.mediaLink) {
          formData['media[link]'] = opts.mediaLink;
        }
        if (opts.mediaDescription) {
          formData['media[description]'] = opts.mediaDescription;
        }
        if (opts.scheduledAt) {
          formData['scheduled_at'] = opts.scheduledAt;
        }

        if (opts.dryRun) {
          console.log('Dry run — would send:');
          printOutput({ post_id: opts.postId, ...formData } as Record<string, unknown>, opts.output);
          return;
        }

        const url = buildUrl(`/updates/${opts.postId}/update.json`, token);

        if (opts.verbose) {
          console.error(`POST ${url.replace(token, '***')}`);
        }

        const result = await request<{ success: boolean; update: BufferUpdate }>(url, {
          method: 'POST',
          formBody: formData,
        });

        if (result.success) {
          if (!opts.quiet) {
            console.error('Post updated successfully.');
          }
          printOutput(formatUpdateRow(result.update), opts.output);
        } else {
          printError({ code: 'UPDATE_FAILED', message: 'Failed to update post' }, opts.output);
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });

  posts
    .command('delete')
    .description('Delete a post')
    .requiredOption('--post-id <id>', 'Post/update ID')
    .option('--dry-run', 'Show what would be deleted without making the request')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: {
      postId: string;
      dryRun?: boolean;
      accessToken?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
    }) => {
      try {
        const token = requireToken(opts.accessToken);

        if (opts.dryRun) {
          console.log(`Dry run — would delete post: ${opts.postId}`);
          return;
        }

        const url = buildUrl(`/updates/${opts.postId}/destroy.json`, token);

        if (opts.verbose) {
          console.error(`POST ${url.replace(token, '***')}`);
        }

        const result = await request<SimpleResponse>(url, { method: 'POST' });

        if (result.success) {
          if (!opts.quiet) {
            console.error(`Post ${opts.postId} deleted.`);
          }
          printOutput({ success: true, post_id: opts.postId }, opts.output);
        } else {
          printError({ code: 'DELETE_FAILED', message: result.message ?? 'Failed to delete post' }, opts.output);
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });

  posts
    .command('share')
    .description('Share a post immediately (move to front of queue)')
    .requiredOption('--post-id <id>', 'Post/update ID')
    .option('--dry-run', 'Show what would be shared without making the request')
    .option('--access-token <token>', 'Buffer access token')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: {
      postId: string;
      dryRun?: boolean;
      accessToken?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
    }) => {
      try {
        const token = requireToken(opts.accessToken);

        if (opts.dryRun) {
          console.log(`Dry run — would share post immediately: ${opts.postId}`);
          return;
        }

        const url = buildUrl(`/updates/${opts.postId}/share.json`, token);

        if (opts.verbose) {
          console.error(`POST ${url.replace(token, '***')}`);
        }

        const result = await request<SimpleResponse>(url, { method: 'POST' });

        if (result.success) {
          if (!opts.quiet) {
            console.error(`Post ${opts.postId} shared immediately.`);
          }
          printOutput({ success: true, post_id: opts.postId }, opts.output);
        } else {
          printError({ code: 'SHARE_FAILED', message: result.message ?? 'Failed to share post' }, opts.output);
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof HttpError) {
          printError({ code: error.code, message: error.message, retry_after: error.retryAfter }, opts.output);
          process.exit(1);
        }
        throw error;
      }
    });
}
