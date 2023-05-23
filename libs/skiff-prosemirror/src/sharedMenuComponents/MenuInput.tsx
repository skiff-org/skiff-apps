import '../ui/skiff-editor-menus.css';

import { ThemeMode, Typography } from 'nightwatch-ui';
import React, { FunctionComponent } from 'react';

import { SearchPlaceHolder } from '../slashMenu/InterfacesAndEnums';

// not an actual input but it seems as one to the user, displays the text the user is filtering for
const MenuInput: FunctionComponent<{ value: string }> = ({ value }) => (
  <div>
    <div className='skiff-editor-menu-input'>
      <Typography color={value.length === 0 ? 'disabled' : 'primary'} forceTheme={ThemeMode.DARK}>
        {value.length === 0 ? SearchPlaceHolder : value}
      </Typography>
    </div>
  </div>
);

export default MenuInput;
