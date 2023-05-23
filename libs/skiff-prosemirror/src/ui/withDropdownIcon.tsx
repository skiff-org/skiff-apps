import React from 'react';

import Icon from './Icon';

const withDropdownIcon = (child: JSX.Element) => (
  <div
    style={{
      display: 'inline-flex',
      position: 'inherit'
    }}
  >
    {child}
    <div
      style={{
        position: 'relative',
        top: 5,
        right: 25,
        filter: 'var(--filter-dark-icon)',
        width: 0,
        pointerEvents: 'none'
      }}
    >
      {Icon.get('chevron-down')}
    </div>
  </div>
);

export default withDropdownIcon;
