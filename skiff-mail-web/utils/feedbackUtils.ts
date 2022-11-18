import { isMobile } from 'react-device-detect';
import { SendFeedbackDocument, SendFeedbackMutation, SendFeedbackMutationVariables } from 'skiff-mail-graphql';

import client from '../apollo/client';

/**
 * Submits a feedback ticket, with any attached media files.
 * Media files are uploaded directly to Zendesk.
 * A Zendesk ticket is created for this submission, with the uploads linked.
 * @param {string[]} feedbackText text feedback
 * @param {File[]} supportingFiles Any associated media files.
 */
export const sendFeedback = async (feedbackText: string, supportingFiles?: File[]) => {
  const zendeskUploadTokens: string[] = [];
  if (supportingFiles?.length) {
    const res = await Promise.allSettled(
      supportingFiles?.map(async (file) => {
        const resp = await (
          await fetch(`https://skiff.zendesk.com/api/v2/uploads?filename=${file.name}`, {
            method: 'POST',
            body: file
          })
        ).json();
        if (resp?.upload?.token) {
          return resp.upload.token;
        }
        throw new Error('Failed to receive upload token from Zendesk');
      })
    );
    res.forEach((r) => {
      if (r.status === 'fulfilled') {
        zendeskUploadTokens.push(r.value);
      }
    });
  }
  if (feedbackText.length) {
    await client.mutate<SendFeedbackMutation, SendFeedbackMutationVariables>({
      mutation: SendFeedbackDocument,
      variables: {
        request: {
          feedback: feedbackText,
          zendeskUploadTokens,
          isMobile,
          origin: 'Skemail'
        }
      }
    });
  }
};
