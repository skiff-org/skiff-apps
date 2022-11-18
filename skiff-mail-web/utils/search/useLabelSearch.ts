import { Icon } from 'nightwatch-ui';
import { SystemLabels } from 'skiff-graphql';
import { useUserLabelsQuery } from 'skiff-mail-graphql';
import { trimAndLowercase } from 'skiff-utils';

import { SYSTEM_LABELS } from '../label';

import { LabelSearchResult, SearchItemType } from './searchTypes';

// used for searching through labels when the user selects the "LABEL" category
export const useLabelSearch = () => {
  const { data, error } = useUserLabelsQuery();

  if (error) {
    console.error(`Failed to retrieve User's labels`, JSON.stringify(error, null, 2));
  }

  const search = (searchString: string) => {
    const searchStr = trimAndLowercase(searchString);
    if (!searchStr) {
      return;
    }
    const systemLabels = Object.values(SystemLabels).filter((label) => label.toLowerCase().includes(searchStr));
    const userLabels = (data?.userLabels ?? []).filter((label) => label.labelName.includes(searchStr));

    const systemLabelResults: LabelSearchResult[] = systemLabels.map((currLabel) => ({
      type: SearchItemType.LABEL_RESULT,
      title: currLabel,
      icon: SYSTEM_LABELS.find((label) => label.name.toUpperCase() === currLabel)?.icon || Icon.Tag
    }));
    const userLabelResults: LabelSearchResult[] = userLabels?.map((label) => ({
      type: SearchItemType.LABEL_RESULT,
      title: label.labelName,
      color: label.color,
      icon: Icon.Tag
    }));
    return [...systemLabelResults, ...userLabelResults];
  };
  return { search };
};
