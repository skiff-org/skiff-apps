import { Icon, IconProps, Icons, Size } from '@skiff-org/skiff-ui';
import React from 'react';
import styled from 'styled-components';

type CheckboxSize = Size.SMALL | Size.MEDIUM | Size.LARGE;

const CHECKBOX_ICON_SIZE: Record<CheckboxSize, Size> = {
  small: Size.SMALL,
  medium: Size.MEDIUM,
  large: Size.X_MEDIUM
};

type CheckboxProps = {
  checked?: boolean;
  hover?: boolean;
  indeterminate?: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: CheckboxSize;
  padding?: boolean;
};

const TouchPadding = styled.div`
  padding: 16px;
  cursor: pointer;
  margin: 0px -16px;
`;

function Checkbox(props: CheckboxProps) {
  const { checked, hover, indeterminate, onClick, size = Size.MEDIUM, padding } = props;
  // Indeterminate = true takes priority over checked = true, similar to MUI
  const icon = indeterminate ? Icon.CheckboxHalfFilled : checked ? Icon.CheckboxFilled : Icon.CheckboxEmpty;
  const getColor = (): IconProps['color'] => {
    if (checked) return 'secondary';
    if (hover) return 'tertiary';
    return 'disabled';
  };
  const color = getColor();
  const iconSize = CHECKBOX_ICON_SIZE[size];

  return (
    <>
      {padding && (
        <TouchPadding onClick={onClick}>
          <Icons color={color} icon={icon} size={iconSize} />
        </TouchPadding>
      )}
      {!padding && <Icons color={color} icon={icon} onClick={onClick} size={iconSize} />}
    </>
  );
}

export default Checkbox;
