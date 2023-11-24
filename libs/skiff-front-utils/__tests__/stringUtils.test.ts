import { getWordsSurroundingQuery } from '../src/utils/stringUtils';

const query = 'query string';

describe('stringUtils', () => {
  it('returns the 3 words around the query string', () => {
    const content = 'word word word word query string word word word word';
    const result = getWordsSurroundingQuery(content, query, 2);
    const expected = 'word word query string word word';
    expect(result).toBe(expected);
  });

  it('matches query string case-insensitive', () => {
    const content = 'word word word word QUERY word word word word';
    const result = getWordsSurroundingQuery(content, 'query', 2);
    const expected = 'word word QUERY word word';
    expect(result).toBe(expected);
  });

  it('returns as many words as it can (up to `padding`) around query string', () => {
    const content = 'This is my content string...';
    const result = getWordsSurroundingQuery(content, 'this', 3);
    const expected = 'This is my content';
    expect(result).toBe(expected);

    const result2 = getWordsSurroundingQuery(content, 'string', 3);
    const expected2 = 'is my content string...';
    expect(result2).toBe(expected2);
  });

  it('returns query string when there are no words around it', () => {
    const content = 'query string';
    const result = getWordsSurroundingQuery(content, query);
    expect(result).toBe(content);
  });

  it('returns empty string when query string is not found', () => {
    const query = 'NOT_FOUND';
    const content = 'word word word';
    const result = getWordsSurroundingQuery(content, query);
    expect(result).toBe('');
  });

  it('ignores case', () => {
    const content = 'WORD QUERY STRING WORD';
    const result = getWordsSurroundingQuery(content, query);
    expect(result).toBe('WORD QUERY STRING WORD');
  });

  it('returns match when query is part of another word', () => {
    const query = 'hello';
    const content = 'Email us at hello@skiff.org for more info';
    const result = getWordsSurroundingQuery(content, query, 3);
    expect(result).toBe(content);
  });
});
