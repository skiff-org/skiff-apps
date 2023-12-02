import { isMobile } from 'react-device-detect';
import { SendFeedbackDocument, SendFeedbackMutation, SendFeedbackMutationVariables } from 'skiff-front-graphql';
import { getFeedbackPlatformString, getFeedbackTokens } from 'skiff-front-utils';
import { FeedbackCategoryEnum } from 'skiff-graphql';

import client from '../apollo/client';

/**
 * Submits a feedback ticket, with any attached media files.
 * Media files are uploaded directly to Zendesk.
 * A Zendesk ticket is created for this submission, with the uploads linked.
 * @param {string[]} feedbackText text feedback
 * @param {File[]} supportingFiles Any associated media files.
 */
export const sendFeedback = async (
  feedbackText: string,
  isUrgent: boolean,
  requestType: FeedbackCategoryEnum,
  attachedFiles?: File[]
) => {
  const zendeskUploadTokens: string[] = [];
  if (attachedFiles?.length) {
    zendeskUploadTokens.push(...(await getFeedbackTokens(attachedFiles)));
  }

  const feedbackPlatformString = getFeedbackPlatformString();
  if (feedbackText.length) {
    await client.mutate<SendFeedbackMutation, SendFeedbackMutationVariables>({
      mutation: SendFeedbackDocument,
      variables: {
        request: {
          feedback: feedbackText,
          zendeskUploadTokens,
          isMobile,
          origin: 'Skemail',
          isNative: false,
          isUrgent,
          requestType,
          feedbackPlatformString
        }
      }
    });
  }
};
