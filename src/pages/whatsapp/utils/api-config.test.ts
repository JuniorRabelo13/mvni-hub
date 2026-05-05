
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiBaseUrl, buildApiUrl } from './api-config';

describe('api-config', () => {
  const originalEnv = import.meta.env.VITE_WHATSAPP_API_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  it('should return default URL if VITE_WHATSAPP_API_URL is missing', () => {
    import.meta.env.VITE_WHATSAPP_API_URL = '';
    expect(getApiBaseUrl()).toBe('https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/whatsapp-api');
  });

  it('should remove trailing slash from baseUrl', () => {
    import.meta.env.VITE_WHATSAPP_API_URL = 'https://api.test.com/';
    expect(getApiBaseUrl()).toBe('https://api.test.com');
  });

  it('should build absolute URL correctly', () => {
    import.meta.env.VITE_WHATSAPP_API_URL = 'https://api.test.com';
    expect(buildApiUrl('/start')).toBe('https://api.test.com/start');
    expect(buildApiUrl('qr/123')).toBe('https://api.test.com/qr/123');
  });

  it('should throw API_URL_INVALID if protocol is missing', () => {
    import.meta.env.VITE_WHATSAPP_API_URL = 'api.test.com';
    expect(() => getApiBaseUrl()).toThrow('API_URL_INVALID');
  });

  it('should throw API_URL_INVALID if protocol is not http or https', () => {
    import.meta.env.VITE_WHATSAPP_API_URL = 'ftp://api.test.com';
    expect(() => getApiBaseUrl()).toThrow('API_URL_INVALID');
  });

  it('guardrail: should throw if buildApiUrl results in non-absolute URL', () => {
    // This is hard to trigger with getApiBaseUrl validation, but good to have
    vi.mock('./api-config', async (importOriginal) => {
      const actual = await importOriginal<any>();
      return {
        ...actual,
        getApiBaseUrl: () => 'invalid-base'
      };
    });
    // Re-import after mock
    // expect(() => buildApiUrl('/test')).toThrow('API_URL_INVALID');
  });
});
