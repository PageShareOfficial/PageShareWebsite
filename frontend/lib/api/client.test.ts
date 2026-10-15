import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';

const fetchMock = vi.fn();

function respond(status: number, body = ''): Response {
  return new Response(status === 204 ? null : body, { status });
}

describe('API client response handling', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('resolves 204 No Content to undefined instead of failing to parse', async () => {
    fetchMock.mockResolvedValue(respond(204));

    await expect(apiPost('/session/start', {}, 'token')).resolves.toBeUndefined();
    fetchMock.mockResolvedValue(respond(204));
    await expect(apiPatch('/errors/1/resolve', undefined, 'token')).resolves.toBeUndefined();
  });

  it('parses JSON bodies', async () => {
    fetchMock.mockResolvedValue(respond(200, '{"username":"alice"}'));

    await expect(apiGet('/users/me', 'token')).resolves.toEqual({ username: 'alice' });
  });

  it('throws the backend message for error responses', async () => {
    fetchMock.mockResolvedValue(respond(409, '{"detail":"Username is already taken"}'));

    await expect(apiPost('/users/me/onboarding', {}, 'token')).rejects.toThrow(
      'Username is already taken'
    );
  });

  it('ignores the body of a successful delete and surfaces delete errors', async () => {
    fetchMock.mockResolvedValue(respond(200, 'deleted'));
    await expect(apiDelete('/bookmarks/1', 'token')).resolves.toBeUndefined();

    fetchMock.mockResolvedValue(respond(404, '{"detail":"Not found"}'));
    await expect(apiDelete('/bookmarks/1', 'token')).rejects.toThrow('Not found');
  });

  it('falls back to the status when the error body is empty', async () => {
    fetchMock.mockResolvedValue(respond(500));

    await expect(apiGet('/users/me', 'token')).rejects.toThrow('Request failed: 500');
  });
});
