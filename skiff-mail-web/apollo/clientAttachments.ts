import { makeVar } from '@apollo/client';

const clientFetchedAttachments = makeVar<{ [attachmentID: string]: string }>({});

export const addClientFetchedAttachment = (id: string, content: string) => {
  clientFetchedAttachments({ ...clientFetchedAttachments(), [id]: content });
};

export const getClientFetchedAttachment = (id: string) => clientFetchedAttachments()[id];
