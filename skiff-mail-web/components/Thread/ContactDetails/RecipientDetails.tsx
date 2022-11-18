import { Typography } from 'nightwatch-ui';
import { formatEmailAddress } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import { MailboxEmailInfo } from '../../../models/email';

import FullContactRow from './FullContactRow';

const RecipientDetailsContainer = styled.div`
  position: relative;
`;

// If we are showing all contacts, remove the overflow from innerText
// to allow for horizontal scrolling
const FullContactList = styled(Typography)<{ showContacts }>`
  ${(props) =>
    props.showContacts
      ? `.innerText {
            overflow: unset;
        }`
      : ''}
`;

type RecipientDetailsProps = {
  email: MailboxEmailInfo;
  expanded: boolean;
  showContacts: boolean;
};

function RecipientDetails({ email, expanded, showContacts }: RecipientDetailsProps) {
  const { to, cc, bcc, decryptedText } = email;
  const toCommaList = (addresses: AddressObject[], label: string) => {
    if (addresses.length) {
      const commaList = addresses.map((addr) => addr.name ?? formatEmailAddress(addr.address)).join(', ');
      return `${label} ${commaList} `;
    }
    return '';
  };
  const toFullList = (addresses: AddressObject[], label: string) =>
    addresses.map((addr, idx) => <FullContactRow address={addr} index={idx} key={addr.address} label={label} />);

  const commaContactList = `${toCommaList(to, 'To:')}${toCommaList(cc, 'Cc:')}${toCommaList(bcc, 'Bcc:')}`;

  const contacts = (
    <FullContactList color='secondary' showContacts={showContacts}>
      {!showContacts ? (
        commaContactList.trim()
      ) : (
        <>
          {!!to.length && <>{toFullList(to, 'To:')}</>}
          {!!cc.length && <>{toFullList(cc, 'Cc:')}</>}
          {!!bcc.length && <>{toFullList(bcc, 'Bcc:')}</>}
        </>
      )}
    </FullContactList>
  );

  return (
    <RecipientDetailsContainer data-test='contact-details'>
      {expanded && contacts}
      {!expanded && <Typography color='secondary'>{decryptedText}</Typography>}
    </RecipientDetailsContainer>
  );
}

export default RecipientDetails;
