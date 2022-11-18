import { BaseSyntheticEvent, Dispatch, FC, RefObject, SetStateAction } from 'react';
import { HotKeys } from 'react-hotkeys';
import { AddressObject } from 'skiff-graphql';

import { ComposeKeyActions, composeKeyMap, HotKeyHandlers } from '../shared/hotKeys/hotKeys';

import { EmailFieldTypes } from './Compose.constants';

export interface ComposeHotKeysProps {
  setFocusedField: Dispatch<SetStateAction<EmailFieldTypes | null>>;
  setShowCc: Dispatch<SetStateAction<boolean>>;
  setShowBcc: Dispatch<SetStateAction<boolean>>;
  subjectFieldRef: RefObject<HTMLDivElement>;
  openAttachmentSelect: () => void;
  discardDraft: () => Promise<void>;
  handleSendClick: () => Promise<void>;
  setBccAddresses: Dispatch<SetStateAction<AddressObject[]>>;
  setCcAddresses: Dispatch<SetStateAction<AddressObject[]>>;
  bccAddresses: AddressObject[];
  ccAddresses: AddressObject[];
}

const ComposeHotKeys: FC<ComposeHotKeysProps> = ({
  setFocusedField,
  setShowCc,
  setShowBcc,
  subjectFieldRef,
  openAttachmentSelect,
  discardDraft,
  handleSendClick,
  setBccAddresses,
  setCcAddresses,
  bccAddresses,
  ccAddresses,
  children
}) => {
  const handlerWrapper = (action: ComposeKeyActions) => (e: KeyboardEvent | undefined) => {
    e?.preventDefault();
    ((e as unknown as BaseSyntheticEvent)?.nativeEvent as KeyboardEvent)?.stopImmediatePropagation();

    switch (action) {
      case ComposeKeyActions.TO:
        setFocusedField(EmailFieldTypes.TO);
        break;
      case ComposeKeyActions.CC:
        setShowCc(true);
        setFocusedField(EmailFieldTypes.CC);
        break;
      case ComposeKeyActions.BCC:
        setShowBcc(true);
        setFocusedField(EmailFieldTypes.BCC);
        break;
      case ComposeKeyActions.FROM:
        setFocusedField(EmailFieldTypes.FROM);
        break;
      case ComposeKeyActions.EDIT_SUBJECT:
        setFocusedField(EmailFieldTypes.SUBJECT);
        subjectFieldRef.current?.focus();
        break;
      case ComposeKeyActions.EDIT_MESSAGE:
        setFocusedField(EmailFieldTypes.BODY);
        break;
      case ComposeKeyActions.ATTACH:
        openAttachmentSelect();
        break;
      case ComposeKeyActions.DISCARD_DRAFT:
        void discardDraft();
        break;
      case ComposeKeyActions.MOVE_CONTACT_TO_BCC:
        setBccAddresses([...bccAddresses, ...ccAddresses]);
        setCcAddresses([]);
        setShowBcc(true);
        setFocusedField(EmailFieldTypes.BCC);
        break;
      case ComposeKeyActions.SEND:
        void handleSendClick();
        break;
    }
  };

  const handlers: HotKeyHandlers<typeof composeKeyMap> = {
    [ComposeKeyActions.TO]: handlerWrapper(ComposeKeyActions.TO),
    [ComposeKeyActions.CC]: handlerWrapper(ComposeKeyActions.CC),
    [ComposeKeyActions.BCC]: handlerWrapper(ComposeKeyActions.BCC),
    [ComposeKeyActions.FROM]: handlerWrapper(ComposeKeyActions.FROM),
    [ComposeKeyActions.EDIT_SUBJECT]: handlerWrapper(ComposeKeyActions.EDIT_SUBJECT),
    [ComposeKeyActions.EDIT_MESSAGE]: handlerWrapper(ComposeKeyActions.EDIT_MESSAGE),
    [ComposeKeyActions.ATTACH]: handlerWrapper(ComposeKeyActions.ATTACH),
    [ComposeKeyActions.DISCARD_DRAFT]: handlerWrapper(ComposeKeyActions.DISCARD_DRAFT),
    [ComposeKeyActions.MOVE_CONTACT_TO_BCC]: handlerWrapper(ComposeKeyActions.MOVE_CONTACT_TO_BCC),
    [ComposeKeyActions.SEND]: handlerWrapper(ComposeKeyActions.SEND)
  };

  return (
    <HotKeys allowChanges handlers={handlers} keyMap={composeKeyMap} style={{ outline: 'none' }}>
      {children}
    </HotKeys>
  );
};

export default ComposeHotKeys;
