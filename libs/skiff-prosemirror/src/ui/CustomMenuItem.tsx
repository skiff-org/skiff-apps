import './skiff-custom-menu-item.css';

import React, { FunctionComponent } from 'react';

import CustomButton from './CustomButton';
import UICommand from './UICommand';

export const CustomMenuItemSeparator = () => <div className='skiff-custom-menu-item-separator' />;

const CustomMenuItem: FunctionComponent<{
  active: boolean;
  label: string;
  disabled: boolean;
  icon?: string | React.ReactElement<any> | null;
  onClick: (command: UICommand, e: React.SyntheticEvent) => void;
  onMouseEnter: (command: UICommand, e: React.SyntheticEvent) => void;
  value: UICommand;
  dataTest?: string;
}> = (props) => <CustomButton {...props} className='skiff-custom-menu-item' />;

export default CustomMenuItem;
