# buffer-cli

[![npm version](https://img.shields.io/npm/v/@marketing-clis/buffer-cli)](https://www.npmjs.com/package/@marketing-clis/buffer-cli)
[![CI](https://github.com/marketing-clis/buffer-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/marketing-clis/buffer-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Command-line interface for the Buffer social media management API. Manage profiles, schedule posts, and view analytics from your terminal.

## Install

```bash
npm install -g @marketing-clis/buffer-cli
```

## Quick Start

```bash
# Save your Buffer access token
buffer auth login <your-access-token>

# List connected social profiles
buffer profiles list --output table

# Create a post
buffer posts create --profile-id <id> --text "Hello from the CLI!"

# Schedule a post
buffer posts create --profile-id <id> --text "Scheduled post" --scheduled-at "2024-03-01T09:00:00Z"

# View sent posts with engagement stats
buffer analytics get --profile-id <id> --output table
```

## Authentication

Buffer uses OAuth2 access tokens. You can obtain one from the [Buffer Developer portal](https://buffer.com/developers/apps).

### Option 1: Auth login (recommended)
```bash
buffer auth login <your-access-token>
```

### Option 2: Environment variable
```bash
export BUFFER_ACCESS_TOKEN=your-token-here
buffer profiles list
```

### Option 3: Per-command flag
```bash
buffer profiles list --access-token your-token-here
```

### Check auth status
```bash
buffer auth status
```

### Remove credentials
```bash
buffer auth logout
```

## Command Reference

### auth
```bash
buffer auth login <token>     # Save access token
buffer auth status            # Show current auth status
buffer auth logout            # Remove stored credentials
```

### profiles
```bash
buffer profiles list                        # List all connected profiles
buffer profiles get --profile-id <id>       # Get details for a profile
```

### posts
```bash
# List posts
buffer posts list --profile-id <id>                           # List pending posts
buffer posts sent --profile-id <id>                           # List sent posts
buffer posts list --profile-id <id> --count 50 --page 2       # Paginate results

# Create posts
buffer posts create --profile-id <id> --text "Hello world"
buffer posts create --profile-id <id> <id2> --text "Multi-profile post"
buffer posts create --profile-id <id> --text "With link" --media-link https://example.com
buffer posts create --profile-id <id> --text "Scheduled" --scheduled-at "2024-03-01T09:00:00Z"
buffer posts create --profile-id <id> --text "Share now" --now

# Modify posts
buffer posts update --post-id <id> --text "Updated text"
buffer posts delete --post-id <id>
buffer posts share --post-id <id>                              # Share immediately

# Dry run (preview without sending)
buffer posts create --profile-id <id> --text "Test" --dry-run
buffer posts delete --post-id <id> --dry-run
```

### analytics
```bash
buffer analytics get --profile-id <id>                         # View post analytics
buffer analytics get --profile-id <id> --count 50 --output csv # Export analytics
```

## Output Formats

All data commands support `--output` (`-o`) with three formats:

```bash
buffer profiles list -o json    # JSON (default) — machine-readable
buffer profiles list -o table   # Table — human-readable aligned columns
buffer profiles list -o csv     # CSV — for spreadsheets and data pipelines
```

Additional flags:
- `--quiet` (`-q`) — suppress status messages, output only data
- `--verbose` (`-v`) — debug logging including HTTP request URLs

## Configuration

Config file location: `~/.config/buffer-cli/config.json`

```json
{
  "auth": {
    "oauth_token": "your-access-token"
  },
  "defaults": {
    "output": "table"
  }
}
```

## Development

```bash
git clone https://github.com/marketing-clis/buffer-cli.git
cd buffer-cli
pnpm install
pnpm run build
pnpm run test
pnpm run typecheck
pnpm run lint
```

## Part of Marketing CLIs

This tool is part of [Marketing CLIs](https://github.com/marketing-clis/marketing-clis) — open source CLIs for marketing tools that lack them. Consistent auth, output formats, and error handling across all tools.

## License

MIT
