# Buffer API v1 — Endpoint Inventory

## Base URL
`https://api.bufferapp.com/1`

## Authentication
- **Method:** OAuth2 access token
- **Delivery:** `access_token` query parameter or `Authorization: Bearer {token}` header
- **Token source:** Generated via Buffer Developer portal (https://buffer.com/developers/apps)

## Rate Limits
- 60 authenticated requests per user per minute
- Returns HTTP 429 on overage

## Endpoints

### User
| Method | Path | Description |
|--------|------|-------------|
| GET | `/user.json` | Get authenticated user info |

### Profiles
| Method | Path | Description |
|--------|------|-------------|
| GET | `/profiles.json` | List all connected social profiles |
| GET | `/profiles/{id}.json` | Get a specific profile by ID |

### Updates (Posts)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/profiles/{id}/updates/pending.json` | List pending (queued) updates |
| GET | `/profiles/{id}/updates/sent.json` | List sent updates |
| POST | `/updates/create.json` | Create a new update |
| POST | `/updates/{id}/update.json` | Edit an existing update |
| POST | `/updates/{id}/destroy.json` | Delete an update |
| POST | `/updates/{id}/share.json` | Share (send) an update immediately |

### Info
| Method | Path | Description |
|--------|------|-------------|
| GET | `/info/configuration.json` | Get Buffer configuration info |

## Request Formats
- GET requests: query parameters
- POST requests: `application/x-www-form-urlencoded` (NOT JSON)
- Array parameters use `key[]` notation (e.g., `profile_ids[]=id1&profile_ids[]=id2`)

## Response Shapes

### Profile
```json
{
  "id": "string",
  "service": "twitter|facebook|instagram|linkedin|...",
  "formatted_username": "string",
  "avatar": "url",
  "default": true,
  "counts": { "sent": 100, "pending": 5, "drafts": 2 },
  "created_at": 1700000000
}
```

### Updates List
```json
{
  "updates": [
    {
      "id": "string",
      "text": "string",
      "profile_id": "string",
      "status": "buffer|sent|service",
      "created_at": 1700000000,
      "due_at": 1700100000,
      "sent_at": 1700050000,
      "media": { "link": "url", "picture": "url", "description": "string" },
      "statistics": { "reach": 0, "clicks": 0, "retweets": 0, "favorites": 0, "mentions": 0 }
    }
  ],
  "total": 1
}
```

### Create Update Response
```json
{
  "success": true,
  "buffer_count": 1,
  "buffer_percentage": 10,
  "updates": [...]
}
```

### Simple Response (destroy, share)
```json
{
  "success": true
}
```

## Pagination
- `count` parameter: number of items per page (default varies)
- `page` parameter: page number (1-indexed)
- `total` field in response indicates total count
