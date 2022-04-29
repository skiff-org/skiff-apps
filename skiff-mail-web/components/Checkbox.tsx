import { Icon, Icons } from '@skiff-org/skiff-ui';
import React from 'react';

type CheckboxProps = {
  checked?: boolean;
  indeterminate?: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: 'small' | 'medium' | 'large';
};

function Checkbox(props: CheckboxProps) {
  const { checked, indeterminate, onClick, size } = props;
  // Indeterminate = true takes priority over checked = true, similar to MUI
  const icon = indeterminate ? Icon.CheckboxHalfFilled : checked ? Icon.CheckboxFilled : Icon.CheckboxEmpty;
  return <Icons icon={icon} onClick={onClick} color={checked ? 'primary' : 'secondary'} size={size} />;
}

export default Checkbox;
