import { ThemeMode, Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import React from 'react'; // eslint-disable-line
import { RadioCheckbox } from 'skiff-front-utils';
import styled from 'styled-components';

import { CHECKED_ID, UNCHECKED_ID } from '../Settings/Appearance/ThemeSelect/ThemeSelectID.constants';

type SelectBoxProps = {
  label: string;
  description?: string;
  checked: boolean;
  size?: 'small' | 'large';
  onClick: () => void;
  iconSvg: JSX.Element;
  dataTest?: string;
  bgColor?: string;
  position?: 'left' | 'right' | 'center';
  forceTheme?: ThemeMode;
};

const BORDER_RADIUS = 12;

const SvgContainer = styled.div<{
  $large: boolean;
  $svg: JSX.Element;
  $bgColor?: string;
  $position: string;
  $checked: boolean;
}>`
  height: ${(props) => (props.$large ? 184 : 154)}px;
  position: relative;
  width: 100%;
  overflow: hidden;
  box-shadow: var(--shadow-l1);
  cursor: pointer;
  background-repeat: no-repeat;
  border-radius: ${BORDER_RADIUS}px;
  border: 1px solid ${(props) => (props.$checked ? 'var(--border-active)' : 'var(--border-secondary)')};
  background-position: ${(props) => props.$position};
  background-color: ${(props) => props?.$bgColor};
  :hover {
    box-shadow: ${(props) => (props.$checked ? 'var(--shadow-l1)' : 'var(--shadow-l2)')};
  }
`;

const LabelContainer = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

const RadioContainer = styled.div`
  height: 100%;
  display: flex;
  position: relative;
`;

const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: self-end;
  width: 100%;
  position: absolute;
  z-index: 0;
`;

const ContentContainer = styled.div`
  z-index: 99;
  position: relative;
`;

const StyledRadioCheckbox = styled(RadioCheckbox)`
  position: absolute;
  top: 80px;
  left: 14px;
`;

/**
 * Component for rendering a selectable box, that changes when clicked.
 */
function SelectBox(props: SelectBoxProps) {
  const {
    description,
    onClick,
    checked,
    label,
    iconSvg,
    size = 'small',
    dataTest,
    bgColor,
    position = 'center',
    forceTheme
  } = props;
  return (
    <SvgContainer
      $bgColor={bgColor}
      $checked={checked}
      $large={size === 'large'}
      $position={position}
      $svg={iconSvg}
      data-test={dataTest}
      onClick={onClick}
    >
      <IconContainer>{iconSvg}</IconContainer>
      <ContentContainer>
        <LabelContainer>
          <Typography color='primary' forceTheme={forceTheme} weight={TypographyWeight.MEDIUM}>
            {label}
          </Typography>
          <Typography color='secondary' forceTheme={forceTheme} wrap>
            {description}
          </Typography>
        </LabelContainer>
        <RadioContainer>
          <StyledRadioCheckbox checked={checked} dataTest={checked ? CHECKED_ID : UNCHECKED_ID} theme={forceTheme} />
        </RadioContainer>
      </ContentContainer>
    </SvgContainer>
  );
}

export default SelectBox;
