import { Icon, Icons, Typography, TypographyProps } from 'nightwatch-ui';
import React from 'react'; // eslint-disable-line
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
  labelColor?: TypographyProps['color'];
  position?: 'left' | 'right' | 'center';
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

const CheckedIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #ef5a3c;
  outline: 2px solid var(--accent-orange-secondary);
  box-shadow: var(--shadow-l2);
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  display: flex;
  position: absolute;
  top: 80px;
  left: 14px;
  z-index: 99999;
  justify-content: center;
`;

const CheckedIconDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  background: var(--icon-always-white);
  box-shadow: var(--shadow-l2);
`;

const UnCheckedIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  display: flex;
  position: absolute;
  top: 80px;
  left: 14px;
  z-index: 99999;
  justify-content: center;
  opacity: 0.6;
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

/**
 * Component for rendering a selectable box, that changes when clicked.
 */
function SelectBox(props: SelectBoxProps) {
  const {
    description,
    labelColor,
    onClick,
    checked,
    label,
    iconSvg,
    size = 'small',
    dataTest,
    bgColor,
    position = 'center'
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
          <Typography color={labelColor} type='label'>
            {label}
          </Typography>
          <Typography color={labelColor} style={{ opacity: 0.56 }} wrap>
            {description}
          </Typography>
        </LabelContainer>
        <RadioContainer>
          {checked && (
            <CheckedIcon data-test={CHECKED_ID}>
              <CheckedIconDot />
            </CheckedIcon>
          )}
          {!checked && (
            <UnCheckedIcon data-test={UNCHECKED_ID}>
              <Icons color={labelColor} icon={Icon.RadioEmpty} size='large' />
            </UnCheckedIcon>
          )}
        </RadioContainer>
      </ContentContainer>
    </SvgContainer>
  );
}

export default SelectBox;
