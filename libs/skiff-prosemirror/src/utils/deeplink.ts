export enum AnchorTypes {
  Comment = 'comment',
  Mention = 'mention'
}

export const createDeepLink = (type: AnchorTypes, id: string) => `${type}=${id}`;

// get the document public link, and adds the deep link
export const createDeepLinkUrl = (type: AnchorTypes, id: string) => {
  // in public link a hash is passed after #, so we cut it and add it at the end of the url
  // we use the window.location here instead of customState.curDocumemtLink so it will get updated when the document permissions changes
  const [hostAndDoc, rest] = window.location.href.split('#');
  return `${hostAndDoc}/${createDeepLink(type, id)}#${rest || ''}`;
};
