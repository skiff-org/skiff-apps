import dayjs, { Dayjs } from 'dayjs';
import { Dropdown, DropdownItem, Icon, IconButton, Portal } from 'nightwatch-ui';
import { useCallback, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { useLocalHourFormat } from '../../hooks/useDate';

import DropdownItemWithInfo from './DropdownItemWithInfo';
import { useScheduleSendPopupAndDrawer } from './useSchedulePopupAndDrawer';

interface ClosedStep {
  type: PopupStepType.Closed;
}

interface DropdownStep {
  type: PopupStepType.Dropdown;
}
interface PopupStep {
  type: PopupStepType.Popup;
  initialDate?: Dayjs;
}

enum PopupStepType {
  Closed = 'closed',
  Dropdown = 'dropdown',
  Popup = 'popup'
}

type Steps = ClosedStep | DropdownStep | PopupStep;

const tomorrowMorning = dayjs(Date.now()).add(1, 'day').set('hour', 8).set('minutes', 0);
const tomorrowAfternoon = dayjs(Date.now()).add(1, 'day').set('hour', 16).set('minutes', 30);
const useScheduleSend = (handleSendClick: (scheduleSendAt?: Date) => Promise<void>) => {
  const ref = useRef<HTMLDivElement>(null);

  const [popupStep, setPopupStep] = useState<Steps['type']>(PopupStepType.Closed);
  const [initialDate, setInitialDate] = useState<Dayjs | undefined>();
  const timeFormat = useLocalHourFormat();

  const setStep = useCallback((step: Steps) => {
    if (step.type === PopupStepType.Popup) setInitialDate(step.initialDate);
    else setInitialDate(undefined);
    setPopupStep(step.type);
  }, []);

  const open = popupStep === PopupStepType.Popup;
  const setOpen = (open) => {
    if (!open) setStep({ type: PopupStepType.Closed });
  };

  const { ScheduleSendPopup, ScheduleSendDrawer } = useScheduleSendPopupAndDrawer({
    buttonRef: ref,
    handleSendClick,
    initialDate,
    open,
    setOpen
  });

  const ScheduleSendButton = (
    <>
      <IconButton
        active={popupStep !== PopupStepType.Closed}
        icon={Icon.Clock}
        onClick={() => {
          if (popupStep === PopupStepType.Closed) setStep({ type: PopupStepType.Dropdown });
        }}
        ref={ref}
        tooltip='Send later'
      />
      <Portal>
        <Dropdown
          buttonRef={ref}
          openUpwards
          portal
          setShowDropdown={(open) => {
            if (!open) setStep({ type: PopupStepType.Closed });
          }}
          showDropdown={popupStep === PopupStepType.Dropdown}
        >
          <DropdownItemWithInfo
            info={tomorrowMorning.format(`ddd MMM D [at] ${timeFormat}`)}
            label='Tomorrow morning'
            onClick={() => {
              setStep({ type: PopupStepType.Popup, initialDate: tomorrowMorning });
            }}
          />
          <DropdownItemWithInfo
            info={tomorrowAfternoon.format(`ddd MMM D [at] ${timeFormat}`)}
            label='Tomorrow afternoon'
            onClick={() => {
              setStep({ type: PopupStepType.Popup, initialDate: tomorrowAfternoon });
            }}
          />
          <DropdownItem
            icon={Icon.Calendar}
            label='Custom date'
            onClick={() => {
              setStep({ type: PopupStepType.Popup });
            }}
          />
        </Dropdown>
        {!isMobile && ScheduleSendPopup}
      </Portal>
    </>
  );

  return { ScheduleSendButton, ScheduleSendDrawer };
};

export default useScheduleSend;
