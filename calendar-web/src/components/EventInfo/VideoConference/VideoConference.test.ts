import { ConferenceProvider } from '../../../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';

import { getVideoMeetingType } from './utils';

describe('Video Conference', () => {
  it('Infer meeting provider from link', () => {
    // converting to number to match the values in the enum (auto generated as numbers)
    expect(Number(getVideoMeetingType(`https://meet.jit.si/test-meeting}`))).toBe(ConferenceProvider.Jitsi);
    expect(Number(getVideoMeetingType(`meet.google.com/test-meeting`))).toBe(ConferenceProvider.GoogleMeet);
    expect(Number(getVideoMeetingType(`teams.microsoft.com/test-meeting`))).toBe(ConferenceProvider.MicrosoftTeams);
    expect(Number(getVideoMeetingType(`talk.brave.com/test-meeting`))).toBe(ConferenceProvider.BraveTalk);
    expect(Number(getVideoMeetingType(`https://another.meeting.provider/test-meeting`))).toBe(
      ConferenceProvider.Unknown
    );
  });
});
