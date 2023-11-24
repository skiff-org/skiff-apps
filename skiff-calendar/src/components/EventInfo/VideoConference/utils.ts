import { ToastProps } from 'nightwatch-ui';
import { SnackbarKey } from 'notistack';
import { copyToClipboardWebAndMobile } from 'skiff-front-utils';
import { sanitizeURL } from 'skiff-utils';
import { v4 } from 'uuid';

import { ConferenceProvider } from '../../../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';
import { VideoConference } from '../../../storage/models/event/types';

import { ProvidersDetails } from './constants';

// Note: We don't make any API call to jitsi - just generate a random link. So, safe to put event title here.
export const generateJitsiMeeting = (eventTitle?: string): VideoConference => {
  if (eventTitle) {
    const eventTitleWithoutWhiteSpaces = eventTitle.replace(/\s/g, '-');
    const eventTitleWithoutAlphaNumeric = eventTitleWithoutWhiteSpaces.replace(/[^a-zA-Z0-9]/g, '-');
    const eventTitleWithDashesCondensed = eventTitleWithoutAlphaNumeric.replace(/-+/g, '-');
    return {
      link: `https://meet.jit.si/skiff-event-${encodeURIComponent(eventTitleWithDashesCondensed)}-${v4()}`,
      provider: ConferenceProvider.Jitsi
    };
  }
  return {
    link: `https://meet.jit.si/skiff-meet-${v4()}`,
    provider: ConferenceProvider.Jitsi
  };
};

export const copyLinkToClipboard = async (link: string, enqueue: (toastProps: ToastProps) => SnackbarKey) => {
  copyToClipboardWebAndMobile(link);
  enqueue({
    title: 'Meeting link copied',
    body: 'Link to video call is copied to clipboard.'
  });
};

// IMPORTANT: if changing this generated text, need to change also the cleanup function (`cleanDescriptionFromConference`)
export const generateConferenceDescription = (conference: VideoConference) => {
  return `Join ${ProvidersDetails[conference.provider].title} here!

Link: ${conference.link}

* please do not edit this section`;
};

export const mergeDescriptionWithConference = (conference: VideoConference, description?: string) => {
  const conferenceDescription = generateConferenceDescription(conference);
  if (!description) return conferenceDescription;
  return `${description}

${conferenceDescription}
  `;
};

export const cleanDescriptionFromConference = (description?: string) => {
  if (!description) return undefined;
  return description.replace(/(Join)([\s\S]*)(here!)([\s\S]*)(please do not edit this section)/gi, '');
};

export const getVideoMeetingType = (input: string | undefined): ConferenceProvider | undefined => {
  if (!input) return undefined;
  try {
    const url = new URL(sanitizeURL(input));
    const [provider] = Object.entries(ProvidersDetails).find(([, details]) =>
      details.urls.some((urlMatcher: string | RegExp) => {
        if (typeof urlMatcher === 'string') {
          return urlMatcher.includes(url.host);
        } else {
          return urlMatcher.test(url.host);
        }
      })
    ) || [undefined];

    return (provider as ConferenceProvider | undefined) || ConferenceProvider.Unknown;
  } catch {
    return ConferenceProvider.Unknown;
  }
};

/**
 * guess the provider from the meeting link
 * @param link
 */
export const guessConferenceProvider = (link: string) => {
  const meetingType = getVideoMeetingType(link);

  return meetingType || ConferenceProvider.Unknown;
};
