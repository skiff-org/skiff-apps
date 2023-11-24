import { InputField, InputFieldVariant } from 'nightwatch-ui';
import { FC, memo, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { skemailDraftsReducer } from '../../../redux/reducers/draftsReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { EmailFieldTypes } from '../Compose.constants';

import AddressField from './AddressField';

interface SubjectFieldProps {
  dataTest: string;
  focusedField: EmailFieldTypes | null;
  setFocusedField: (field: EmailFieldTypes | null) => void;
  onBlur: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subject: string;
}

const SubjectField: FC<SubjectFieldProps> = ({
  dataTest,
  focusedField,
  setFocusedField,
  onBlur,
  onChange,
  subject
}) => {
  const isFocused = focusedField === EmailFieldTypes.SUBJECT;
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const closeCompose = useCallback(() => {
    dispatch(skemailDraftsReducer.actions.clearCurrentDraftID());
    dispatch(skemailModalReducer.actions.closeCompose());
  }, [dispatch]);

  const blurInputField = () => inputFieldRef.current?.blur();

  useEffect(() => {
    if (isFocused) inputFieldRef.current?.focus();
    else if (focusedField === EmailFieldTypes.FROM) blurInputField();
  }, [focusedField, isFocused]);

  return (
    <AddressField dataTest={dataTest} field={EmailFieldTypes.SUBJECT} isFocused={isFocused} showField={!!subject}>
      <InputField
        autoFocus={isFocused}
        innerRef={inputFieldRef}
        onBlur={isFocused ? onBlur : undefined}
        onChange={onChange}
        onFocus={() => setFocusedField(EmailFieldTypes.SUBJECT)}
        onKeyDown={(e: React.KeyboardEvent) => {
          // Remove focus when Escape is pressed
          if (e.key === 'Escape') {
            blurInputField();
            e.preventDefault();
            e.stopPropagation();
            closeCompose();
          } else if (e.key === 'Tab') {
            // When tab is pressed, focus on the Body Field
            e.preventDefault();
            e.stopPropagation();
            setFocusedField(EmailFieldTypes.BODY);
          }
        }}
        placeholder='Subject'
        value={subject}
        variant={InputFieldVariant.GHOST}
      />
    </AddressField>
  );
};

export default memo(SubjectField);
