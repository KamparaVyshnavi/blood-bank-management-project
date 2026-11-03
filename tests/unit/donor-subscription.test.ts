/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../../src/server/donor-push', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/server/donor-push')>();
  return {
    ...original,
    pushPublicKey: () => 'mock-vapid-public-key',
    encryptSubscription: () => ({ v: 1, iv: 'iv', data: 'data', tag: 'tag' }),
  };
});
import { donorHandler } from '../../src/server/donor-api';

// A valid 43-character base64url token (matches /^[A-Za-z0-9_-]{43}$/)
const VALID_TOKEN = 'abcdefghijklmnopqrstuvwxyz01234567890ABCDEF';

// Helper to create a mock Request with required headers
function mockRequest(method: string, body?: Record<string, unknown>, token?: string) {
  const url = 'http://localhost/api/donor/subscription';
  const headers = new Headers({
    'origin': 'http://localhost',
    'content-type': 'application/json',
  });
  if (token) headers.set('cookie', `pulsegrid-audience=${token}`);
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('donor subscription update verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 409 when updateOne reports no modification', async () => {
    // Mock updateOne to return modifiedCount: 0
    const updateOneMock = vi.fn().mockResolvedValue({ modifiedCount: 0 });
    // Mock findOne to return a valid donor for the session token
    const findOneMock = vi.fn().mockResolvedValue({
      _id: 'audience-test-donor',
      id: 'audience-test-donor',
      stateId: 'MH',
      tenantId: 'tenant-audience-test-donor',
      nickname: 'Test-Donor',
      group: 'O_POS',
      audience: true,
      optedOut: false,
      expireAt: new Date(Date.now() + 100_000),
      sessionHash: (await import('node:crypto')).createHash('sha256').update(VALID_TOKEN).digest('hex'),
      location: { type: 'Point', coordinates: [72.87, 19.07] },
    });

    const collectionMock = vi.fn().mockImplementation((name: string) => {
      if (name === 'donors') {
        return { findOne: findOneMock, updateOne: updateOneMock };
      }
      return {
        findOne: vi.fn().mockResolvedValue(null),
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
        insertOne: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({}),
      };
    });
    const dbMock = { collection: collectionMock } as unknown as import('mongodb').Db;

    const deps = {
      database: async () => dbMock,
      now: () => new Date(),
    };

    // Valid push subscription body
    const body = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8REfWLs',
        auth: '0123456789abcdefghijkl',
      },
    };

    const request = mockRequest('POST', body, VALID_TOKEN);
    const handler = donorHandler(deps);
    const response = await handler(request, ['subscription']);
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.error).toBe('DONOR_SUBSCRIPTION_UPDATE_FAILED');
  });
});
