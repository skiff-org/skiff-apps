import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

import MessageDetailsPanel from '../src/components/mailbox/MessageDetailsPanel';

const testContent = 'I am content inside the panel';

describe('ComposePanel', () => {
  it('displays when open', () => {
    render(
      <MockedProvider>
        <MessageDetailsPanel open={true}>{testContent}</MessageDetailsPanel>
      </MockedProvider>
    );

    expect(screen.getByText(testContent)).toBeVisible();
  });
  it('does not display the panel when not open', () => {
    render(
      <MockedProvider>
        <MessageDetailsPanel open={false}>{testContent}</MessageDetailsPanel>
      </MockedProvider>
    );
    expect(screen.queryByText(testContent)).toBeNull();
  });
});
