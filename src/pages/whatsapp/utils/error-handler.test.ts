
import { describe, it, expect } from 'vitest';
import { normalizeConnectError } from './error-handler';

describe('error-handler', () => {
  it('should preserve resolvedUrl and endpointPath in normalized error', async () => {
    const error = new Error('Failed to fetch');
    error.name = 'TypeError';
    
    const context = {
      endpointPath: '/start',
      method: 'POST',
      sessionId: 'sess-123',
      requestId: 'req-456'
    };

    const normalized = await normalizeConnectError(error, context);
    
    expect(normalized.code).toBe('NETWORK_ERROR');
    expect(normalized.endpointPath).toBe('/start');
    expect(normalized.method).toBe('POST');
    expect(normalized.sessionId).toBe('sess-123');
    expect(normalized.requestId).toBe('req-456');
    expect(normalized.resolvedUrl).toContain('/start');
    expect(normalized.resolvedUrl).toMatch(/^https?:\/\//);
  });

  it('should handle API_URL_INVALID error code', async () => {
    const error = new Error('Invalid URL');
    (error as any).code = 'API_URL_INVALID';
    
    const context = {
      endpointPath: '/start',
      method: 'POST'
    };

    const normalized = await normalizeConnectError(error, context);
    
    expect(normalized.code).toBe('API_URL_INVALID');
    expect(normalized.userMessage).toBe('Configuração de API inválida.');
  });
});
