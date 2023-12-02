import { Icon } from 'nightwatch-ui';

import { ConferenceProvider } from '../../../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';

import { ProviderDetails } from './types';

export const ProvidersDetails: { [key in ConferenceProvider]: ProviderDetails } = {
  [ConferenceProvider.Jitsi]: {
    title: 'Jitsi Meet',
    icon: Icon.Video,
    urls: ['https://meet.jit.si']
  },
  [ConferenceProvider.GoogleMeet]: {
    title: 'Google Meet',
    icon: Icon.Video,
    urls: ['meet.google.com']
  },
  [ConferenceProvider.MicrosoftTeams]: {
    title: 'Zoom Meeting',
    icon: Icon.Video,
    urls: ['teams.microsoft.com']
  },
  [ConferenceProvider.Zoom]: {
    title: 'Zoom Meeting',
    icon: Icon.Video,
    urls: [/us([\d]{2})web.zoom.us/gi]
  },
  [ConferenceProvider.BraveTalk]: {
    title: 'Brave Meeting',
    icon: Icon.Brave,
    urls: ['talk.brave.com']
  },
  [ConferenceProvider.Unknown]: {
    title: 'Meeting',
    icon: Icon.Video,
    urls: []
  },
  [ConferenceProvider.UNRECOGNIZED]: {
    title: 'Meeting',
    icon: Icon.Video,
    urls: []
  }
};
