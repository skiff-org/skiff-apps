/**
 * get section collapse state from local storage
 * @param id
 * @returns
 */
export const getCollapsedLSKey = (id: string) => `skiff:section:${id}`;

/**
 * parse local storage value to boolean
 * @param value
 * @returns
 */
export const parseLSValue = (value: string | null): boolean => value === 'true';

/**
 * parse boolean value to collapse local storage value(string)
 * @param value
 * @returns
 */
export const parseValueToLS = (value: boolean): 'true' | 'false' => (value ? 'true' : 'false');
