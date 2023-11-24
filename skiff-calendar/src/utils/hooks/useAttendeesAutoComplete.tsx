import useAutocomplete from '@mui/material/useAutocomplete';
import { SetStateAction, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetCurrentUserEmailAliasesQuery } from 'skiff-front-graphql';
import { contactToAddressObject, useGetAllContactsWithOrgMembers } from 'skiff-front-utils';
import { AttendeeStatus, AttendeePermission } from 'skiff-graphql';

import { EventAttendee, EventAttendeeType } from '../../storage/models/event/types';

interface AttendeesAutoCompleteProps {
  setInputValue: React.Dispatch<SetStateAction<string>>;
  setInputError: React.Dispatch<SetStateAction<boolean>>;
  setShowAutocompletePaper: (value: boolean) => void;
  showAutocompletePaper: boolean;
}

export const useAttendeesAutoComplete = ({
  setInputValue,
  setInputError,
  showAutocompletePaper,
  setShowAutocompletePaper
}: AttendeesAutoCompleteProps) => {
  const highlightedOption = useRef<EventAttendee>();

  const { contactsWithOrgMembers } = useGetAllContactsWithOrgMembers({
    onError: (error) => {
      console.error(`Failed to retrieve User's contact list`, JSON.stringify(error, null, 2));
    }
  });

  const contactList = contactsWithOrgMembers.map(contactToAddressObject) ?? [];

  // TODO [PROD-1267] - Dedup useCurrentUserEmailAliases and use that to also catch generated wallet aliases
  const { data } = useGetCurrentUserEmailAliasesQuery();
  const currentUserAliases = data?.currentUser?.emailAliases ?? [];

  const autocompleteProps = useAutocomplete<EventAttendee, undefined, undefined, true>({
    getOptionLabel: (option) => (typeof option === 'string' ? option : option.email),
    id: 'add-participants',
    blurOnSelect: true,
    open: showAutocompletePaper,
    autoHighlight: !isMobile,
    filterOptions: (options, { inputValue }) =>
      options.filter(
        (option) =>
          option.email.toLowerCase().includes(inputValue.toLowerCase()) ||
          option.displayName?.toLowerCase().includes(inputValue.toLowerCase())
      ),
    // Set to false so that error states always persist even after clicking out of the input field
    clearOnBlur: false,
    onHighlightChange: (_, option) => {
      if (!option) return;
      highlightedOption.current = option;
    },
    isOptionEqualToValue: (option, value) => option.email === value.email,
    onInputChange: (_, value) => {
      setInputError(false);
      setInputValue(value);
      if (value.length == 0) {
        setShowAutocompletePaper(false);
        return;
      }
      setShowAutocompletePaper(true);
    },
    options:
      contactList.map((user) => ({
        // TODO maybe add primary calendar ID to contact list?
        id: user.address,
        type: EventAttendeeType.UnresolvedAttendee,
        email: user.address,
        displayName: user.name ?? undefined,
        optional: false,
        attendeeStatus: AttendeeStatus.Pending,
        permission: AttendeePermission.Read,
        deleted: false,
        updatedAt: new Date().getTime()
      })) || []
  });

  return { autocompleteProps, highlightedOption, currentUserAliases };
};
