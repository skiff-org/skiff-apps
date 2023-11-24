import { Select } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';

import MobileSelect, { MobileSelectProps } from '../MobileSelect';

const SelectField = ({ children, menuControls, ...selectProps }: MobileSelectProps) => {
  return isMobile ? (
    <MobileSelect menuControls={menuControls} {...selectProps}>
      {children}
    </MobileSelect>
  ) : (
    <Select {...selectProps}>{children}</Select>
  );
};

export default SelectField;
