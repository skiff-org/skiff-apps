import 'regenerator-runtime/runtime';
import crypto from 'crypto';

import { mswServer } from './tests/mockServer';

Object.defineProperty(global.self, 'crypto', {
  value: crypto.webcrypto
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('./src/crypto/cryptoWebWorker/index.ts', () => jest.requireActual('./tests/mocks/datagramMocks'));
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('./src/storage/crypto/utils.ts', () => jest.requireActual('./tests/mocks/cryptoUtilsMocks'));

beforeAll(() => {
  mswServer.listen({
    onUnhandledRequest: 'error' // Every http request that didn't mocked will cause an error on tests
  });
});

afterEach(() => mswServer.resetHandlers());

afterAll(() => mswServer.close());
