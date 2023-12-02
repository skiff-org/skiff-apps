import React from 'react';

import { ThemeMode } from '../../../types';
import Typography from '../../Typography';
import { InputFieldSize } from '../InputField.types';

import { SUB_TEXT_SIZE } from './SubText.constants';

interface SubTextProps {
  size: InputFieldSize;
  errorMsg?: string;
  forceTheme?: ThemeMode;
  helperText?: string;
}

const SubText = ({ errorMsg, forceTheme, helperText, size }: SubTextProps) => {
  const hasErrorMsg = !!errorMsg?.length;
  const hasHelperText = !!helperText?.length;
  if (!hasErrorMsg && !hasHelperText) return <></>;
  // We give priority to error messages over helper texts
  const color = hasErrorMsg ? 'destructive' : 'secondary';
  const text = hasErrorMsg ? errorMsg : helperText;
  const subTextSize = SUB_TEXT_SIZE[size];

  return (
    <Typography color={color} forceTheme={forceTheme} size={subTextSize} wrap>
      {text}
    </Typography>
  );
};

export default SubText;
