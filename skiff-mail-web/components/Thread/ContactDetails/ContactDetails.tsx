import { Typography } from '@skiff-org/skiff-ui';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { AddressObject } from '../../../generated/graphql';
import { MailboxEmailInfo } from '../../../models/email';
import ContactActionDropdown from './ContactActionDropdown';
import FullContactRow from './FullContactRow';

const ContactDetailsContainer = styled.div`
  position: relative;
`;

const InlineTypography = styled(Typography)`
  display: inline-flex;
`;

const FromAndDateContainer = styled.div`
  ${isMobile
    ? `
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
  `
    : ''}
`;

type ContactDetailsProps = {
  email: MailboxEmailInfo;
  expanded: boolean;
  showContacts: boolean;
  dateAndActions?: React.ReactNode;
};

function ContactDetails({ email, expanded, showContacts, dateAndActions }: ContactDetailsProps) {
  const { to, from, cc, bcc, decryptedText } = email;
  const toCommaList = (addresses: AddressObject[]) => addresses.map((addr) => addr.name ?? addr.address).join(', ');
  const toFullList = (addresses: AddressObject[], label: string) =>
    addresses.map((addr, idx) => <FullContactRow address={addr} index={idx} key={addr.address} label={label} />);
  const fromContactRef = useRef<HTMLDivElement>(null);
  const [showFromContactDropdown, setShowFromContactDropdown] = useState<boolean>(false);

  const contacts = (
    <Typography color='secondary' type='paragraph'>
      {!showContacts ? (
        <>
          {!!to.length && <>To: {toCommaList(to)}...</>}
          {!!cc.length && <>&nbsp; Cc: {toCommaList(cc)}</>}
          {!!bcc.length && <>&nbsp; Bcc: {toCommaList(bcc)}</>}
        </>
      ) : (
        <>
          {!!to.length && <>{toFullList(to, 'To:')}</>}
          {!!cc.length && <>{toFullList(cc, 'Cc:')}</>}
          {!!bcc.length && <>{toFullList(bcc, 'Bcc:')}</>}
        </>
      )}
    </Typography>
  );

  const renderDisplayName = () => {
    // render the address as the display name if the user has not specified a display name
    const displayName = from.name ?? from.address;
    if (!displayName) return;
    return (
      <span ref={fromContactRef}>
        <InlineTypography
          color={showContacts ? 'link' : 'primary'}
          onClick={showContacts ? () => setShowFromContactDropdown((prev) => !prev) : undefined}
          type='label'
        >
          {displayName}&nbsp;
        </InlineTypography>
      </span>
    );
  };

  const renderAddress = () => {
    if (!from.address) return;
    return (
      <InlineTypography color='secondary' type='paragraph'>
        &lt;{from.address}&gt;
      </InlineTypography>
    );
  };

  return (
    <ContactDetailsContainer data-test='contact-details'>
      <FromAndDateContainer>
        {renderDisplayName()}
        {from.name && !isMobile && renderAddress()}
        {/* On mobile display Date and Actions components inside the Contact Details Container */}
        {isMobile && dateAndActions}
      </FromAndDateContainer>
      {from.name && showFromContactDropdown && (
        <ContactActionDropdown
          address={from}
          buttonRef={fromContactRef}
          setShowActionDropdown={setShowFromContactDropdown}
        />
      )}
      {expanded && contacts}
      {!expanded && (
        <Typography color='secondary' type='paragraph'>
          {decryptedText}
        </Typography>
      )}
    </ContactDetailsContainer>
  );
}

export default ContactDetails;
