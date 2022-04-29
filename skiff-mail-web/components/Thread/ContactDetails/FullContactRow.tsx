import { useRef, useState } from 'react';
import styled from 'styled-components';

import { Typography } from '../../../../skiff-ui/src';
import { AddressObject } from '../../../generated/graphql';
import ContactActionDropdown from './ContactActionDropdown';

const FullContactRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const NameBlock = styled.div<{ indent?: number }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  margin-left: ${(props) => (props.indent ? `${(props.indent + 1) * 7}px` : '0px')};
`;

interface FullContactRowProps {
  address: AddressObject;
  index: number;
  label: string;
}

const FullContactRow: React.FC<FullContactRowProps> = ({ address: addrObj, index, label }) => {
  const { address, name } = addrObj;
  const ref = useRef<HTMLDivElement>(null);
  const [showActionDropdown, setShowActionDropdown] = useState<boolean>(false);

  return (
    <>
      <FullContactRowContainer key={address}>
        {index === 0 && (
          <Typography color='secondary' type='paragraph'>
            {label}
          </Typography>
        )}
        {/* indent so names aligned (depends on CC or BCC, num characters) */}
        <NameBlock indent={index !== 0 ? label.length : undefined}>
          <span ref={ref}>
            <Typography
              color='link'
              onClick={() => {
                setShowActionDropdown((prev) => !prev);
              }}
              type='paragraph'
            >
              {name ?? address}
            </Typography>
          </span>
          {!!name && (
            <Typography color='secondary' type='paragraph'>
              {`<${address}>`}
            </Typography>
          )}
        </NameBlock>
      </FullContactRowContainer>
      {showActionDropdown && (
        <ContactActionDropdown address={addrObj} buttonRef={ref} setShowActionDropdown={setShowActionDropdown} />
      )}
    </>
  );
};

export default FullContactRow;
