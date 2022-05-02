import { useState } from 'react';

import { EmailFieldTypes } from '../components/Compose/Compose.constants';
import { AddressObject } from '../generated/graphql';
import { PopulateComposeContent, PopulateComposeTypes } from './../redux/reducers/modalReducer';

interface Props {
  content: PopulateComposeContent | null;
  toAddresses: AddressObject[];
  bccAddresses: AddressObject[];
  ccAddresses: AddressObject[];
  subject: string;
}

export const useComposeFocusedFields = ({ content, toAddresses, ccAddresses, bccAddresses, subject }: Props) => {
  // Get the initial field to focus on
  const getInitialFocusedField = (): EmailFieldTypes => {
    if (!!content) {
      if (content.type === PopulateComposeTypes.Forward) {
        return EmailFieldTypes.TO;
      }
      if (content.type === PopulateComposeTypes.EditDraft) {
        if (toAddresses.length) {
          if (subject) {
            // Subject and To address field are not empty, focus on the email body
            return EmailFieldTypes.BODY;
          }
          return EmailFieldTypes.SUBJECT;
        }
        if (ccAddresses || bccAddresses) {
          return EmailFieldTypes.TO;
        }
      }
      // Reply or reply all, focus on the email body
      return EmailFieldTypes.BODY;
    }
    // Composing a new message, focus on the To field
    return EmailFieldTypes.TO;
  };

  const [focusedField, setFocusedField] = useState<EmailFieldTypes | null>(getInitialFocusedField());

  return { focusedField, setFocusedField };
};
