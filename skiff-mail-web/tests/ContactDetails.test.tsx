import { render, screen } from '@testing-library/react';

import RecipientDetails from '../src/components/Thread/ContactDetails/RecipientDetails';

import { MOCK_EMAIL } from './mocks/mockEmail';

jest.mock('../src/hooks/useDrafts', () => ({
  composeNewDraft: jest.fn()
}));
jest.mock('../src/hooks/useSearchWorker', () => ({
  getSearchWorker: undefined
}));

describe('ContactDetails', () => {
  it('renders correct info without hover when expanded', () => {
    const toAddress = {
      address: 'to@skiff.town',
      name: 'John Travolta'
    };
    const SIMPLE_BODY_EMAIL = { ...MOCK_EMAIL, to: [toAddress], cc: [], bcc: [], decryptedText: 'This is a body' };
    render(<RecipientDetails email={SIMPLE_BODY_EMAIL} expanded showContacts={false} />);
    expect(screen.getByText(`To: ${toAddress.name}`)).toBeVisible();
  });

  it('renders correct info without hover when not expanded', () => {
    const SIMPLE_BODY_EMAIL = {
      ...MOCK_EMAIL,
      decryptedTextSnippet: 'This is a body',
      decryptedText: 'This is a body'
    };
    render(<RecipientDetails email={SIMPLE_BODY_EMAIL} expanded={false} showContacts={false} />);
    expect(screen.getByText(SIMPLE_BODY_EMAIL.decryptedTextSnippet)).toBeVisible();
  });
});
