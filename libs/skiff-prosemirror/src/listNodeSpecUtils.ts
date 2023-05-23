// utils for list/checkbox nodes

export const ALIGN_PATTERN = /(left|right|center|justify)/;
export const checkIfGdocCheckbox = (li: HTMLElement) => {
  if (!li.getAttribute) return false;
  return li.getAttribute('role') === 'checkbox';
};
export const gdocCheckboxIsChecked = (li: HTMLElement) => li.getAttribute('aria-checked') === 'true';
export const gdocListLevel = (li: Element) => {
  const attr = li.getAttribute('aria-level');
  if (attr === null) {
    return undefined;
  }
  return parseInt(attr) - 1;
};
