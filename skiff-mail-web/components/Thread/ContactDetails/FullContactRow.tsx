import { Typography, TypographySize } from '@skiff-org/skiff-ui';
import { FC, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { formatEmailAddress, getAddrDisplayName } from 'skiff-front-utils';
import { AddressObject } from 'skiff-graphql';
import styled from 'styled-components';

import ContactActionDropdown from './ContactActionDropdown';

const FullContactRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 4px;
`;

const NameBlock = styled.div<{ indent?: number }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: ${(props) => (props.indent ? `${(props.indent + 1) * 7}px` : '0px')};
  flex-wrap: wrap;
`;

const Address = styled.div`
  margin-left: 8px;
`;

interface FullContactRowProps {
  address: AddressObject;
  index: number;
  label: string;
}

const FullContactRow: FC<FullContactRowProps> = ({ address: addrObj, index, label }) => {
  const { address, name } = addrObj;
  const ref = useRef<HTMLDivElement>(null);
  const [showActionDropdown, setShowActionDropdown] = useState<boolean>(false);

  const { formattedDisplayName } = getAddrDisplayName(addrObj);
  const displayAddress = formatEmailAddress(address);

  return (
    <>
      <FullContactRowContainer key={address}>
        {index === 0 && (
          <Typography
            mono
            uppercase
            color='secondary'
            minWidth='unset'
            size={isMobile ? TypographySize.SMALL : undefined}
          >
            {label}
          </Typography>
        )}
        {/* indent so names aligned (depends on CC or BCC, num characters) */}
        <NameBlock indent={index !== 0 ? label.length : undefined}>
          <span ref={ref}>
            <Typography
              mono
              uppercase
              color='link'
              onClick={() => {
                setShowActionDropdown((prev) => !prev);
              }}
              size={isMobile ? TypographySize.SMALL : undefined}
            >
              {formattedDisplayName}
            </Typography>
          </span>
          {!!name && (
            <Typography mono uppercase color='secondary' size={isMobile ? TypographySize.SMALL : undefined}>
              <Address>{`<${displayAddress}>`}</Address>
            </Typography>
          )}
        </NameBlock>
      </FullContactRowContainer>
      <ContactActionDropdown
        address={addrObj}
        buttonRef={ref}
        setShowActionDropdown={setShowActionDropdown}
        show={showActionDropdown}
      />
    </>
  );
};

export default FullContactRow;
