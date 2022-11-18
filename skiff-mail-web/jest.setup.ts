import '@testing-library/jest-dom';
import 'jest-canvas-mock'; // Needed for 'react-lottie'

import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-test' });

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
