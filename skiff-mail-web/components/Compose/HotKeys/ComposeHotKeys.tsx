import { BaseSyntheticEvent, Dispatch, FC, SetStateAction, useCallback } from 'react';
import { HotKeys } from 'react-hotkeys';
import { AddressObject } from 'skiff-graphql';

import { HotKeyHandlers } from '../../shared/hotKeys/hotKeys';
import { EmailFieldTypes } from '../Compose.constants';

import { ComposeKeyActions, singleCombinationKeyMap } from './HotKeys';

export interface ComposeHotKeysProps {
  setFocusedField: Dispatch<SetStateAction<EmailFieldTypes | null>>;
  openAttachmentSelect: () => void;
  discardDraft: () => Promise<void>;
  handleSendClick: () => Promise<void>;
  setBccAddresses: Dispatch<SetStateAction<AddressObject[]>>;
  setCcAddresses: Dispatch<SetStateAction<AddressObject[]>>;
  bccAddresses: AddressObject[];
  ccAddresses: AddressObject[];
  setShowBcc: Dispatch<SetStateAction<boolean>>;
  setShowCc: Dispatch<SetStateAction<boolean>>;
}

const ComposeHotKeys: FC<ComposeHotKeysProps> = ({
  setFocusedField,
  openAttachmentSelect,
  discardDraft,
  handleSendClick,
  setBccAddresses,
  setCcAddresses,
  bccAddresses,
  ccAddresses,
  setShowBcc,
  setShowCc,
  children
}) => {
  const focusHandler = useCallback(
    (e: KeyboardEvent | undefined) => {
      switch (e?.key) {
        case 'o':
          setFocusedField(EmailFieldTypes.TO);
          break;
        case 'c':
          setFocusedField(EmailFieldTypes.CC);
          setShowCc(true);
          break;
        case 'b':
          setFocusedField(EmailFieldTypes.BCC);
          setShowBcc(true);
          break;
        case 'f':
          setFocusedField(EmailFieldTypes.FROM);
          break;
        case 's':
          setFocusedField(EmailFieldTypes.SUBJECT);
          break;
        case 'm':
          setFocusedField(EmailFieldTypes.BODY);
          break;
      }
    },
    [setFocusedField, setShowBcc, setShowCc]
  );

  const attachHandler = useCallback(() => {
    openAttachmentSelect();
  }, [openAttachmentSelect]);

  const discardDraftHandler = useCallback(() => {
    void discardDraft();
  }, [discardDraft]);

  const moveCcContactsToBccHandler = useCallback(() => {
    setBccAddresses([...bccAddresses, ...ccAddresses]);
    setCcAddresses([]);
    setFocusedField(EmailFieldTypes.BCC);
  }, [bccAddresses, ccAddresses, setBccAddresses, setCcAddresses, setFocusedField]);

  const sendMessageHandler = useCallback(() => {
    void handleSendClick();
  }, [handleSendClick]);

  const handlerWrapper = (handler: (e: KeyboardEvent | undefined) => void) => (e: KeyboardEvent | undefined) => {
    e?.preventDefault();
    ((e as unknown as BaseSyntheticEvent)?.nativeEvent as KeyboardEvent)?.stopImmediatePropagation();
    handler(e);
  };

  const singleCombinationHandlers: HotKeyHandlers<typeof singleCombinationKeyMap> = {
    [ComposeKeyActions.FOCUS_SHORTCUTS]: handlerWrapper(focusHandler),
    [ComposeKeyActions.ATTACH]: handlerWrapper(attachHandler),
    [ComposeKeyActions.DISCARD_DRAFT]: handlerWrapper(discardDraftHandler),
    [ComposeKeyActions.MOVE_CC_CONTACTS_TO_BCC]: handlerWrapper(moveCcContactsToBccHandler),
    [ComposeKeyActions.SEND]: handlerWrapper(sendMessageHandler)
  };

  return (
    <HotKeys
      allowChanges
      handlers={singleCombinationHandlers}
      keyMap={singleCombinationKeyMap}
      style={{ outline: 'none', height: '100%' }}
    >
      {children}
    </HotKeys>
  );
};

export default ComposeHotKeys;
