import { Type } from '../../types';

export const getButtonType = (index: number) => {
  if (index === 0) return Type.PRIMARY;
  if (index === 2) return Type.TERTIARY;
  return Type.SECONDARY;
};
