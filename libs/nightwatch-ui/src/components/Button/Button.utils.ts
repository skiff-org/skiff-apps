/** Returns the className prop value passed to TextButtons and IconButtons */
export const getButtonClassName = (active: boolean, className: string, disabled: boolean) =>
  `${className} ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
