import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerProfilesCommands } from './commands/profiles.js';
import { registerPostsCommands } from './commands/posts.js';
import { registerAnalyticsCommands } from './commands/analytics.js';

const program = new Command();

program
  .name('buffer')
  .description('Command-line interface for the Buffer social media management API')
  .version('0.1.0');

registerAuthCommands(program);
registerProfilesCommands(program);
registerPostsCommands(program);
registerAnalyticsCommands(program);

program.parse();
