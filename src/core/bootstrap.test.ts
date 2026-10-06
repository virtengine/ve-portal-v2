import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configurationRetrieve } from 'waldur-js-client';

const afterBootstrap = vi.fn();

vi.mock('@/afterBootstrap', () => ({
  afterBootstrap: () => afterBootstrap(),
}));
vi.mock('./api', () => ({
  initApiClient: vi.fn(),
}));

/*
 * `./bootstrap` is imported here, at module scope, rather than inside each
 * test. It is the first thing to pull in `waldur-js-client`, so on a cold
 * Vite/Node module cache the first test that awaits it pays the whole
 * transform cost against its own `testTimeout` budget (10s, see
 * vitest.config.ts). On a cold Windows host that cost exceeded the budget, so
 * the test failed on `testTimeout`; CI — where the same transform is an order
 * of magnitude cheaper — passed the file in 443ms.
 *
 * The per-test budget must not carry a one-off module-graph cost. Importing at
 * module scope moves that cost into the file's import phase, which no per-test
 * budget can be charged for. `vi.mock` calls are hoisted above this line by the
 * Vitest transform, so the mocks are still registered when `./bootstrap`
 * resolves.
 *
 * Hoisting also removes a cascade, which is what made the original symptom so
 * misleading. A test that times out is reported as failed, but its body KEEPS
 * RUNNING. The still-running first test then consumed the
 * `mockRejectedValueOnce` rejection the SECOND test had already queued on the
 * shared mock, so the second test saw the previous sentinel — or, once the
 * queue was empty, the automock's `undefined` — and reported "Cannot read
 * properties of undefined (reading 'data')" from fetchConfig.ts, pointing at
 * error classification that was in fact correct. A timeout in one test must not
 * be able to fail a later one with an unrelated error. See also
 * packages/runtime-config/src/configError.test.ts, which covers the
 * classification branches directly.
 */
const { loadConfig } = await import('./bootstrap');

beforeEach(() => {
  vi.mocked(configurationRetrieve).mockReset();
  afterBootstrap.mockReset();
  document.head.innerHTML =
    '<meta name="api-url" content="http://localhost:8080/">';
});

describe('loadConfig — error wrapping', () => {
  // Full branch coverage of the error-classification logic itself lives in
  // packages/runtime-config/src/configError.test.ts; this just checks the
  // wiring — that a fetch failure actually propagates through loadConfig()
  // with its cause preserved.
  it('wraps an object-shaped SDK error so the original is preserved on Error.cause', async () => {
    const sdkError = { response: undefined, message: 'underlying failure' };
    vi.mocked(configurationRetrieve).mockRejectedValueOnce(sdkError);

    await expect(loadConfig()).rejects.toMatchObject({
      message:
        'Unable to fetch server configuration from http://localhost:8080/.',
      cause: sdkError,
    });
  });

  it('keeps the network-failure message for TypeError and carries the cause', async () => {
    const networkError = new TypeError('Failed to fetch');
    vi.mocked(configurationRetrieve).mockRejectedValueOnce(networkError);

    await expect(loadConfig()).rejects.toMatchObject({
      message: expect.stringContaining(
        'The request did not complete. Please check that you can open ' +
          'http://localhost:8080/ directly in this browser',
      ),
      cause: networkError,
    });
  });
});
