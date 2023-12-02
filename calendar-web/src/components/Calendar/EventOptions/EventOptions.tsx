import { DropdownItemColor } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { useSelectedEventState } from '../../../apollo/selectedEvent';
import { useSelectedEvent } from '../../../utils/hooks/useSelectedEvent';

import { EventOptionsDrawer } from './EventOptionsDrawer';
import { AnchorLeftTop, AnchorRef, EventOptionsDropdown } from './EventOptionsDropdown';

interface EventOptionsProps {
  /**
   * dropdownAnchor is a ref when there's another component we want to
   * anchor the dropdown to. If we want to anchor it as a context menu,
   * use AnchorLeftTop
   */
  dropdownAnchor?: AnchorLeftTop;
  dropdownBtnRef?: AnchorRef;
  eventID: string;
  isOpen: boolean;
  canEdit: boolean;
  onClose: () => void;
}

export const EventOptions: React.FC<EventOptionsProps> = ({
  dropdownAnchor,
  dropdownBtnRef,
  eventID,
  isOpen,
  canEdit,
  onClose
}: EventOptionsProps) => {
  const { deleteSelectedEvent, removeSelfFromEvent, duplicateEvent } = useSelectedEvent();
  const { selectedEvent, selectedDraft } = useSelectedEventState();

  const onDuplicate = () => {
    void duplicateEvent(eventID);
    onClose();
  };

  const onDelete = () => {
    if (canEdit) {
      void deleteSelectedEvent();
    } else {
      void removeSelfFromEvent();
    }
    onClose();
  };

  const options: {
    key: string;
    label: string;
    onClick: () => Promise<void> | void;
    color: DropdownItemColor;
  }[] = [
    {
      key: 'duplicate-event-option',
      label: 'Duplicate',
      onClick: onDuplicate,
      color: 'primary'
    },
    {
      key: `delete-event-option`,
      label: `Delete${canEdit ? '' : ' for me'}`,
      onClick: onDelete,
      color: 'destructive'
    }
  ];
  if (isMobile) return <EventOptionsDrawer isOpen={isOpen} onClose={onClose} options={options} />;

  if (!dropdownBtnRef || (!selectedEvent && !selectedDraft)) return null;

  return (
    <EventOptionsDropdown
      dropdownAnchor={dropdownAnchor}
      dropdownBtnRef={dropdownBtnRef}
      isOpen={isOpen}
      onClose={onClose}
      options={options}
    />
  );
};
