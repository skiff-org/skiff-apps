import { Divider, Typography } from 'nightwatch-ui';
import { FC } from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { EmailFieldTypes } from '../Compose.constants';

const INITIAL_INPUT_HEIGHT = 48;
const INITIAL_INPUT_WIDTH = isMobile ? 200 : 480;

const AddressFieldContainer = styled.div<{
  $isFocused?: boolean;
  $showField?: boolean;
  $moveButtons?: boolean;
  $isSendField?: boolean;
  $additionalButtons?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: auto;
  min-height: 48px;
  cursor: text;
  ${(props) =>
    props.$isSendField &&
    css`
      display: grid;
      grid-template-columns: ${props.$showField
        ? `min-content auto ${props.$moveButtons ? '' : props.$additionalButtons ? 'min-content' : '0px'}`
        : 'auto 56px'};
    `}

  ${(props) =>
    !props.$isSendField &&
    css`
      display: flex;
    `}

  ${isMobile &&
  css`
    box-sizing: border-box;
    max-width: 100%;
    padding: 0px;
    align-items: center;
  `}
  ${!isMobile &&
  css`
    padding: 0px 16px;
    min-height: ${INITIAL_INPUT_HEIGHT}px;
    box-sizing: border-box;
  `}
  max-height: 30vh;
  align-items: center;
`;

const AddressHeader = styled.div`
  width: fit-content;
  min-height: 48px;
  display: flex;
  align-items: flex-start;
  height: 100%;
  padding-top: 14.5px;
  max-height: 100%;
  box-sizing: border-box;
`;

const AdditionalButtons = styled.div`
  width: fit-content;
  gap: 8px;
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
`;

const InputContainer = styled.div<{ $topPadding?: boolean; $isFocused?: boolean }>`
  width: 100%;
  display: flex;
  gap: 8px;

  ${({ $isFocused }) =>
    !$isFocused &&
    css`
      min-width: ${INITIAL_INPUT_WIDTH}px;
    `}
  ${({ $topPadding, $isFocused }) =>
    $topPadding &&
    css`
      align-items: flex-start;
      padding-top: ${$isFocused ? '9px' : ''};
      padding-bottom: ${$isFocused ? '9px' : ''};
    `}
  ${({ $topPadding }) =>
    !$topPadding &&
    css`
      align-items: center;
    `}
  box-sizing: border-box;
`;

const AdditionalContainer = styled.div<{ $moveButtons?: boolean }>`
  ${({ $moveButtons }) =>
    $moveButtons &&
    css`
      grid-column: 2;
      width: 100%;
      & > div {
        width: 100%;
        justify-content: flex-end;
        min-height: 27px !important;
        padding-bottom: 10px !important;
      }
    `}
`;

interface AddressFieldProps {
  field: EmailFieldTypes;
  isFocused: boolean;
  dataTest?: string;
  additionalButtons?: React.ReactNode;
  showField?: boolean;
  moveButtons?: boolean;
  onClick?: () => void;
}

/*
 * Component for rendering an address field (including field name, field contents, and divider)
 */
const AddressField: FC<AddressFieldProps> = ({
  children,
  showField,
  additionalButtons,
  field,
  isFocused,
  dataTest,
  onClick,
  moveButtons
}) => {
  const labelColor = isFocused ? 'primary' : 'secondary';
  const isSendField = field === EmailFieldTypes.TO || field === EmailFieldTypes.BCC || field === EmailFieldTypes.CC;
  return (
    <>
      <AddressFieldContainer
        $additionalButtons={!!additionalButtons}
        $isFocused={isFocused}
        $isSendField={isSendField}
        $moveButtons={moveButtons}
        $showField={showField}
        data-test={dataTest}
        onClick={onClick}
      >
        {showField && field !== EmailFieldTypes.SUBJECT && (
          <AddressHeader>
            <Typography capitalize color={labelColor}>
              {field}
            </Typography>
          </AddressHeader>
        )}
        <InputContainer $isFocused={isFocused} $topPadding={isSendField}>
          {children}
        </InputContainer>
        <AdditionalContainer $moveButtons={moveButtons}>
          {additionalButtons && <AdditionalButtons>{additionalButtons}</AdditionalButtons>}
        </AdditionalContainer>
      </AddressFieldContainer>
      <Divider color={isFocused ? 'secondary' : 'tertiary'} />
    </>
  );
};

export default AddressField;
