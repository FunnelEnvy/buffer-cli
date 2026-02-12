import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { request, buildUrl } from '../lib/http.js';

const BASE = 'https://api.bufferapp.com';
const TOKEN = 'test-token-123';

const mockUpdate = {
  id: 'upd_1',
  text: 'Hello world from Buffer CLI!',
  profile_id: 'prof_1',
  status: 'buffer',
  created_at: 1700000000,
  due_at: 1700100000,
  media: {},
  statistics: {},
};

describe('posts', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /profiles/:id/updates/pending.json', () => {
    it('should list pending posts', async () => {
      nock(BASE)
        .get('/1/profiles/prof_1/updates/pending.json')
        .query({ access_token: TOKEN, count: '20', page: '1' })
        .reply(200, {
          updates: [mockUpdate],
          total: 1,
        });

      const url = buildUrl('/profiles/prof_1/updates/pending.json', TOKEN, {
        count: '20',
        page: '1',
      });
      const result = await request<{ updates: typeof mockUpdate[]; total: number }>(url);

      expect(result.total).toBe(1);
      expect(result.updates).toHaveLength(1);
      expect(result.updates[0].id).toBe('upd_1');
      expect(result.updates[0].text).toBe('Hello world from Buffer CLI!');
    });

    it('should handle empty pending queue', async () => {
      nock(BASE)
        .get('/1/profiles/prof_1/updates/pending.json')
        .query({ access_token: TOKEN, count: '20', page: '1' })
        .reply(200, {
          updates: [],
          total: 0,
        });

      const url = buildUrl('/profiles/prof_1/updates/pending.json', TOKEN, {
        count: '20',
        page: '1',
      });
      const result = await request<{ updates: unknown[]; total: number }>(url);

      expect(result.total).toBe(0);
      expect(result.updates).toHaveLength(0);
    });
  });

  describe('GET /profiles/:id/updates/sent.json', () => {
    it('should list sent posts', async () => {
      const sentUpdate = {
        ...mockUpdate,
        id: 'upd_2',
        status: 'sent',
        sent_at: 1700050000,
        statistics: { reach: 500, clicks: 25, retweets: 10, favorites: 30, mentions: 2 },
      };

      nock(BASE)
        .get('/1/profiles/prof_1/updates/sent.json')
        .query({ access_token: TOKEN, count: '10', page: '1' })
        .reply(200, {
          updates: [sentUpdate],
          total: 1,
        });

      const url = buildUrl('/profiles/prof_1/updates/sent.json', TOKEN, {
        count: '10',
        page: '1',
      });
      const result = await request<{ updates: typeof sentUpdate[]; total: number }>(url);

      expect(result.updates[0].status).toBe('sent');
      expect(result.updates[0].statistics.clicks).toBe(25);
    });
  });

  describe('POST /updates/create.json', () => {
    it('should create a post', async () => {
      nock(BASE)
        .post('/1/updates/create.json')
        .query({ access_token: TOKEN })
        .reply(200, {
          success: true,
          buffer_count: 1,
          buffer_percentage: 10,
          updates: [mockUpdate],
        });

      const url = buildUrl('/updates/create.json', TOKEN);
      const result = await request<{
        success: boolean;
        buffer_count: number;
        updates: typeof mockUpdate[];
      }>(url, {
        method: 'POST',
        formBody: {
          'profile_ids[]': ['prof_1'],
          text: 'Hello world from Buffer CLI!',
        },
      });

      expect(result.success).toBe(true);
      expect(result.buffer_count).toBe(1);
      expect(result.updates).toHaveLength(1);
    });

    it('should create a post with media', async () => {
      nock(BASE)
        .post('/1/updates/create.json')
        .query({ access_token: TOKEN })
        .reply(200, {
          success: true,
          buffer_count: 1,
          buffer_percentage: 10,
          updates: [{ ...mockUpdate, media: { link: 'https://example.com' } }],
        });

      const url = buildUrl('/updates/create.json', TOKEN);
      const result = await request<{ success: boolean; updates: unknown[] }>(url, {
        method: 'POST',
        formBody: {
          'profile_ids[]': ['prof_1'],
          text: 'Check this out!',
          'media[link]': 'https://example.com',
        },
      });

      expect(result.success).toBe(true);
    });

    it('should create a scheduled post', async () => {
      nock(BASE)
        .post('/1/updates/create.json')
        .query({ access_token: TOKEN })
        .reply(200, {
          success: true,
          buffer_count: 1,
          buffer_percentage: 10,
          updates: [{ ...mockUpdate, scheduled_at: 1700200000 }],
        });

      const url = buildUrl('/updates/create.json', TOKEN);
      const result = await request<{ success: boolean }>(url, {
        method: 'POST',
        formBody: {
          'profile_ids[]': ['prof_1'],
          text: 'Scheduled post',
          scheduled_at: '2024-03-01T09:00:00Z',
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('POST /updates/:id/update.json', () => {
    it('should update a post', async () => {
      nock(BASE)
        .post('/1/updates/upd_1/update.json')
        .query({ access_token: TOKEN })
        .reply(200, {
          success: true,
          update: { ...mockUpdate, text: 'Updated text' },
        });

      const url = buildUrl('/updates/upd_1/update.json', TOKEN);
      const result = await request<{ success: boolean; update: typeof mockUpdate }>(url, {
        method: 'POST',
        formBody: { text: 'Updated text' },
      });

      expect(result.success).toBe(true);
      expect(result.update.text).toBe('Updated text');
    });
  });

  describe('POST /updates/:id/destroy.json', () => {
    it('should delete a post', async () => {
      nock(BASE)
        .post('/1/updates/upd_1/destroy.json')
        .query({ access_token: TOKEN })
        .reply(200, { success: true });

      const url = buildUrl('/updates/upd_1/destroy.json', TOKEN);
      const result = await request<{ success: boolean }>(url, { method: 'POST' });

      expect(result.success).toBe(true);
    });
  });

  describe('POST /updates/:id/share.json', () => {
    it('should share a post immediately', async () => {
      nock(BASE)
        .post('/1/updates/upd_1/share.json')
        .query({ access_token: TOKEN })
        .reply(200, { success: true });

      const url = buildUrl('/updates/upd_1/share.json', TOKEN);
      const result = await request<{ success: boolean }>(url, { method: 'POST' });

      expect(result.success).toBe(true);
    });
  });

  describe('rate limiting', () => {
    it('should throw on 429 rate limit', async () => {
      nock(BASE)
        .get('/1/profiles/prof_1/updates/pending.json')
        .query({ access_token: TOKEN })
        .reply(429, { error: 'Rate limit exceeded' }, { 'Retry-After': '60' });

      const url = buildUrl('/profiles/prof_1/updates/pending.json', TOKEN);
      await expect(request(url)).rejects.toThrow('Rate limit exceeded');
    });
  });
});
