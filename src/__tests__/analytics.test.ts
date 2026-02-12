import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { request, buildUrl } from '../lib/http.js';

const BASE = 'https://api.bufferapp.com';
const TOKEN = 'test-token-123';

describe('analytics', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /profiles/:id/updates/sent.json (analytics)', () => {
    it('should return sent posts with interaction statistics', async () => {
      const sentUpdates = [
        {
          id: 'upd_1',
          text: 'First post with great engagement',
          status: 'sent',
          sent_at: 1700050000,
          statistics: { reach: 1200, clicks: 85, retweets: 42, favorites: 110, mentions: 8 },
        },
        {
          id: 'upd_2',
          text: 'Second post with moderate engagement',
          status: 'sent',
          sent_at: 1700060000,
          statistics: { reach: 600, clicks: 30, retweets: 15, favorites: 45, mentions: 3 },
        },
        {
          id: 'upd_3',
          text: 'Third post with no statistics yet',
          status: 'sent',
          sent_at: 1700070000,
          statistics: {},
        },
      ];

      nock(BASE)
        .get('/1/profiles/prof_1/updates/sent.json')
        .query({ access_token: TOKEN, count: '20', page: '1' })
        .reply(200, {
          updates: sentUpdates,
          total: 3,
        });

      const url = buildUrl('/profiles/prof_1/updates/sent.json', TOKEN, {
        count: '20',
        page: '1',
      });
      const result = await request<{ updates: typeof sentUpdates; total: number }>(url);

      expect(result.total).toBe(3);
      expect(result.updates).toHaveLength(3);

      // First post should have full statistics
      expect(result.updates[0].statistics.reach).toBe(1200);
      expect(result.updates[0].statistics.clicks).toBe(85);

      // Third post should have empty statistics
      expect(result.updates[2].statistics).toEqual({});
    });

    it('should handle pagination', async () => {
      nock(BASE)
        .get('/1/profiles/prof_1/updates/sent.json')
        .query({ access_token: TOKEN, count: '5', page: '2' })
        .reply(200, {
          updates: [
            {
              id: 'upd_6',
              text: 'Page 2 post',
              status: 'sent',
              sent_at: 1700080000,
              statistics: { reach: 300, clicks: 10 },
            },
          ],
          total: 6,
        });

      const url = buildUrl('/profiles/prof_1/updates/sent.json', TOKEN, {
        count: '5',
        page: '2',
      });
      const result = await request<{ updates: unknown[]; total: number }>(url);

      expect(result.total).toBe(6);
      expect(result.updates).toHaveLength(1);
    });
  });
});
