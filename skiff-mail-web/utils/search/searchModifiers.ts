import { IndexedSkemail } from 'skiff-front-search';

/**
 * modifiers that are narrowing search results
 * for example: originally we search "ski" -> [...results], search "ski" with the "has Finance label modifier" -> [...filteredResults]
 * currently, modifiers only exist for the Skemail category
 */
export enum SearchModifierType {
  HAS_LABEL,
  FROM_ADDRESS,
  TO_ADDRESS
}

export type SkemailFilter = (item: IndexedSkemail) => boolean;

// This function returns a filter function that is applied to the search results returned from
// the web worker. These filter functions are generated based on the current modifierType and
// modifierValue
export function getFilterFromModifier(modifier?: SearchModifierType, value?: string): SkemailFilter | undefined {
  if (modifier === undefined || !value) {
    return;
  }

  switch (modifier) {
    case SearchModifierType.HAS_LABEL:
      return (item: IndexedSkemail) => {
        return item.systemLabels.includes(value) || item.userLabels.includes(value);
      };
    case SearchModifierType.FROM_ADDRESS:
      return (item: IndexedSkemail) => {
        return item.fromAddress.includes(value);
      };
    case SearchModifierType.TO_ADDRESS:
      return (item: IndexedSkemail) => {
        return item.toAddresses.includes(value);
      };
    default:
      return;
  }
}
