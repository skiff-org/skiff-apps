import './skiff-custom-menu.css';
import './skiff-custom-scrollbar.css';

import React from 'react';

function CustomMenu(props: any) {
  const { children } = props;
  return <div className='skiff-custom-menu skiff-custom-scrollbar'>{children}</div>;
}

export default CustomMenu;
