# Buffer CLI — Agent Reference

## Command Inventory

### auth
| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `buffer auth login <token>` | `token` | — | Save access token |
| `buffer auth status` | — | `-o` | Show auth status |
| `buffer auth logout` | — | — | Remove credentials |

### profiles
| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `buffer profiles list` | — | `--access-token`, `-o`, `-q`, `-v` | List all profiles |
| `buffer profiles get` | `--profile-id` | `--access-token`, `-o`, `-q`, `-v` | Get profile details |

### posts
| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `buffer posts list` | `--profile-id` | `--count`, `--page`, `--access-token`, `-o`, `-q`, `-v` | List pending posts |
| `buffer posts sent` | `--profile-id` | `--count`, `--page`, `--access-token`, `-o`, `-q`, `-v` | List sent posts |
| `buffer posts create` | `--profile-id`, `--text` | `--media-link`, `--media-description`, `--scheduled-at`, `--now`, `--dry-run`, `--access-token`, `-o`, `-q`, `-v` | Create a post |
| `buffer posts update` | `--post-id`, `--text` | `--media-link`, `--media-description`, `--scheduled-at`, `--dry-run`, `--access-token`, `-o`, `-q`, `-v` | Update a post |
| `buffer posts delete` | `--post-id` | `--dry-run`, `--access-token`, `-o`, `-q`, `-v` | Delete a post |
| `buffer posts share` | `--post-id` | `--dry-run`, `--access-token`, `-o`, `-q`, `-v` | Share immediately |

### analytics
| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `buffer analytics get` | `--profile-id` | `--count`, `--page`, `--access-token`, `-o`, `-q`, `-v` | Get post analytics |

## Auth Setup Sequence

1. Obtain an access token from https://buffer.com/developers/apps
2. Run `buffer auth login <token>` to save it
3. Or set `BUFFER_ACCESS_TOKEN` environment variable
4. Verify with `buffer auth status`

Token priority: `--access-token` flag > `BUFFER_ACCESS_TOKEN` env var > config file

## Common Workflows

### Post to multiple profiles
```bash
# Get profile IDs
PROFILES=$(buffer profiles list -o json | jq -r '.[].id')

# Post to a specific profile
buffer posts create --profile-id prof_abc123 --text "Hello world!"

# Post to multiple profiles
buffer posts create --profile-id prof_abc123 prof_def456 --text "Cross-post!"
```

### Schedule a batch of posts
```bash
buffer posts create --profile-id prof_abc123 --text "Morning post" --scheduled-at "2024-03-01T09:00:00Z"
buffer posts create --profile-id prof_abc123 --text "Afternoon post" --scheduled-at "2024-03-01T14:00:00Z"
buffer posts create --profile-id prof_abc123 --text "Evening post" --scheduled-at "2024-03-01T19:00:00Z"
```

### Export analytics to CSV
```bash
buffer analytics get --profile-id prof_abc123 --count 100 -o csv > analytics.csv
```

### Check queue and share next post immediately
```bash
# See what's in the queue
buffer posts list --profile-id prof_abc123 -o table

# Share the next post right now
buffer posts share --post-id upd_xyz789
```

## Output Format Notes

### JSON output (default)
- Arrays returned for list commands
- Single objects for get/create/update
- Error format: `{"error": {"code": "ERROR_CODE", "message": "..."}}`

### Table output
- Human-readable aligned columns
- Long text fields are truncated with `...`
- Timestamps shown in ISO 8601

### CSV output
- Headers in first row
- Suitable for piping to spreadsheets or data tools

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_FAILED` | Invalid or expired token | Run `buffer auth login <new-token>` |
| `AUTH_MISSING` | No token provided | Set token via flag, env var, or config |
| `RATE_LIMITED` | 60 req/min limit exceeded | Wait and retry (auto-retry built in) |
| `API_ERROR` | General API error | Check message for details |
| `CREATE_FAILED` | Post creation failed | Check profile ID and text content |
| `UPDATE_FAILED` | Post update failed | Check post ID is valid and pending |
| `DELETE_FAILED` | Post deletion failed | Check post ID exists |
| `SHARE_FAILED` | Immediate share failed | Check post ID is in pending queue |

## Rate Limits

- **Limit:** 60 authenticated requests per user per minute
- **Response:** HTTP 429 with `Retry-After` header
- **CLI behavior:** Auto-retry with exponential backoff (up to 3 retries)
- **Best practice:** Use `--count` to fetch more items per request to reduce request count
