import { Icon, InputField } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

import InputFieldEndAction from '../../InputFieldEndAction';

const InputFieldContainer = styled.div`
  width: 256px;
`;
interface RecoveryEmailOptionsProps {
  recoveryEmail: string;
  onDelete: () => void;
}

const RecoveryEmailOptions: React.FC<RecoveryEmailOptionsProps> = ({ recoveryEmail, onDelete }) => {
  return (
    <InputFieldContainer>
      <InputField
        endAdornment={recoveryEmail ? <InputFieldEndAction icon={Icon.Trash} onClick={onDelete} /> : undefined}
        readOnly
        value={recoveryEmail}
      />
    </InputFieldContainer>
  );
};

export default RecoveryEmailOptions;
