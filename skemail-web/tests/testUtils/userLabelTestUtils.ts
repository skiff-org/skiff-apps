import { UserLabelVariant } from 'skiff-graphql';

import { UserLabelPlain, LabelType, UserLabelFolder } from '../../src/utils/label';

export const createUserLabelPlain = (id: string, name: string): UserLabelPlain => {
  return {
    variant: UserLabelVariant.Plain,
    name,
    value: id,
    type: LabelType.USER,
    color: 'orange'
  };
};

export const createUserLabelFolder = (id: string, name: string): UserLabelFolder => {
  return {
    variant: UserLabelVariant.Folder,
    name,
    value: id,
    type: LabelType.USER,
    color: 'orange'
  };
};
