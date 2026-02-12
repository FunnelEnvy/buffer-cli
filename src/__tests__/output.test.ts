import { describe, it, expect } from 'vitest';
import { formatOutput } from '../lib/output.js';

describe('output formatting', () => {
  const sampleData = [
    { id: '1', name: 'Twitter', status: 'active' },
    { id: '2', name: 'Facebook', status: 'inactive' },
  ];

  describe('json format', () => {
    it('should format array as JSON', () => {
      const result = formatOutput(sampleData, 'json');
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('1');
    });

    it('should format single object as JSON', () => {
      const result = formatOutput({ id: '1', name: 'test' }, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('1');
    });
  });

  describe('table format', () => {
    it('should format as table', () => {
      const result = formatOutput(sampleData, 'table');
      expect(result).toContain('Twitter');
      expect(result).toContain('Facebook');
      expect(result).toContain('active');
    });

    it('should show "No data" for empty array', () => {
      const result = formatOutput([], 'table');
      expect(result).toBe('No data');
    });
  });

  describe('csv format', () => {
    it('should format as CSV with headers', () => {
      const result = formatOutput(sampleData, 'csv');
      const lines = result.trim().split('\n');
      expect(lines[0]).toBe('id,name,status');
      expect(lines[1]).toBe('1,Twitter,active');
      expect(lines[2]).toBe('2,Facebook,inactive');
    });

    it('should return empty string for empty array', () => {
      const result = formatOutput([], 'csv');
      expect(result).toBe('');
    });
  });
});
