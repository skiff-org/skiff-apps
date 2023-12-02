import { ThreadFragment } from 'skiff-front-graphql';

const body1 = 'test1';
const body2 = 'test2';

const subject = 'Important message';

const address1 = { address: '1@skiff.town', name: 'Satoshi Nakamoto' };
const address2 = { address: '2@skiff.town', name: 'Kanye West' };
const address3 = { address: '3@skiff.town' };

export const MOCK_THREAD: ThreadFragment = {
  threadID: '00000000000000000000000000000001',
  emailsUpdatedAt: new Date(0),
  threadContentUpdatedAt: new Date(0),
  emails: [
    {
      createdAt: new Date(1647024423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '1',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1647025780348),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body2,
      cc: [],
      from: address2,
      decryptedSubject: `Re: ${subject}`,
      to: [address1, address3],
      id: '2',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648024423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '3',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '4',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '5',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '6',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '7',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '8',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address1,
      decryptedSubject: subject,
      to: [address2],
      id: '9',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    },
    {
      createdAt: new Date(1648124423),
      attachmentMetadata: [],
      bcc: [],
      decryptedText: body1,
      cc: [],
      from: address2,
      decryptedSubject: subject,
      to: [address2],
      id: '10',
      encryptedSessionKey: {
        encryptedSessionKey: '',
        encryptedBy: {
          key: ''
        }
      },
      encryptedText: {
        encryptedData: ''
      },
      encryptedSubject: {
        encryptedData: ''
      },
      encryptedHtml: {
        encryptedData: ''
      },
      encryptedTextAsHtml: {
        encryptedData: ''
      },
      notificationsTurnedOffForSender: false
    }
  ],
  attributes: {
    systemLabels: [],
    read: false,
    userLabels: []
  }
};
