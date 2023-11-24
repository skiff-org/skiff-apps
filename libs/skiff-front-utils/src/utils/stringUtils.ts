import { trimAndLowercase } from 'skiff-utils';
/**
 * Given a content string and a query phrase that exists within `content`, return a string that
 * pads the query phrase with N words on each side to give context to the query phrase.
 * @param content
 * @param query
 * @param padding number of words to pad before and after the query phrase
 * @returns a context string with the query phrase and words surrounding it
 */
export const getWordsSurroundingQuery = (content: string, query: string, padding = 2): string => {
  if (content.length < query.length) {
    return '';
  }

  // localCompare returns 0 if the strings are equivalent
  if (content.length === query.length && !content.localeCompare(query)) {
    return query;
  }

  // looks for first occurrence of query phrase inside content string
  const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
  if (queryIndex < 0) {
    return '';
  }

  // finds the closest space char (' ') before the query itself, which marks the start of phrase
  const queryMatchBegin = content.lastIndexOf(' ', queryIndex) + 1;
  // finds the closest space after the query, which marks the end of the phrase
  const queryMatchEnd = content.indexOf(' ', queryIndex + query.length);

  // extract query phrase
  const contentEndReached = queryMatchEnd < 0;
  const match = content.slice(queryMatchBegin, contentEndReached ? undefined : queryMatchEnd);

  const beginning = content.slice(0, queryMatchBegin).split(' ');
  const end = contentEndReached ? [''] : content.slice(queryMatchEnd).split(' ');

  // words before query phrase
  const beginningStr = beginning.slice(-(padding + 1)).join(' ');
  // words after query phrase
  const endStr = end.slice(0, padding + 1).join(' ');
  return beginningStr + match + endStr;
};

export const compareAlphabetically = (string1: string, string2: string) =>
  string1.localeCompare(string2, undefined, { sensitivity: 'base' });

export const sortAlphabetically = (strings: string[]) => [...strings].sort(compareAlphabetically);

export const simpleSubStringSearchFilter = (targetStrings: string[], searchString: string) => {
  if (!searchString) return targetStrings;
  return targetStrings.filter((str) => str.toLowerCase().includes(trimAndLowercase(searchString)));
};

export const simpleSubStringForwardSearchFilter = (targetStrings: string[], searchString: string) => {
  if (!searchString) return targetStrings;
  return targetStrings.filter((str) => str.toLowerCase().startsWith(trimAndLowercase(searchString)));
};
