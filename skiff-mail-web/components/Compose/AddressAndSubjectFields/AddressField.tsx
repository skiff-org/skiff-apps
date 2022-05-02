import { Divider, Typography } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

import { EmailFieldTypes } from '../Compose.constants';

const AddressFieldContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
`;

const AddressHeader = styled.div`
  width: fit-content;
`;

interface AddressFieldProps {
  field: EmailFieldTypes;
  focusedField: EmailFieldTypes | null;
  dataTest?: string;
}

/*
 * Component for rendering an address field (including field name, field contents, and divider)
 */
const AddressField: React.FC<AddressFieldProps> = ({ children, field, focusedField, dataTest }) => {
  const getAddressFieldLabelColor = (field: EmailFieldTypes) => (focusedField === field ? 'primary' : 'secondary');
  const getDividerColor = (field: EmailFieldTypes) => (focusedField === field ? 'active' : 'secondary');

  return (
    <>
      <AddressFieldContainer data-test={dataTest}>
        <AddressHeader>
          <Typography color={getAddressFieldLabelColor(field)} type='paragraph'>
            {field}
          </Typography>
        </AddressHeader>
        {children}
      </AddressFieldContainer>
      <Divider color={getDividerColor(field)} />
    </>
  );
};

export default AddressField;
