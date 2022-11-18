import { Icon, Icons } from 'nightwatch-ui';
import React from 'react';

type CheckboxProps = {
  checked?: boolean;
  hover?: boolean;
  indeterminate?: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: 'small' | 'medium' | 'large';
};

function Checkbox(props: CheckboxProps) {
  const { checked, hover, indeterminate, onClick, size } = props;
  // Indeterminate = true takes priority over checked = true, similar to MUI
  const icon = indeterminate ? Icon.CheckboxHalfFilled : checked ? Icon.CheckboxFilled : Icon.CheckboxEmpty;
  const getColor = () => {
    if (checked) return 'secondary';
    if (hover) return 'gray';
    return 'lightgray';
  };
  const color = getColor();
  return <Icons color={color} icon={icon} onClick={onClick} size={size} />;
}

export default Checkbox;
