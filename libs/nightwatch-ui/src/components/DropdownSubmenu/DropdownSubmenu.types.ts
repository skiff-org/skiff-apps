import { DropdownProps } from '../Dropdown/Dropdown.types';
import { DropdownItemComponent } from '../DropdownItem';
import { Icon } from '../Icons';

type SubmenuProps = Pick<DropdownProps, 'inputField' | 'width'>;

export interface DropdownSubmenuProps extends SubmenuProps {
  /** Submenu dropdown items */
  children: DropdownItemComponent[] | React.ReactElement;
  /** DropdownItem label */
  label: string;
  /** DropdownItem icon */
  icon?: Icon;
}
