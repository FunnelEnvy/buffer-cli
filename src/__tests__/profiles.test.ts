import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { request, buildUrl } from '../lib/http.js';

const BASE = 'https://api.bufferapp.com';
const TOKEN = 'test-token-123';

describe('profiles', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /profiles.json', () => {
    it('should list all profiles', async () => {
      const mockProfiles = [
        {
          id: 'prof_1',
          service: 'twitter',
          formatted_username: '@testuser',
          avatar: 'https://example.com/avatar.jpg',
          default: true,
          counts: { sent: 100, pending: 5, drafts: 2 },
          created_at: 1700000000,
        },
        {
          id: 'prof_2',
          service: 'facebook',
          formatted_username: 'Test Page',
          avatar: 'https://example.com/avatar2.jpg',
          default: false,
          counts: { sent: 50, pending: 3, drafts: 0 },
          created_at: 1700100000,
        },
      ];

      nock(BASE)
        .get('/1/profiles.json')
        .query({ access_token: TOKEN })
        .reply(200, mockProfiles);

      const url = buildUrl('/profiles.json', TOKEN);
      const result = await request<typeof mockProfiles>(url);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('prof_1');
      expect(result[0].service).toBe('twitter');
      expect(result[0].formatted_username).toBe('@testuser');
      expect(result[1].id).toBe('prof_2');
      expect(result[1].service).toBe('facebook');
    });

    it('should return empty array when no profiles', async () => {
      nock(BASE)
        .get('/1/profiles.json')
        .query({ access_token: TOKEN })
        .reply(200, []);

      const url = buildUrl('/profiles.json', TOKEN);
      const result = await request<unknown[]>(url);

      expect(result).toHaveLength(0);
    });
  });

  describe('GET /profiles/:id.json', () => {
    it('should get a specific profile', async () => {
      const mockProfile = {
        id: 'prof_1',
        service: 'twitter',
        formatted_username: '@testuser',
        avatar: 'https://example.com/avatar.jpg',
        default: true,
        counts: { sent: 100, pending: 5, drafts: 2 },
        created_at: 1700000000,
      };

      nock(BASE)
        .get('/1/profiles/prof_1.json')
        .query({ access_token: TOKEN })
        .reply(200, mockProfile);

      const url = buildUrl('/profiles/prof_1.json', TOKEN);
      const result = await request<typeof mockProfile>(url);

      expect(result.id).toBe('prof_1');
      expect(result.service).toBe('twitter');
      expect(result.counts.sent).toBe(100);
    });

    it('should handle 401 unauthorized', async () => {
      nock(BASE)
        .get('/1/profiles/prof_1.json')
        .query({ access_token: 'bad-token' })
        .reply(401, { error: 'Unauthorized' });

      const url = buildUrl('/profiles/prof_1.json', 'bad-token');
      await expect(request(url)).rejects.toThrow('Authentication failed');
    });

    it('should handle 404 not found', async () => {
      nock(BASE)
        .get('/1/profiles/nonexistent.json')
        .query({ access_token: TOKEN })
        .reply(404, { error: 'Profile not found' });

      const url = buildUrl('/profiles/nonexistent.json', TOKEN);
      await expect(request(url)).rejects.toThrow();
    });
  });
});
