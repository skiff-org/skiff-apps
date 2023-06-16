import { ThemeMode, Typography, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { Illustration, Illustrations } from '../../svgs';
import RadioCheckbox from '../RadioCheckbox';

import { BORDER_RADIUS, SelectBoxDataTest } from './constants';

type SelectBoxProps = {
  label: string;
  description?: string;
  checked: boolean;
  size?: 'small' | 'large';
  onClick: () => void;
  illustrationSvg: Illustrations;
  dataTest?: SelectBoxDataTest;
  bgColor?: string;
  position?: 'left' | 'right' | 'center';
  forceTheme?: ThemeMode;
};

const SvgContainer = styled.div<{
  $large: boolean;
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

const IllustrationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: self-end;
  width: 100%;
  height: 100%;
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
    illustrationSvg,
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
      data-test={dataTest}
      onClick={onClick}
    >
      <IllustrationContainer>
        <Illustration illustration={illustrationSvg} />
      </IllustrationContainer>
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
          <StyledRadioCheckbox
            checked={checked}
            dataTest={checked ? SelectBoxDataTest.CHECKED_ID : SelectBoxDataTest.UNCHECKED_ID}
            theme={forceTheme}
          />
        </RadioContainer>
      </ContentContainer>
    </SvgContainer>
  );
}

export default SelectBox;
