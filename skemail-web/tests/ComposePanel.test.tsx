import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import ComposePanel from '../src/components/Compose';
import store from '../src/redux/store/reduxStore';

jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));

const testContent = 'I am content inside the panel';

describe('ComposePanel', () => {
  it('displays when open', async () => {
    render(
      <Provider store={store}>
        <ComposePanel open={true}>{testContent}</ComposePanel>
      </Provider>
    );
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeVisible();
    });
  });
  it('does not display the panel when not open', () => {
    render(
      <Provider store={store}>
        <ComposePanel open={false}>{testContent}</ComposePanel>
      </Provider>
    );
    expect(screen.queryByText(testContent)).toBeNull();
  });
});
