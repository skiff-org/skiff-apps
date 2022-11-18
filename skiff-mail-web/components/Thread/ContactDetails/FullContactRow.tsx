import { Tooltip, Typography } from 'nightwatch-ui';
import { FC, useRef, useState } from 'react';
import { formatEmailAddress, getAddrDisplayName, getAddressTooltipLabel } from 'skiff-front-utils';
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

// Un-setting min-width to make sure the address
// field label is not hidden
const AddressFieldLabel = styled(Typography)`
  &.outerText {
    min-width: unset;
  }
`;

const Address = styled(Typography)`
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
        {index === 0 && <AddressFieldLabel color='secondary'>{label}</AddressFieldLabel>}
        {/* indent so names aligned (depends on CC or BCC, num characters) */}
        <NameBlock indent={index !== 0 ? label.length : undefined}>
          <Tooltip hidden={!!name} label={getAddressTooltipLabel(address)}>
            <span ref={ref}>
              <Typography
                color='link'
                onClick={() => {
                  setShowActionDropdown((prev) => !prev);
                }}
              >
                {formattedDisplayName}
              </Typography>
            </span>
          </Tooltip>
          {!!name && (
            <Tooltip hidden={displayAddress === address} label={address}>
              <div>
                <Address color='secondary'>{`<${displayAddress}>`}</Address>
              </div>
            </Tooltip>
          )}
        </NameBlock>
      </FullContactRowContainer>
      <ContactActionDropdown
        address={addrObj}
        buttonRef={ref}
        displayAddress={false}
        setShowActionDropdown={setShowActionDropdown}
        show={showActionDropdown}
      />
    </>
  );
};

export default FullContactRow;
