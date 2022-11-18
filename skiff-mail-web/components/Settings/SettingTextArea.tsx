import { ButtonGroup, ButtonGroupItem, Icon, InputField } from 'nightwatch-ui';
import { Ref } from 'react';
import styled from 'styled-components';

const StyledInputField = styled(InputField)`
  border-radius: 8px;
`;

const TextAreaButton = styled.div<{ isEditing: boolean }>`
  margin: ${(props) => (props.isEditing ? '24px 0 0 0' : '0')};
`;

type SettingTextAreaProps = {
  errorMsg?: string;
  innerRef: Ref<HTMLInputElement>;
  isEditing: boolean;
  placeholder: string;
  setValue: (arg: string) => void;
  onDelete: () => void;
  onFocus: () => void;
  onSave: () => void;
  value?: string;
};

export const SettingTextArea = ({
  errorMsg,
  innerRef,
  isEditing,
  placeholder,
  setValue,
  onDelete,
  onFocus,
  onSave,
  value
}: SettingTextAreaProps) => (
  <StyledInputField
    endAdornment={
      <TextAreaButton isEditing={isEditing}>
        {isEditing && (
          <ButtonGroup iconOnly>
            <ButtonGroupItem key='save' label='Save' onClick={onSave} />
            <ButtonGroupItem destructive icon={Icon.Trash} key='delete' label='Delete' onClick={onDelete} />
          </ButtonGroup>
        )}
      </TextAreaButton>
    }
    errorMsg={errorMsg}
    innerRef={innerRef}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
    onFocus={onFocus}
    placeholder={placeholder}
    textArea
    value={value}
  />
);
