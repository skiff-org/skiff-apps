import { CodeInputType } from './CodeInput.types';

/** Checks that the input is valid
 * @param {CodeInputType} type - The input type
 * @param {string} value - The input value
 */
export const isValid = (type: CodeInputType, value: string) => {
  // If the input is of type number, check that it is a valid single-digit
  if (type === CodeInputType.NUMBER) return !Number.isNaN(Number(value)) && value.length == 1;
  // If the input is of type text, check that it is a single character
  return value.length === 1;
};

/** Pads the current string with a given string, as many times necessary, so that the resulting string array reaches a given length
 * @param {string} currString - Current string
 * @param {number} targetLength - Length required
 * @param {string} padString - String used for padding
 * @returns {string[]} - The resulting string is returned in the form of an array of characters
 */
export const padEnd = (currString: string, targetLength: number, padString = '') => {
  const stringArray = currString.split('');
  return Object.assign(new Array(targetLength).fill(padString), stringArray);
};
