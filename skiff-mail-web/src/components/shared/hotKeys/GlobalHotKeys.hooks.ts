import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { isDropdownOpen, isInputFieldInFocus, onHandleHotKeyPress } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../../hooks/useCurrentLabel';
import { ComposeExpandTypes, skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { useNavigate } from '../../../utils/navigation';
import { useSettings } from '../../Settings/useSettings';

/** Returns a handler for opening the command palette */
export const useOpenCmdPaletteHandler = () => {
  const dispatch = useDispatch();

  const openCmdPaletteHandler = useCallback(
    (e?: KeyboardEvent) => {
      onHandleHotKeyPress(e);
      dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
    },
    [dispatch]
  );

  return openCmdPaletteHandler;
};

/** Returns a handler for navigating between mailboxes */
export const useGoToMailboxHandler = () => {
  const { navigateToSystemLabel } = useNavigate();

  const goToMailboxHandler = useCallback(
    (e?: KeyboardEvent) => {
      onHandleHotKeyPress(e);
      switch (e?.key) {
        case 'i':
          // Go to Inbox
          navigateToSystemLabel(SystemLabels.Inbox);
          break;
        case 't':
          // Go to Sent
          navigateToSystemLabel(SystemLabels.Sent);
          break;
        case 'd':
          // Go to Drafts
          navigateToSystemLabel(SystemLabels.Drafts);
          break;
        case '!':
          // Go to Spam
          navigateToSystemLabel(SystemLabels.Spam);
          break;
        case 'e':
          // Go to Archive
          navigateToSystemLabel(SystemLabels.Archive);
          break;
        case '#':
          // Go to Trash
          navigateToSystemLabel(SystemLabels.Trash);
          break;
        default:
          break;
      }
    },
    [navigateToSystemLabel]
  );

  return goToMailboxHandler;
};

/** Returns system label info */
export const useSystemLabel = () => {
  const systemLabel = useCurrentLabel()?.label || '';

  // Mailbox type
  const isDrafts = systemLabel === SystemLabels.Drafts;
  const isSpam = systemLabel === SystemLabels.Spam;
  const isTrashOrArchive = systemLabel === SystemLabels.Trash || systemLabel === SystemLabels.Archive;

  return { systemLabel, isDrafts, isSpam, isTrashOrArchive };
};

export const useWrapActionHandler = (isSingleKeyHandler?: boolean) => {
  // Custom hooks
  const { isSettingsOpen } = useSettings();

  // Redux
  const { composeOpen, replyComposeOpen, composeCollapseState, openModal } = useAppSelector((state) => state.modal);

  // Whether or not the compose panel is collapsed
  const isComposeCollapsed = composeCollapseState === ComposeExpandTypes.Collapsed;
  // Whether or not the user is composing an email
  const isComposing = (composeOpen || replyComposeOpen.open) && !isComposeCollapsed;

  // Runs the global hot key handler if all hot key requirements pass
  const wrapActionHandler =
    (handler: (e?: KeyboardEvent) => void, enableWhenComposing?: boolean) => (e?: KeyboardEvent) => {
      // Ignore if
      if (
        // a dropdown is open / if an input field or text area is in focus
        (e && (isDropdownOpen(e) || isInputFieldInFocus(e))) ||
        // if the compose modal is open
        (!enableWhenComposing && isComposing) ||
        // if the settings modal is open
        isSettingsOpen ||
        // or if any other modal is open
        !!openModal
      )
        return;

      // For single-key handlers, ignore when meta or ctrl is pressed
      if (isSingleKeyHandler && e && (e.metaKey || e.ctrlKey)) return;

      handler(e);
    };

  return wrapActionHandler;
};
