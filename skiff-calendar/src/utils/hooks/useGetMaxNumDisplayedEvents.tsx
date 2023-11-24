import { useEffect, useState } from 'react';

const MAX_4_EVENTS_THRESHOLD = 980;
const MAX_3_EVENTS_THRESHOLD = 900;
const MAX_2_EVENTS_THRESHOLD = 750;
const MAX_1_EVENT_THRESHOLD = 600;

const getMaxNumDisplayedEvents = () => {
  if (window.innerHeight > MAX_4_EVENTS_THRESHOLD) return 4;
  if (window.innerHeight > MAX_3_EVENTS_THRESHOLD) return 3;
  if (window.innerHeight > MAX_2_EVENTS_THRESHOLD) return 2;
  if (window.innerHeight > MAX_1_EVENT_THRESHOLD) return 1;
  return 0;
};

/** Returns the max number of event cards displayed in a day cell depending on the window size */
export const useGetMaxNumDisplayedEvents = () => {
  const [maxNumDisplayedEvents, setMaxNumDisplayedEvents] = useState(getMaxNumDisplayedEvents());

  useEffect(() => {
    const handleResize = () => {
      const newMaxNumDisplayedEvents = getMaxNumDisplayedEvents();
      if (maxNumDisplayedEvents === newMaxNumDisplayedEvents) return;
      setMaxNumDisplayedEvents(newMaxNumDisplayedEvents);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [maxNumDisplayedEvents]);

  return maxNumDisplayedEvents;
};
