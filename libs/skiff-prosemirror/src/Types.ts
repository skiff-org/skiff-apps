import { DateInputFormats, HourFormatValue } from 'skiff-front-utils';

export type ProsemirrorDocJson = { [key: string]: any };

export type CommentAttr = {
  comment: string; // Deprecated - we shouldnt use it anymore (only for supporting old comments which created before comment become an editor)
  content: ProsemirrorDocJson; // The content of the comment document
  name: string;
  userID: string | null;
  time: number;
  resolved: boolean | string;
  index?: number;
  id?: string;
  delete?: boolean;
  edited?: boolean;
  reactions?: CommentReactions;
};

/**
 * reactionId: id of the reaction emoji (each emoji has unique id)
 * each reactionId maps to an array of userIds (the users reacted)
 */
export type CommentReactions = { [reactionId: string]: string[] };

export type ThreadAttrs = {
  thread: CommentAttr[];
  id: string;
  // eslint-disable-next-line no-undef
  lastOpened: Record<string, number>;
  resolved?: boolean;
};

export type ImageLike = {
  height: number;
  id: string;
  src: string;
  width: number;
};

export interface UserSettings {
  // The use of template literal types below allows converting an enum to a union type
  dateFormat: `${DateInputFormats}`;
  timeFormat: `${HourFormatValue}`;
}
