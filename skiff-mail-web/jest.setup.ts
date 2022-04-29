import '@testing-library/jest-dom';

import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-test' });

beforeAll(() => {
  // @ts-ignore
  delete window.ResizeObserver;
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
});

afterAll(() => {
  window.ResizeObserver = ResizeObserver;
  jest.restoreAllMocks();
});
