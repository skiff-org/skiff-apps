import { MarkEmailAsReadIcsMutation } from '../../generated/graphql';
import { EncryptedEmail } from '../../src/utils/sync/emailUtils';

export const unreadICSResponse = {
  emailsWithUnreadICS2: {
    emails: [
      {
        from: {
          address: 'foo@skiff.com'
        },
        id: 'd8e6017f-474d-47b7-bf4c-fae43887d8e4',
        attachmentMetadata: [
          {
            attachmentID: '183c7bb3-4fef-4dbc-80f1-77996b7a1465',
            encryptedData: {
              encryptedData:
                'NQUwLjIuMAUwLjEuMBpza2VtYWlsLmF0dGFjaG1lbnRNZXRhZGF0YQwEC5daiKKt4zgko6oAF8v4XybwWFZXGdF4NXsJ+y93PCB51xenieP5dX4DXVu8Vt0KdMKzuT+BPQfEZzfojwz+0PdsFCvzZWF5f4kV+WwtbFkjMJw/OpVRBATxDaVgzQ3p0G2W+/pQmco='
            }
          },
          {
            attachmentID: '7957a334-9098-4330-85ec-1c8d7836d781',
            encryptedData: {
              encryptedData:
                'NQUwLjIuMAUwLjEuMBpza2VtYWlsLmF0dGFjaG1lbnRNZXRhZGF0YQy2jSCDCDZTld7kzLEA/i+XpQiA5eKOMeVyhwfIfE9eNVEuhuSVpZUTPxcwIsCtMlDx93z1UCSQMTFZfaYkr2iIQiDjzxbVxeKJJabNIFOBse0/puIUhGArC24Y7c6z2o5Xyqpmmkqg6ZSB/g=='
            }
          }
        ],
        encryptedSessionKey: {
          encryptedSessionKey:
            'mqph8SCviHtC2RZ59V43nKdospftBpNzFB7Y9XmeFp/qIrv5u3PzUkpwVMmmgZQ8vxpdvr8tPDkna+yYZBAH3Uk0clNZPtSAKcK9HmXz5vQK0lp5',
          encryptedBy: { key: 'Jrp82CeTfc+BD8QONtX5OePmNd/P2ETXXVA9jupP1kI=' }
        }
      }
    ],
    hasMore: false
  }
};

export const decryptedEmailResponse: {
  [id: string]: EncryptedEmail;
} = {
  'd8e6017f-474d-47b7-bf4c-fae43887d8e4': {
    from: 'foo@skiff.com',
    id: 'd8e6017f-474d-47b7-bf4c-fae43887d8e4',
    decryptedAttachments: [
      {
        attachmentID: 'attachment_1',
        decryptedMetadata: {
          contentType: 'text',
          contentDisposition: 'attachment',
          filename: 'calendar.ics',
          checksum: '1',
          size: 1,
          contentId: 'attachment_1'
        }
      },
      {
        attachmentID: 'attachment_2',
        decryptedMetadata: {
          contentType: 'text/calendar',
          contentDisposition: 'calendar',
          filename: 'calendar.ics',
          checksum: '1',
          size: 1,
          contentId: 'attachment_2'
        }
      }
    ],
    attachmentMetadata: [
      {
        attachmentID: '183c7bb3-4fef-4dbc-80f1-77996b7a1465',
        encryptedData: {
          encryptedData:
            'NQUwLjIuMAUwLjEuMBpza2VtYWlsLmF0dGFjaG1lbnRNZXRhZGF0YQwEC5daiKKt4zgko6oAF8v4XybwWFZXGdF4NXsJ+y93PCB51xenieP5dX4DXVu8Vt0KdMKzuT+BPQfEZzfojwz+0PdsFCvzZWF5f4kV+WwtbFkjMJw/OpVRBATxDaVgzQ3p0G2W+/pQmco='
        }
      },
      {
        attachmentID: '7957a334-9098-4330-85ec-1c8d7836d781',
        encryptedData: {
          encryptedData:
            'NQUwLjIuMAUwLjEuMBpza2VtYWlsLmF0dGFjaG1lbnRNZXRhZGF0YQy2jSCDCDZTld7kzLEA/i+XpQiA5eKOMeVyhwfIfE9eNVEuhuSVpZUTPxcwIsCtMlDx93z1UCSQMTFZfaYkr2iIQiDjzxbVxeKJJabNIFOBse0/puIUhGArC24Y7c6z2o5Xyqpmmkqg6ZSB/g=='
        }
      }
    ],
    encryptedSessionKey: {
      encryptedBy: { key: 'Key', signature: 'Signature' },
      encryptedSessionKey: 'Another Key'
    },
    decryptedSessionKey: 'sessionKey'
  }
};

export const mockIcsContent = `
BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:20220922T130000Z
DTEND:20220922T140000Z
DTSTAMP:20220921T125617Z
ORGANIZER;CN=noam.golani@gmail.com:mailto:noam.golani@gmail.com
UID:65qq3t0ji5u0bl8q37b7uqkmdj@google.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE
 ;CN=noam.golani@gmail.com;X-NUM-GUESTS=0:mailto:noam.golani@gmail.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=noam.golani@skiff.com;X-NUM-GUESTS=0:mailto:noam.golani@skiff.com
X-GOOGLE-CONFERENCE:https://meet.google.com/imc-mzkh-zim
X-MICROSOFT-CDO-OWNERAPPTID:820412958
CREATED:20220921T125441Z
DESCRIPTION:This is a description\n\n-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:
 ~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-\nJoin: https://meet.googl
 e.com/imc-mzkh-zim\n\nView your event at https://calendar.google.com/calend
 ar/event?action=VIEW&eid=NjVxcTN0MGppNXUwYmw4cTM3Yjd1cWttZGogbm9hbS5nb2xhbm
 lAc2tpZmYuY29t&tok=MjEjbm9hbS5nb2xhbmlAZ21haWwuY29tMGZlOTg1ZTRlMDgzYTA2ZTZk
 NGU5NGFjMDE1MjZmNjY1YmVlYTdkOQ&ctz=Asia%2FJerusalem&hl=en_GB&es=1.\n\nPleas
 e do not edit this section.\n-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:
 ~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-
LAST-MODIFIED:20220921T125615Z
LOCATION:
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Example event
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
`;

export const markEmailAsReadIcsResponse: MarkEmailAsReadIcsMutation = {
  markEmailAsReadICS: null
};
