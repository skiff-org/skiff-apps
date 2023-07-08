export const MOCK_MAILBOX_REQUEST = {
  data: {
    mailbox: {
      threads: [
        {
          threadID: '80d21e74-635e-4a4b-8197-5d59cddcede4',
          attributes: {
            read: false,
            systemLabels: ['INBOX'],
            userLabels: [
              {
                labelID: 'cef00e47-32c7-464e-9c62-e4006a473de4',
                color: 'blue',
                labelName: 'testwelcome@skiff.com',
                variant: 'ALIAS',
                __typename: 'UserLabel'
              }
            ],
            __typename: 'ThreadAttributes'
          },
          emails: [
            {
              id: '7e678159-e787-4702-bb7f-5b853a8131c3',
              attachmentMetadata: [],
              createdAt: 1688763712253,
              from: {
                name: 'Skiff Team',
                address: 'hello@skiff.com',
                blocked: false,
                __typename: 'AddressObject'
              },
              to: [
                {
                  name: null,
                  address: 'testwelcome@skiff.com',
                  blocked: null,
                  __typename: 'AddressObject'
                }
              ],
              cc: [],
              bcc: [],
              replyTo: null,
              encryptedSessionKey: {
                encryptedSessionKey:
                  'dXMTOAulXP57tvrlCkPxZgxSelgcW4ZctIjoKfTADCvLcNGqurPUIRi6thRsfXLIPyz3iworuRLBdJrK7FFoCAfvHlsf5emX3cBDgyHL+gKcDnGe',
                encryptedBy: {
                  key: 'cqo/LISTMKXxpWvt6Mdgqhw6cO8mSnEg+8DwFHvM6yA='
                },
                __typename: 'EncryptedSessionKeyOutput'
              },
              decryptedSubject: 'Welcome to Skiff Mail',
              decryptedAttachments: [],
              decryptedTextSnippet:
                'Skiff Mail is end-to-end encrypted email that protects your inbox and gives you the power to communi',
              decryptedText:
                'Skiff Mail is end-to-end encrypted email that protects your inbox and gives you the power to communicate freely.',
              encryptedSubject: {
                encryptedData:
                  'LgUwLjIuMAUwLjEuMBNza2VtYWlsLm1haWxTdWJqZWN0DDJEor98rhkM3G3WOgDIRNumWOOY0iLT4Qsp1n143gGZ3B2f4pIAqyWI4DE8xaYF5IOWSmQ=',
                __typename: 'EncryptedDataOutput'
              },
              encryptedTextSnippet: {
                encryptedData:
                  'KwUwLjIuMAUwLjEuMBBza2VtYWlsLm1haWxUZXh0DJ3qds7GLZxJSR+VcwC2ApvYpkgSoZemVU4EjqPJ93Gb6UnwJxnTVd3+n87+bzX8ePkKScd1mcMsiWJRkIVf2kbqTrSWuazkqlvzQuE/i9CCFzlVgPZjg64ubZHhy9gdCfnbV5tMhS2Hd+jth7/0hhfMdGG0D2hZxxQaUYnHMwtjh//y',
                __typename: 'EncryptedDataOutput'
              },
              scheduleSendAt: 1688763712247,
              encryptedRawMimeUrl: null,
              __typename: 'Email'
            }
          ],
          emailsUpdatedAt: 1688763712393,
          sentLabelUpdatedAt: null,
          __typename: 'UserThread'
        },
        {
          threadID: '6e62341b-3568-4770-b76d-dff0404fcf03',
          attributes: {
            read: false,
            systemLabels: ['INBOX'],
            userLabels: [
              {
                labelID: 'cef00e47-32c7-464e-9c62-e4006a473de4',
                color: 'blue',
                labelName: 'testwelcome@skiff.com',
                variant: 'ALIAS',
                __typename: 'UserLabel'
              }
            ],
            __typename: 'ThreadAttributes'
          },
          emails: [
            {
              id: 'ec41730e-8163-49b4-999b-ffae53921abc',
              attachmentMetadata: [],
              createdAt: 1688763712133,
              from: {
                name: 'Skiff Team',
                address: 'hello@skiff.com',
                blocked: false,
                __typename: 'AddressObject'
              },
              to: [
                {
                  name: null,
                  address: 'testwelcome@skiff.com',
                  blocked: null,
                  __typename: 'AddressObject'
                }
              ],
              cc: [],
              bcc: [],
              replyTo: null,
              encryptedSessionKey: {
                encryptedSessionKey:
                  'keFs0IZ3UXKSMsuXBHKgnzsSCDWlG1IbNH33w2xCzLj58ai8g5WdOdfl30oKp7qHlKnYxi06W70uyNlHXGG8fmmM/DkLXQj0jB6WZNmyQ5p9eibp',
                encryptedBy: {
                  key: 'cqo/LISTMKXxpWvt6Mdgqhw6cO8mSnEg+8DwFHvM6yA='
                },
                __typename: 'EncryptedSessionKeyOutput'
              },
              decryptedSubject: 'Download the mobile and desktop apps',
              decryptedAttachments: [],
              decryptedTextSnippet:
                'Skiff Mail is end-to-end encrypted email that protects your inbox and gives you the power to communi',
              decryptedText:
                'Skiff Mail is end-to-end encrypted email that protects your inbox and gives you the power to communicate freely.',
              decryptedTextAsHtml:
                'Skiff Mail is end-to-end encrypted email that protects your inbox and gives you the power to communicate freely.',
              encryptedSubject: {
                encryptedData:
                  'LgUwLjIuMAUwLjEuMBNza2VtYWlsLm1haWxTdWJqZWN0DADSLHl8mVg610zgOgCV7ySHQbcY3EhxibuvkFZVaRbKHmB36bi+s/XW9gHIvty8PCo1athC30YVfDJeMqZgPZ5SKSQ=',
                __typename: 'EncryptedDataOutput'
              },
              encryptedTextSnippet: {
                encryptedData:
                  'KwUwLjIuMAUwLjEuMBBza2VtYWlsLm1haWxUZXh0DGzuiFkKiU0XhbiYtQAlxLv7GZ6q4v6FUffnat+eCn1iFVfS7cjtrXtXENE4WcLfATDC5keHiZyPWHGEoY6heYuHhLRVapTDhbySqMTW1/nRiD9eyoJ07t5TY5DwSryCEwUOOjqHFKiJD9wc1RqeIXJ7bAoHDnXcXRrIMEkVbGuaiXQM',
                __typename: 'EncryptedDataOutput'
              },
              scheduleSendAt: 1688763712126,
              encryptedRawMimeUrl: null,
              __typename: 'Email'
            }
          ],
          emailsUpdatedAt: 1688763712250,
          sentLabelUpdatedAt: null,
          __typename: 'UserThread'
        }
      ],
      pageInfo: {
        hasNextPage: false,
        cursor: null,
        __typename: 'MailboxPageInfo'
      },
      __typename: 'Mailbox'
    }
  }
};
