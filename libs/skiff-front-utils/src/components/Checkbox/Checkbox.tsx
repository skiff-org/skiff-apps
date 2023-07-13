import { Icon, IconProps, Icons, Size } from '@skiff-org/skiff-ui';
import React from 'react';
import styled, { css } from 'styled-components';

const CheckboxContainer = styled.div<{ $clickableAreaPadding?: string }>`
  display: flex;
  align-items: center;
  cursor: pointer;

  ${(props) =>
    props.$clickableAreaPadding &&
    css`
      padding: ${props.$clickableAreaPadding};
    `}
`;

type CheckboxSize = Size.SMALL | Size.MEDIUM | Size.LARGE;

const CHECKBOX_ICON_SIZE: Record<CheckboxSize, Size> = {
  small: Size.SMALL,
  medium: Size.MEDIUM,
  large: Size.X_MEDIUM
};

type CheckboxProps = {
  onClick: (e: React.MouseEvent) => void;
  checked?: boolean;
  error?: boolean;
  hover?: boolean;
  indeterminate?: boolean;
  size?: CheckboxSize;
  // Used to container size and clickable area, without impacting the size of the checkbox icon itself
  clickableAreaPadding?: string;
  dataTest?: string;
};

function Checkbox(props: CheckboxProps) {
  const { checked, dataTest, error, hover, indeterminate, onClick, size = Size.MEDIUM, clickableAreaPadding } = props;
  // Indeterminate = true takes priority over checked = true, similar to MUI
  const icon = indeterminate ? Icon.CheckboxHalfFilled : checked ? Icon.CheckboxFilled : Icon.CheckboxEmpty;
  const getColor = (): IconProps['color'] => {
    if (checked) return 'secondary';
    if (hover) return 'tertiary';
    if (error) return 'destructive';
    return 'disabled';
  };
  const color = getColor();
  const iconSize = CHECKBOX_ICON_SIZE[size];
  return (
    <CheckboxContainer $clickableAreaPadding={clickableAreaPadding} onClick={onClick}>
      <Icons color={color} dataTest={dataTest} icon={icon} size={iconSize} />
    </CheckboxContainer>
  );
}

export default Checkbox;
