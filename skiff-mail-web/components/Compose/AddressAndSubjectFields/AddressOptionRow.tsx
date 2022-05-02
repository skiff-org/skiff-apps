import { Avatar, Typography } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

import { AddressObject } from '../../../generated/graphql';

const AddressRowContainer = styled.div<{ onClick?: React.MouseEventHandler }>`
  display: flex;
  align-items: center;
  padding: 6px 16px;

  cursor: pointer;
  width: 100%;
  border-radius: 8px;
  &:hover {
    background-color: var(--bg-cell-hover);
  }
`;

const AddressRowText = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 16px;
`;

type AddressOptionProps = {
  address: AddressObject;
  // Defined in autocomplete dropdown, undefined in contact details on hover
  onClick?: React.MouseEventHandler;
};

/*
 * Component for rendering an email address suggestion for the To/Cc/Bcc fields
 */
function AddressOptionRow({ address, onClick }: AddressOptionProps) {
  const name = address.name || address.address;
  return (
    <AddressRowContainer onClick={onClick}>
      <Avatar label={name} size='small' />
      <AddressRowText>
        <Typography level={3} type='label'>
          {name}
        </Typography>
        <Typography color='secondary' level={3} type='paragraph'>
          {address.address}
        </Typography>
      </AddressRowText>
    </AddressRowContainer>
  );
}

export default AddressOptionRow;
