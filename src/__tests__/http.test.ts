import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { request, buildUrl, HttpError } from '../lib/http.js';

const BASE = 'https://api.bufferapp.com';
const TOKEN = 'test-token';

describe('http', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('buildUrl', () => {
    it('should build URL with access_token', () => {
      const url = buildUrl('/profiles.json', 'mytoken');
      expect(url).toContain('https://api.bufferapp.com/1/profiles.json');
      expect(url).toContain('access_token=mytoken');
    });

    it('should include extra params', () => {
      const url = buildUrl('/profiles.json', 'mytoken', { count: '10', page: '2' });
      expect(url).toContain('count=10');
      expect(url).toContain('page=2');
    });
  });

  describe('request', () => {
    it('should make GET requests', async () => {
      nock(BASE)
        .get('/1/user.json')
        .query({ access_token: TOKEN })
        .reply(200, { id: 'user_1', name: 'Test User' });

      const url = buildUrl('/user.json', TOKEN);
      const result = await request<{ id: string; name: string }>(url);

      expect(result.id).toBe('user_1');
      expect(result.name).toBe('Test User');
    });

    it('should make POST requests with form body', async () => {
      nock(BASE)
        .post('/1/updates/create.json', 'profile_ids%5B%5D=prof_1&text=Hello')
        .query({ access_token: TOKEN })
        .reply(200, { success: true, updates: [] });

      const url = buildUrl('/updates/create.json', TOKEN);
      const result = await request<{ success: boolean }>(url, {
        method: 'POST',
        formBody: { 'profile_ids[]': ['prof_1'], text: 'Hello' },
      });

      expect(result.success).toBe(true);
    });

    it('should throw HttpError on 401', async () => {
      nock(BASE)
        .get('/1/profiles.json')
        .query({ access_token: 'bad' })
        .reply(401, { error: 'Unauthorized' });

      const url = buildUrl('/profiles.json', 'bad');
      try {
        await request(url);
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).code).toBe('AUTH_FAILED');
        expect((error as HttpError).status).toBe(401);
      }
    });

    it('should throw HttpError on 429 with retry_after', async () => {
      nock(BASE)
        .get('/1/profiles.json')
        .query({ access_token: TOKEN })
        .reply(429, { error: 'Rate limited' }, { 'Retry-After': '30' });

      const url = buildUrl('/profiles.json', TOKEN);
      try {
        await request(url);
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).code).toBe('RATE_LIMITED');
        expect((error as HttpError).retryAfter).toBe(30);
      }
    });

    it('should throw HttpError on 500', async () => {
      nock(BASE)
        .get('/1/profiles.json')
        .query({ access_token: TOKEN })
        .reply(500, 'Internal Server Error');

      const url = buildUrl('/profiles.json', TOKEN);
      try {
        await request(url);
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(500);
      }
    });
  });
});
