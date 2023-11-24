import { DropdownProps } from 'nightwatch-ui';
import { Dispatch, SetStateAction } from 'react';

type TimeZonePickerDropdownProps = Pick<DropdownProps, 'gapFromAnchor'>;

export interface TimeZonePickerProps extends TimeZonePickerDropdownProps {
  buttonRef: React.MutableRefObject<HTMLDivElement | null>;
  isOpen: boolean;
  timeZone: string;
  onSelectTimeZone: (tzName: string) => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  fixedHeight?: boolean;
}
