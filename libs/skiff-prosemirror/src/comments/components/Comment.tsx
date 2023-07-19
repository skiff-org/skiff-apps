import {
  Icon,
  Icons,
  Size,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipPlacement,
  TooltipTrigger,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React, { FC, ReactElement, Suspense, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { DateDisplay, formatName, getNameTooltipLabel } from 'skiff-front-utils';

import { UserAvatar } from '../../shared/UserAvatar';
import { CommentAttr, CommentReactions } from '../../Types';
import usePopup from '../hooks/usePopup';
import { Actions } from '../utils/menuActions';

import { BodyPopup } from './BodyPopup';
import { CommentViewer } from './CommentEditor';
import CommentMenu from './CommentMenu';
import { EmojiPopup } from './EmojiPopup';

const DISPLAY_LIMIT = 3;

const Emoji = React.lazy(() => import('emoji-mart').then((module) => ({ default: module.Emoji })));

const toReactionsString = (
  collabsDisplayNamesMap: { [userID: string]: string } | null,
  users: string[],
  userID: string
): string => {
  const reactionsCount = users.length;

  if (!collabsDisplayNamesMap) return reactionsCount === 1 ? `1 reaction` : `${reactionsCount} reactions`;

  return `${users
    .slice(0, DISPLAY_LIMIT)
    .map((reactorID) => (reactorID === userID ? 'me' : collabsDisplayNamesMap[reactorID]))
    .join(', ')}${reactionsCount > DISPLAY_LIMIT ? ` and ${reactionsCount - DISPLAY_LIMIT} others` : ''}`;
};

interface CommentReactionsProps {
  reactions: CommentReactions;
  currentUser: string;
  onReaction: (reactionsId: string) => void;
  collabsDisplayNamesMap: { [userID: string]: string } | null;
  theme: ThemeMode;
}

const CommentReactionsComponent: FC<CommentReactionsProps> = ({
  onReaction,
  currentUser,
  reactions,
  collabsDisplayNamesMap,
  theme
}) => {
  const { ref: reactionPickerRef, open: reactionPikerOpen, setOpen: setReactionPikerOpen } = usePopup();
  const reactionButttonRef = useRef<HTMLDivElement>(null);

  return (
    <div className='comment-reactions'>
      {Object.keys(reactions).map((reactionId) => (
        <Tooltip placement={TooltipPlacement.RIGHT} key={reactionId}>
          <TooltipContent>
            {toReactionsString(collabsDisplayNamesMap, reactions[reactionId], currentUser)}
          </TooltipContent>
          <TooltipTrigger>
            <div
              className={`reaction-button ${reactions[reactionId].includes(currentUser) ? 'active-reaction' : ''}`}
              onClick={(e) => {
                if (onReaction) onReaction(reactionId);
                e.stopPropagation();
              }}
            >
              <Suspense fallback={null}>
                <Emoji emoji={reactionId} size={17} />
              </Suspense>
              {reactions[reactionId].length > 1 && (
                <Typography mono uppercase size={TypographySize.SMALL}>
                  {reactions[reactionId].length}
                </Typography>
              )}
            </div>
          </TooltipTrigger>
        </Tooltip>
      ))}
      {reactions && currentUser && isMobile && Object.keys(reactions).length !== 0 && (
        <div
          className={`reaction-button add-reaction`}
          ref={reactionButttonRef}
          onClick={() => {
            setReactionPikerOpen(true);
          }}
        >
          <Icons icon={Icon.SmilePlus} color='secondary' />
        </div>
      )}
      <BodyPopup
        top={reactionButttonRef.current?.getBoundingClientRect().top || 0}
        left={reactionButttonRef.current?.getBoundingClientRect().left || 0}
      >
        <div ref={reactionPickerRef}>
          <EmojiPopup
            onSelect={({ id }) => {
              if (id && onReaction) onReaction(id);
              setReactionPikerOpen(false);
            }}
            style={{
              zIndex: 100,
              position: 'absolute',
              transform: `translateX(-100%) ${
                (reactionButttonRef.current?.getBoundingClientRect().top || 0) + 360 > window.outerHeight
                  ? 'translateY(-100%)'
                  : ''
              }`
            }}
            theme={theme}
            open={reactionPikerOpen}
          />
        </div>
      </BodyPopup>
    </div>
  );
};

interface CommentHeadingProps {
  name: string;
  time: number;
}
const CommentHeading: FC<CommentHeadingProps> = ({ time, name }) => (
  <div className='comment-heading'>
    <Tooltip placement={TooltipPlacement.RIGHT}>
      <TooltipContent>{getNameTooltipLabel(name)}</TooltipContent>
      <TooltipTrigger>
        <Typography mono uppercase weight={TypographyWeight.MEDIUM}>
          {formatName(name)}
        </Typography>
      </TooltipTrigger>
    </Tooltip>

    <Typography mono uppercase color='secondary'>
      <DateDisplay value={time} />
    </Typography>
  </div>
);

interface CommentProps {
  comment: CommentAttr;
  showAvatar: boolean;
  hideHeader: boolean;
  actions?: Actions;
  editElement?: ReactElement;
  onReaction: (reactionId: string) => void;
  currentUser: string;
  theme: ThemeMode;
  name: string;
  collabsDisplayNamesMap: { [userID: string]: string } | null;
  disabled?: boolean;
}

const Comment: FC<CommentProps> = ({
  comment: { comment, time, edited, reactions, content },
  showAvatar,
  hideHeader,
  actions,
  editElement,
  onReaction,
  currentUser,
  theme,
  name,
  collabsDisplayNamesMap,
  disabled = false
}) => (
  <div>
    <div className='comments-comment'>
      {showAvatar && <UserAvatar label={name} size={Size.SMALL} />}
      <div className='comment-content'>
        {!hideHeader && <CommentHeading name={name} time={time} />}
        {editElement ? (
          <div style={{ marginLeft: -22 }}>{editElement}</div>
        ) : (
          <>
            <CommentViewer content={content} oldComment={comment} />
            {edited && (
              <Typography mono uppercase color='secondary'>
                (edited)
              </Typography>
            )}
            {reactions && (
              <CommentReactionsComponent
                theme={theme}
                collabsDisplayNamesMap={collabsDisplayNamesMap}
                onReaction={onReaction}
                currentUser={currentUser}
                reactions={reactions}
              />
            )}
          </>
        )}
      </div>
      {!editElement && (
        <CommentMenu
          disabled={disabled}
          actions={actions}
          onlyOnHover={true}
          onReaction={currentUser ? onReaction : undefined}
          theme={theme}
        />
      )}
    </div>
  </div>
);

export default Comment;
