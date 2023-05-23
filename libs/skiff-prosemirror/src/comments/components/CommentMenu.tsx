import { Dropdown, DropdownItem, Icon, IconButton, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import React, { FC, useRef } from 'react';
import { isMobile } from 'react-device-detect';

import usePopup from '../hooks/usePopup';
import { Actions, EnabledStates } from '../utils/menuActions';

import { BodyPopup } from './BodyPopup';
import { EmojiPopup } from './EmojiPopup';

interface BadgeProps {
  color: string;
  text: string;
}
interface CommentMenuProps {
  disabled?: boolean;
  onResolved?: () => void;
  onReaction?: (reactionId: string) => void;
  actions?: Actions;
  onlyOnHover: boolean;
  theme: ThemeMode;
  badge?: BadgeProps;
}

export const COMMENT_MENU_CLASS_NAME = 'comment-actions-dropdown';
export const COMMENT_REACTIONS_CLASS_NAME = 'emoji-mart';

const CommentMenu: FC<CommentMenuProps> = ({
  onResolved,
  actions,
  onlyOnHover,
  onReaction,
  theme,
  badge,
  disabled = false
}) => {
  const reactionButttonRef = useRef<HTMLDivElement>(null);
  const actionsButtonRef = useRef<HTMLDivElement>(null);

  const { ref: reactionPickerRef, open: reactionPikerOpen, setOpen: setReactionPikerOpen } = usePopup();
  const { open: openDropdown, setOpen: setOpenDropdown } = usePopup();

  const DropdownItems =
    actions &&
    Object.keys(actions)
      .filter((label) => actions[label].enabled() === EnabledStates.Visible)
      .map((label) => (
        <DropdownItem
          key={label}
          label={label}
          onClick={(e) => {
            actions[label].action();
            e?.stopPropagation();
          }}
          icon={actions[label].icon}
        />
      ));

  return (
    <div className={`comment-options ${onlyOnHover && !openDropdown && !reactionPikerOpen ? 'onlyonhover' : ''}`}>
      {badge && (
        <div style={{ background: badge.color }} className='badge'>
          <Typography color='white' size={TypographySize.SMALL}>
            {badge.text}
          </Typography>
        </div>
      )}
      {onReaction && !isMobile && (
        <div ref={reactionButttonRef}>
          <IconButton
            disabled={disabled}
            onClick={() => {
              setReactionPikerOpen(true);
            }}
            icon={Icon.SmilePlus}
            tooltip='Add reaction'
          />
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
      {onResolved && (
        <IconButton
          disabled={disabled}
          onClick={(e) => {
            onResolved();
            e.stopPropagation();
          }}
          icon={Icon.CheckCircle}
          tooltip='Resolve thread'
        />
      )}
      {actions && (
        <div ref={actionsButtonRef}>
          <IconButton
            disabled={disabled}
            onClick={() => {
              setOpenDropdown(true);
            }}
            icon={Icon.OverflowH}
            tooltip='Options'
          />
        </div>
      )}
      <Dropdown
        className={COMMENT_MENU_CLASS_NAME}
        portal
        buttonRef={actionsButtonRef}
        showDropdown={openDropdown && !!DropdownItems}
        setShowDropdown={setOpenDropdown}
      >
        {DropdownItems}
      </Dropdown>
    </div>
  );
};

export default CommentMenu;
