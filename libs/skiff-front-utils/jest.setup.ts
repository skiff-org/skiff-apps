import '@testing-library/jest-dom';

import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-test' });

afterAll(() => {
  jest.restoreAllMocks();
});
