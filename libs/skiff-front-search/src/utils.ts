import dayjs from 'dayjs';
import orderBy from 'lodash/orderBy';
import partition from 'lodash/partition';
import { MatchInfo, SearchOptions, SearchResult } from 'minisearch';
import { CONTENT_SNIPPET_SIZE, filterExists, filterTruthy } from 'skiff-utils';
import { stemmer } from 'stemmer';
import isEmail from 'validator/lib/isEmail';

import { AscDesc } from '../../skiff-graphql/src';
import { stopWords } from './stopWords';
import {
  DateRangeFilter,
  EditorMiniSearchResult,
  IndexedItemBase,
  MiniSearchResultBase,
  SearchClient,
  SkemailMiniSearchResult
} from './types';

// This regular expression matches any Unicode space or punctuation character
// Copied from https://github.com/lucaong/minisearch
// which adapted from https://unicode.org/cldr/utility/list-unicodeset.jsp?a=%5Cp%7BZ%7D%5Cp%7BP%7D&abb=on&c=on&esc=on
const SPACE_OR_PUNCTUATION =
  /[\n\r -#%-*,-/:;?@[-\]_{}\u00A0\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/u;

const defaultBaseSearchOptions: SearchOptions = {
  // words of >=8 characters get an allowable edit distance of 1
  fuzzy: 0.07,
  // perform prefix search (i.e. "monk" matches "monkfish") only with terms greater than 3 chars
  prefix: (term) => term.length > 3,
  // max edit distance of 1 no matter length of an individual term
  maxFuzzy: 1
};

const defaultSkemailSearchOptions: SearchOptions = {
  ...defaultBaseSearchOptions,
  // boost subject and from weights and downgrade weight for secondary addresses
  boost: { subject: 1.25, from: 1.1, ccAddresses: 0.75, cc: 0.75, bccAddresses: 0.75, bcc: 0.75 }
};

const defaultEditorSearchOptions: SearchOptions = {
  ...defaultBaseSearchOptions,
  boost: { title: 1.25 }
};

export const getSortableSearchResults = (searchResults: SearchResult[]): MiniSearchResultBase[] =>
  searchResults.map((result) => {
    return {
      ...result,
      // convert updatedAt from string to number
      updatedAt: result.updatedAt ? Number(result.updatedAt) : 0
    };
  });

export const chronSortResults = (sortableSearchResults: MiniSearchResultBase[], order?: AscDesc) =>
  orderBy(sortableSearchResults, ['updatedAt'], [!!order && order === AscDesc.Asc ? 'asc' : 'desc']);


// if the difference between a relevance score and a reference is less than or equal to this proportion of the reference,
// we say they are roughly equal
const CLOSE_SCORE_PROPORTION = 0.05;

const isScoreCloseToReference = (score: number, referenceScore: number, closeProportion: number) => {
  const difference = Math.abs(score - referenceScore);
  return difference <= referenceScore * closeProportion;
};

/**
 * Minisearch scores results on a relative scale. It would be typical to see a distribution of scores such as [155, 146, 145, 42, 41, 40, 30, 25, 11, 10, 5],
 * where each of the scores in the 40s correspond to emails that have no meaningful difference in relevance.
 * Within closely grouped scores, we want to be able to further sort by our own criteria, such as 'updatedAt',
 * to improve the relevance of these results. This is important, e.g., when all scores are very closely grouped or when
 * there is a long tail of results that are much less relevant than the top few.
 * This function clusters scores within groups bounded by a specified distance from a representative score for each group.
 */
export const groupResultsByRoughlyEquivalentScores = (
  scoreOrderedResults: MiniSearchResultBase[]
): MiniSearchResultBase[][] => {
  if (!scoreOrderedResults.length) {
    return [];
  }
  const groupedResults = scoreOrderedResults.reduce((acc: MiniSearchResultBase[][], searchResult) => {
    const lastSubarray = acc[acc.length - 1];
    if (
      lastSubarray &&
      isScoreCloseToReference(
        searchResult.score,
        lastSubarray.reduce((sum, result) => sum + result.score, 0) / lastSubarray.length, // the average score in this cluster so far
        CLOSE_SCORE_PROPORTION
      )
    ) {
      lastSubarray.push(searchResult);
    } else {
      acc.push([searchResult]);
    }
    return acc;
  }, []);
  return groupedResults;
};

const defaultTokenize = (text: string): string[] => {
  // split on any space or punctuation; same as minisearch default tokenizer
  // except i've corrected for the possibility for returning empty strings
  return text.split(SPACE_OR_PUNCTUATION).filter(filterTruthy);
};

// used to take off the last plausibly sentence- or clause-ending punctuation mark from a string if it exists;
// not comprehensive or critical but aimed at ensuring that in the majority case we don't miss otherwise valid
// in-line email addresses that end a sentence or clause (e.g. "Can I reach you at support@skiff.org?") in our tokenization logic
const removeTrailingPunctuation = (text: string) => {
  const sentenceOrClauseEndingPunctuation = /[!.,;?]/;
  const lastChar = text.slice(-1);
  return sentenceOrClauseEndingPunctuation.test(lastChar) ? text.slice(0, -1) : text;
};

// split on any whitespace char
export const getSpaceDelimitedTerms = (text: string) => text.split(/\s+/);

const isEmailAfterNormalization = (term: string) => {
  try {
    return isEmail(removeTrailingPunctuation(term)); // if an address ends a sentence, we still want it
  } catch (e) {
    console.error('Tokenization error: ', e);
    return false;
  }
};

/**
 * Minisearch by default tokenizes on any punctution. 'alice@skiff.com' gets tokenized as ['alice', 'skiff', 'com'].
 * We want to preserve integrity of email addresses so that users can carry out exact match search on a complete address. So we add additional intact
 * address token(s) to any indexed field whose value includes address(es). Note that the component pieces of the email address are still searchable on their own as well.
 */
export const customSkemailIndexTokenizer = (text: string): string[] => {
  // split text on any type of space
  const spaceDelimitedTerms = getSpaceDelimitedTerms(text);
  const emailTerms = spaceDelimitedTerms.filter(isEmailAfterNormalization).map(removeTrailingPunctuation);
  // add intact email address tokens, then add default tokens
  return [...emailTerms, ...defaultTokenize(text)];
};

/**
 * Minisearch by default tokenizes on any punctution. 'alice@skiff.com' gets tokenized as ['alice', 'skiff', 'com'].
 * If user search input includes an address, we override this default behavior and tokenize the address as a whole to enable exact match for the address.
 * NB: This is distinct from the indexing logic, whereby we add one token for complete address and then additional tokens
 * for each punctuation-delimited part of the address. This distinction ensure that:
 * 1. A complete address will uniquely match fields that contain that exact address. And a document's relevance will not be artificially boosted by virtue of matching
 * both the address token and each component token for every mention of the address within the document. I.e. the query "alice@skiff.com" should match only "alice@skiff.com",
 * not "alice", "skiff" or "com" ("com" is actually a stop word so wouldn't really match)
 * 2. Searching for part of an address will still match that address, i.e. if user searches "alice", it will still match mentions of "alice@skiff.com", given that an
 * address is tokenized to, e.g., ["alice@skiff.com", "alice", "skiff"] in the index.
 */
export const customSkemailQueryTokenizer = (query: string): string[] => {
  // split text on any type of space
  const spaceDelimitedTerms = getSpaceDelimitedTerms(query);
  const [emailTerms, nonEmailTerms] = partition(spaceDelimitedTerms, isEmailAfterNormalization);
  return [...emailTerms.map(removeTrailingPunctuation), ...defaultTokenize(nonEmailTerms.join('\n'))];
};

// a custom processor we run on all tokens before they are indexed
export const customTokenProcesser = (token: string): string | null =>
  stopWords.has(token) ? null : stemmer(token.toLowerCase());

// given a text, tokenize and process it in the same way that we tokenize and process text for the MiniSearch index
export const getProcessedIndexTokens = (rawQuery: string) =>
  customSkemailIndexTokenizer(rawQuery).map(customTokenProcesser).filter(filterExists);

export const getMatchingTermsFromMatchInfo = (matchInfo: MatchInfo): Set<string> => new Set(Object.keys(matchInfo));

export const getMatchingFieldsFromMatchInfo = (matchInfo: MatchInfo) => Object.values(matchInfo).flat();

// given a set of already normalized tokens, check whether a raw string has overlap with those matches once it is also normalized
export const doesNormalizedTextMatch = (term: string, normalizedMatchTokens: Set<string>) => {
  const processedTokens = getProcessedIndexTokens(term);
  return processedTokens.some((token) => normalizedMatchTokens.has(token));
};

/**
 * Given raw text and MiniSearch-specified matchInfo that justifies its inclusion in MiniSearch results,
 * normalize the text in the same way that we normalize search-indexed text (e.g. "technology" is
 * stemmed to "tech"). Then extract a substring that includes the first matching term in the text.
 * Searching for an un-normalized substring in the text would lead to false positives (e.g. "MIT" matching
 * "unliMITed"), and false negatives via missing matches on stemmed forms.
 */
export const excerptNormalizedQueryMatch = (
  text: string,
  matchInfo: MatchInfo,
  maxNumLeadingWords = 2,
  excessiveLeadingWordsLength = 25
): string => {
  // delimit by space chars to so that we can easily reconstitute this string once we've found the area of interest
  const spaceDelimitedTerms = getSpaceDelimitedTerms(text);

  const matchingTerms = getMatchingTermsFromMatchInfo(matchInfo);

  const firstMatchIndex = spaceDelimitedTerms.findIndex((term) => doesNormalizedTextMatch(term, matchingTerms));

  if (firstMatchIndex < 0) {
    // return the text in its entirety if no match is found
    return text;
  }

  // if practical, we include leading terms to contextualize the match
  const expectedFirstWordIndex = firstMatchIndex - maxNumLeadingWords >= 0 ? firstMatchIndex - maxNumLeadingWords : 0;

  const leadingWords = spaceDelimitedTerms.slice(expectedFirstWordIndex, firstMatchIndex);

  const areLeadingWordsTooLong = leadingWords.join(' ').length > excessiveLeadingWordsLength;

  // if the leading words seem likely to crowd out the match in a preview snippet (likely for example when
  // a match is preceded by a long in-line url in an emaiil body), simply start from the match
  const firstWordIndex = areLeadingWordsTooLong ? firstMatchIndex : expectedFirstWordIndex;

  // add a leading ellipsis if start of the string is ellided;
  // preserve the trailing space after ellipsis so as not to change token boundaries
  // if further examination is carried out
  const contextPrefix = firstWordIndex > 0 ? '\u2026 ' : '';

  const formattedText = `${contextPrefix}${spaceDelimitedTerms.slice(firstWordIndex).join(' ')}`;

  return formattedText.slice(0, CONTENT_SNIPPET_SIZE);
};

export const isMiniSearchResultBase = (
  result: IndexedItemBase | MiniSearchResultBase
): result is MiniSearchResultBase => {
  return 'terms' in result && 'match' in result && 'score' in result;
};

export const isSkemailMiniSearchResult = (
  result: IndexedItemBase | SkemailMiniSearchResult
): result is SkemailMiniSearchResult => {
  return isMiniSearchResultBase(result) && 'threadID' in result;
};

export const isEditorMiniSearchResult = (
  result: IndexedItemBase | EditorMiniSearchResult
): result is EditorMiniSearchResult => {
  return isMiniSearchResultBase(result) && 'title' in result && 'contentType' in result;
};

export const smartSortResults = (results: MiniSearchResultBase[]) => {
  // give overall best results first, sorting reverse chronologically within clusters of similarly relevant results
  const resultsGroupedByRelevance = groupResultsByRoughlyEquivalentScores(results);
  // within each cluster of roughly equivalent relevance, sort by updatedAt
  const sortedRelevanceGroups = resultsGroupedByRelevance.map((group) => chronSortResults(group));

  return sortedRelevanceGroups.flat();
};

export const getDateRangeFromDaysAgo = (daysAgo: number) => {
  const now = dayjs();
  return { start: now.subtract(daysAgo, 'day'), end: now };
};

export const getCustomDateFilter = (range: DateRangeFilter) => (result: SearchResult) => {
  const normalizedResult = getSortableSearchResults([result])[0];
  if (!normalizedResult) return true;
  const { start } = getDateRangeFromDaysAgo(range.daysAgo);
  return dayjs(normalizedResult.updatedAt).isAfter(start);
};

export const getDefaultSearchOptions = (searchClient: SearchClient, query: string, dateRange?: DateRangeFilter) => {
  const baseOptions = searchClient === SearchClient.SKEMAIL ? defaultSkemailSearchOptions : defaultEditorSearchOptions;
  const dateFilter = dateRange ? { filter: getCustomDateFilter(dateRange) } : undefined;
  const completeOptions = {
    ...baseOptions,
    ...dateFilter
  };
  if (searchClient === SearchClient.SKEMAIL) {
    const terms = query.split(' ');
    if (terms.some(isEmailAfterNormalization)) {
      // boost address fields by default if query appears to contain address
      return { ...completeOptions, boost: { toAddresses: 1.25, fromAddress: 1.25 } };
    }
  }
  return completeOptions;
};
