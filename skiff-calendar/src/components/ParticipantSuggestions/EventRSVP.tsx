import capitalize from 'lodash/capitalize';
import { Tabs } from 'nightwatch-ui';
import { useEffect, useState } from 'react';
import { AttendeeStatus } from 'skiff-graphql';

interface EventRSVPProps {
  initialResponse: AttendeeStatus;
  update: (newStatus: AttendeeStatus) => void;
}

export const EventRSVP = ({ initialResponse, update }: EventRSVPProps) => {
  const [value, setValue] = useState(initialResponse);

  useEffect(() => {
    setValue(initialResponse);
  }, [initialResponse]);

  const rsvpOptions = [AttendeeStatus.Yes, AttendeeStatus.No, AttendeeStatus.Maybe];

  return (
    <Tabs
      fullWidth
      tabs={rsvpOptions.map((option) => ({
        active: option === value,
        label: capitalize(option.toLowerCase()),
        onClick: () => {
          setValue(option);
          update(option);
        }
      }))}
    />
  );
};
