import { ApolloError } from '@apollo/client';
import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { Editor } from '@tiptap/react';
import dayjs from 'dayjs';
import { Icon, IconText, Size, Typography } from 'nightwatch-ui';
import { Node } from 'prosemirror-model';
import {
  ChangeEvent,
  Dispatch,
  default as React,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { isAndroid, isMobile } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import {
  AttachmentPair,
  EmailFragment,
  EmailFragmentDoc,
  encryptMessage,
  ThreadFragment,
  useAliasDisplayInfoQuery,
  useDecryptionServicePublicKeyQuery,
  useGetOrganizationQuery,
  useGetPgpInfoQuery,
  useGetQuickAliasRootDomainsForUserQuery,
  useGetThreadFromIdLazyQuery,
  useSendMessageMutation,
  useSendReplyMessageMutation,
  useSubscriptionPlan,
  useUnsendMessageMutation
} from 'skiff-front-graphql';
import {
  contactToAddressObject,
  contentAsDataUrl,
  convertFileListToArray,
  Drawer,
  FileTypes,
  HIGHEST_TIER,
  isMobileApp,
  isPaidUpExclusiveEmailAddress,
  isQuickAlias,
  MIMETypes,
  useCurrentUserEmailAliases,
  useDefaultEmailAlias,
  useGetAllContactsWithOrgMembers,
  useGetFF,
  useIosBackdropEffect,
  useRequiredCurrentUserData,
  useTheme,
  useToast,
  useUserPreference,
  useWarnBeforeUnloading
} from 'skiff-front-utils';
import {
  AddressObject,
  getPaywallErrorCode,
  getTierNameFromSubscriptionPlan,
  PermissionLevel,
  PgpInfo,
  PgpKeyStatus,
  SendEmailRequest,
  SystemLabels
} from 'skiff-graphql';
import { getMaxUsersPerWorkspace, getSendFromQuickAliasEnabled, PgpFlag, StorageTypes } from 'skiff-utils';
import styled from 'styled-components';
import { v4 } from 'uuid';

import client from '../../apollo/client';
import { MOBILE_MAIL_BODY_ID } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { MailDraftAttributes, useDrafts } from '../../hooks/useDrafts';
import { usePaywall } from '../../hooks/usePaywall';
import { usePlanDelinquency } from '../../hooks/usePlanDelinquency';
import { useThreadActions } from '../../hooks/useThreadActions';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo, ThreadViewEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
import { skemailDraftsReducer } from '../../redux/reducers/draftsReducer';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { ComposeExpandTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { AppDispatch, RootState } from '../../redux/store/reduxStore';
import {
  getMailFooter,
  preprocessAddressesForEncryption,
  removeEmailFromOptimisticUpdate
} from '../../utils/composeUtils';
import { getThreadSenders } from '../../utils/mailboxUtils';
import { resolveAndSetENSDisplayName } from '../../utils/userUtils';
import {
  allAttachmentsHaveContent,
  Attachments,
  AttachmentStates,
  ClientAttachment,
  createAttachmentHeaders,
  isClientLocalAttachment,
  prepareInlineAttachments,
  uploadFilesArrayAsInlineAttachments,
  uploadFilesAsInlineAttachments,
  useAttachments,
  usePopulateEditorImages
} from '../Attachments';
import { MailEditor } from '../MailEditor';
import { EditorExtensionsOptions } from '../MailEditor/Extensions';
import { Image } from '../MailEditor/Image';
import { createImagesFromFiles } from '../MailEditor/Image/utils';
import { convertHtmlToTextContent, fromEditorToHtml, setEditor, toggleLink } from '../MailEditor/mailEditorUtils';
import { Placeholder } from '../MailEditor/Placeholder';
import { MESSAGE_MAX_SIZE_IN_BYTES } from '../MailEditor/Plugins/MessageSizePlugin';
import { QuickAliasPaywallModal } from '../Settings/QuickAlias/QuickAliasPaywallModal/QuickAliasPaywallModal';

import { createPgpMIME } from '../../utils/exportEml';
import FromAddressField from './AddressAndSubjectFields/FromAddressField';
import RecipientField from './AddressAndSubjectFields/RecipientField';
import SubjectField from './AddressAndSubjectFields/SubjectField';
import { EmailFieldTypes, SENDER_PUBLIC_KEY_FILENAME } from './Compose.constants';
import { addSenderPublicKey, encryptPgpEmail, getRecipientPgpInfo } from './Compose.utils';
import ComposeHeader from './ComposeHeader';
import ComposeHotKeys from './HotKeys/ComposeHotKeys';
import MobileAttachments from './MobileAttachments';
import MobileButtonBar from './MobileButtonBar';
import useComposeActions from './useComposeActions';

const ComposeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: ${isMobile ? '100%' : 'calc(100% - 50px)'};
  color: var(--text-primary);
`;

const BottomBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-top: 1px solid var(--border-tertiary);
  box-sizing: border-box;
  grid-row: 1;
`;

const MOBILE_COMPOSE_PAPER_ID = 'mobileComposePaperId';
const MobileComposeContentContainer = styled(
  ({ isOpen, children, className }: { isOpen: boolean; children: React.ReactNode; className?: string }) => {
    useIosBackdropEffect(isOpen, MOBILE_MAIL_BODY_ID, MOBILE_COMPOSE_PAPER_ID);
    return <div className={className}>{children}</div>;
  }
)`
  height: calc(85vh - ${isMobileApp() && isAndroid ? window.statusBarHeight ?? 0 : 0}px);
  width: 100%;
  box-sizing: border-box;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 16px;
  gap: 8px;
`;

const PopOutContainer = styled.div`
  margin-right: -6px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FieldButton = styled.div`
  flex-shrink: 0;
  &:hover * {
    color: var(--text-primary) !important;
  }
`;

const ComposeAttachmentContainer = styled.div`
  height: 100%;
`;

const VERSION_PGP_FILENAME = 'version.asc';
const ENCRYPTED_PGP_FILENAME = 'encrypted.asc';

const PGP_FILENAMES = [VERSION_PGP_FILENAME, ENCRYPTED_PGP_FILENAME];

export const ComposeDataTest = {
  toField: 'to-field',
  ccField: 'cc-field',
  bccField: 'bcc-field',
  subjectField: 'subject-field',
  recipientField: 'recipient-field',
  showCcButton: 'show-cc-button',
  showBccButton: 'show-bcc-button',
  attachmentsInput: 'attachments-input',
  insertImage: 'insert-image',
  sendButton: 'send-button'
};

const Compose: React.FC = () => {
  const [fetchThreadFromID] = useGetThreadFromIdLazyQuery();
  const user = useRequiredCurrentUserData();
  const { enqueueToast, closeToast } = useToast();
  const [autoAttachPgp] = useUserPreference(StorageTypes.AUTO_ATTACH_PGP_PUBLIC_KEY);

  const { emailAliases, quickAliases, loading: aliasesLoading } = useCurrentUserEmailAliases();
  const { data } = useGetQuickAliasRootDomainsForUserQuery();
  const quickAliasRootDomains = data?.getQuickAliasRootDomainsForUser || [];

  const allUserAliases = useMemo(() => [...emailAliases, ...quickAliases], [emailAliases, quickAliases]);
  const hasPgpFlag = useGetFF<PgpFlag>('pgp');

  const {
    loading: activeSubscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const { data: activeOrg } = useGetOrganizationQuery({
    variables: { id: user.rootOrgID }
  });
  const [openQuickAliasPaywallModal, setOpenQuickAliasPaywallModal] = useState(false);

  const isCurrentUserOrgAdmin =
    activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;

  const contentRef = useRef<HTMLDivElement>(null);
  if (contentRef.current) contentRef.current.focus();

  const [defaultEmailAlias] = useDefaultEmailAlias(user.userID, (newValue: string) => {
    void resolveAndSetENSDisplayName(newValue, user);
  });
  const { activeAliasInbox, label } = useCurrentLabel();

  const isDraftsMailbox = label === SystemLabels.Drafts;

  const { composeNewDraft, saveComposeDraft, flushSaveComposeDraft } = useDrafts();

  const { isUserPaidUp, downgradeProgress, openPlanDelinquencyModal } = usePlanDelinquency();

  const mailFormDirty = useRef<boolean>(false);
  const { currentDraftID, currentDraftIDToDelete } = useAppSelector((state) => state.draft);

  const { trashThreads, activeThreadID } = useThreadActions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mailEditorRef = useRef<Editor>(null);
  const editor: Editor | null = mailEditorRef.current;

  const userSignature = useUserSignature();
  const dispatch = useDispatch<AppDispatch>();
  const mailDraftDataRef = useRef<MailDraftAttributes | null>(null);
  const openPaywallModal = usePaywall();

  const setShowMoreOptions = (showMoreOptions: boolean) => {
    dispatch(skemailMobileDrawerReducer.actions.setShowComposeMoreOptionsDrawer(showMoreOptions));
  };

  // redux selectors
  const {
    composeOpen: isOpen,
    composeCollapseState,
    populateComposeContent
  } = useSelector((state: RootState) => state.modal);

  // currentDraftID can be undefined on mobile since this component is not rendered within ComposePanel
  // and therefore can be rendered before the Compose button is clicked
  // Only open a new draft if the compose panel is open and
  // there isn't already a draft open or we aren't in the middle of deleting a draft
  if (!currentDraftID && isOpen && !currentDraftIDToDelete) {
    composeNewDraft();
  }

  const {
    subject: populatedSubject,
    toAddresses: populatedToAddresses,
    ccAddresses: populatedCCAddresses,
    bccAddresses: populatedBCCAddresses,
    fromAddress: populatedFromAddress,
    messageBody: populatedMessage,
    attachmentMetadata: populatedAttachmentMetadata,
    replyEmailID: populatedReplyEmailID,
    replyThread
  } = populateComposeContent;

  const populatedExistingThread = replyThread ? (replyThread as ThreadFragment) : undefined;

  const [fromEmail, setFromEmail] = useState(populatedFromAddress || activeAliasInbox || defaultEmailAlias);
  const [customDomainAlias, setCustomDomainAlias] = useState('');
  const { data: curEmailAliasDisplayInfo } = useAliasDisplayInfoQuery({
    variables: { emailAlias: fromEmail },
    fetchPolicy: 'network-only'
  });
  const isFromAddressQuickAlias = isQuickAlias(quickAliasRootDomains, fromEmail);
  // start with current alias display name, then if quick alias, use '' or undefined to default to account info
  const overrideDisplayName =
    curEmailAliasDisplayInfo?.aliasDisplayInfo?.displayName ?? (isFromAddressQuickAlias ? '' : undefined);

  const { data: pgpKeyData } = useGetPgpInfoQuery({
    variables: { emailAlias: fromEmail, allKeys: true }
  });
  const pgpKeys = pgpKeyData?.pgpInfo;
  const activeKey: PgpInfo | undefined | null = pgpKeys?.find((key) => key?.status === PgpKeyStatus.Enabled);

  // update the from email to be the default email alias
  // if there is not already a preset populated `from` address
  // or if the current `from` address is no longer valid
  useEffect(() => {
    if (!fromEmail || (!aliasesLoading && allUserAliases.indexOf(fromEmail) === -1)) {
      setFromEmail(activeAliasInbox || customDomainAlias || defaultEmailAlias);
    }
  }, [customDomainAlias, allUserAliases, fromEmail, activeAliasInbox, defaultEmailAlias, aliasesLoading]);

  const { contactsWithOrgMembers, refetch: refetchContacts } = useGetAllContactsWithOrgMembers({
    fetchPolicy: 'cache-first'
  });

  const contactList =
    contactsWithOrgMembers.filter(({ emailAddress }) => !!emailAddress).map(contactToAddressObject) ?? [];

  const [securedBySkiffSigDisabled] = useUserPreference(StorageTypes.SECURED_BY_SKIFF_SIG_DISABLED);
  const initialHtmlContent = useMemo(
    () => populatedMessage || getMailFooter(isFromAddressQuickAlias, userSignature, !!securedBySkiffSigDisabled),
    [populatedMessage, userSignature, securedBySkiffSigDisabled, isFromAddressQuickAlias]
  );

  // In the future, we likely want to move filtering logic into replyAllCompose in modalReducer.ts
  // Limitation with this is that the users email will get filtered out of CC/BCC in a draft, but this is
  // an rare use case
  const [toAddresses, setToAddresses] = useState<AddressObject[]>(populatedToAddresses);
  const [ccAddresses, setCcAddresses] = useState<AddressObject[]>(populatedCCAddresses);
  const [bccAddresses, setBccAddresses] = useState<AddressObject[]>(populatedBCCAddresses);

  const [subject, setSubject] = useState<string>(populatedSubject);

  const [existingThread, setExistingThread] = useState<ThreadFragment | undefined>(populatedExistingThread);
  const [replyEmailID, setReplyEmailID] = useState<string | undefined>(populatedReplyEmailID);

  const allRecipientsHavePgp = [...toAddresses, ...ccAddresses, ...bccAddresses].every(
    (address) => address.address.endsWith('proton.me') // TODO: actually check contact for pgp
  );

  const isComposeDirtyCheck =
    <T,>(setter: Dispatch<React.SetStateAction<T>>) =>
    (arg: T) => {
      mailFormDirty.current = true;
      return setter(arg);
    };

  const [sendMessage] = useSendMessageMutation();
  const [sendReply] = useSendReplyMessageMutation();
  const [unsendMessage] = useUnsendMessageMutation();

  const reopenEditCompose = (draft: MailboxEmailInfo, existingReplyThread?: ThreadDetailInfo) =>
    dispatch(skemailModalReducer.actions.editDraftCompose({ draftEmail: draft, replyThread: existingReplyThread }));

  const popOutReplyCompose = (draftText: string) => {
    dispatch(skemailModalReducer.actions.popOutReplyCompose({ threadID: activeThreadID, draftEmailText: draftText }));
  };

  // Whether a message is currently being sent
  const isSending = useAppSelector((state) => state.modal.isSending);
  const setIsSending = (updatedVal: boolean) => dispatch(skemailModalReducer.actions.setIsSending(updatedVal));

  const closeCompose = useCallback(() => {
    dispatch(skemailDraftsReducer.actions.clearCurrentDraftID());
    dispatch(skemailModalReducer.actions.closeCompose());
  }, [dispatch]);

  const [showCc, setShowCc] = useState<boolean>(!!populatedCCAddresses.length);
  const [showBcc, setShowBcc] = useState<boolean>(!!populatedBCCAddresses.length);

  const getInitialFocusedField = (): EmailFieldTypes => {
    if (!populatedToAddresses.length) return EmailFieldTypes.TO;
    if (!populatedSubject) return EmailFieldTypes.SUBJECT;
    return EmailFieldTypes.BODY;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialFocus = useMemo(() => getInitialFocusedField(), [populatedToAddresses, populatedSubject]);
  const [focusedField, setFocusedField] = useState<EmailFieldTypes | null>(initialFocus);

  const [isEditorDirty, setIsEditorDirty] = useState<boolean>(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    // Because we always render compose and just show it base on isOpen
    // Every time we reopen compose we want to reset compose dirty to false
    setIsEditorDirty(false);
    mailFormDirty.current = false;
  }, [isOpen]);

  const { attachmentsSize, attachments, removeAttachment, removeAllAttachments, uploadAttachments } = useAttachments(
    { metadata: populatedAttachmentMetadata },
    true
  );

  const attachmentsRef = useRef<ClientAttachment[]>(attachments);

  // Update the ref whenever attachments state changes
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const uploadAttachmentsAsync = (files: File[], inline?: boolean): void => {
    void uploadAttachments(files, inline || false);
  };

  const uploadAttachmentsAwait = async (files: File[], inline?: boolean, encoding?: BufferEncoding): Promise<void> => {
    await uploadAttachments(files, inline || false, encoding);
  };

  const { theme } = useTheme();

  usePopulateEditorImages(attachments, editor);
  // If the user tries to close the window while the email is sending, warn the user
  useWarnBeforeUnloading(isSending);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const editorContentSize: number = editor?.storage.messageSizeExtension.messageSize || 0;
  const messageSizeExceeded = editorContentSize + attachmentsSize > MESSAGE_MAX_SIZE_IN_BYTES;

  const composeIsDirty = isEditorDirty || mailFormDirty.current;

  // Reset data when new populated content is passed in
  useEffect(() => {
    setSubject(populatedSubject);
    setToAddresses(populatedToAddresses);
    setCcAddresses(populatedCCAddresses);
    setBccAddresses(populatedBCCAddresses);
    setExistingThread(populatedExistingThread);
    setReplyEmailID(populatedReplyEmailID);

    mailDraftDataRef.current = {
      composeIsDirty: false, // compose never starts dirty
      subject: populatedSubject,
      toAddresses: populatedToAddresses,
      bccAddresses: populatedBCCAddresses,
      ccAddresses: populatedCCAddresses,
      text: initialHtmlContent,
      fromAddress: populatedFromAddress ?? ''
    };
  }, [
    populatedBCCAddresses,
    populatedCCAddresses,
    initialHtmlContent,
    populatedToAddresses,
    populatedSubject,
    populatedExistingThread,
    populatedReplyEmailID,
    isOpen,
    populatedFromAddress
  ]);

  // When the initial content change, set editor - helps when there is a minimize mail while clicking reply on any thread mail
  useEffect(() => {
    if (mailEditorRef.current && isEditorReady) {
      // On expand or open compose, load the current draft, or the initial html content as a fallback.
      const editorContent = mailDraftDataRef.current?.text ?? initialHtmlContent;
      setEditor(mailEditorRef.current, editorContent, true);
    }
  }, [initialHtmlContent, isEditorReady]);

  // Using memo for readability - create on mount once
  const mailEditorExtensionsOptions: EditorExtensionsOptions = useMemo(
    () => ({
      disableBlockquoteToggle: false,
      isMobileApp: isMobile,
      threadSenders: replyThread ? getThreadSenders(replyThread) : [],
      theme,
      pasteHandlers: [
        function handleImagePaste(view, event) {
          const files = event.clipboardData?.files;
          if (files?.length) {
            uploadFilesAsInlineAttachments(files, view, uploadAttachmentsAsync);
            return true;
          }
          return false;
        }
      ],
      clickOnHandlers: [
        function handleImageClicked(_view, _pos, node: Node) {
          const imageNode = node;
          if (imageNode?.type.name !== Image.name) return false;
          dispatch(
            skemailModalReducer.actions.setOpenModal({
              type: ModalType.AttachmentPreview,
              attachments: [
                {
                  state: AttachmentStates.Local,
                  id: v4(),
                  contentType: (imageNode.attrs.contentType as string) || 'image/jpeg',
                  name: imageNode.attrs.title as string,
                  size: imageNode.attrs.size as number,
                  inline: true,
                  content: imageNode.attrs.src as string
                }
              ]
            })
          );

          return true;
        }
      ]
    }),
    []
  );

  const mailEditorOnCreate = useCallback(
    (createdEditor: Editor) => {
      if (!currentDraftID) return;
      // Flush on create so all content immediately gets saved and we don't run into race conditions
      void flushSaveComposeDraft({
        draftID: currentDraftID,
        subject,
        text: fromEditorToHtml(createdEditor),
        toAddresses,
        ccAddresses,
        bccAddresses,
        fromAddress: fromEmail,
        existingThread
      });
      // Focus into editor / body on mount if there are addresses in the To header
      if (!createdEditor.isFocused && initialFocus === EmailFieldTypes.BODY) {
        setTimeout(() => {
          // Timeout is important for iOS, otherwise the keyboard open before compose completely showed and it case issue with app header
          createdEditor.commands.focus();
        }, 100);
        setFocusedField(initialFocus);
      }
    },
    [initialFocus, currentDraftID]
  );

  useEffect(() => {
    if (composeIsDirty && mailDraftDataRef.current) {
      mailDraftDataRef.current = {
        ...mailDraftDataRef.current,
        bccAddresses,
        ccAddresses,
        subject,
        toAddresses,
        composeIsDirty,
        fromAddress: fromEmail
      };

      const { text } = mailDraftDataRef.current;
      if (!currentDraftID) return;
      void saveComposeDraft({
        draftID: currentDraftID,
        subject,
        text,
        toAddresses,
        ccAddresses,
        bccAddresses,
        fromAddress: fromEmail,
        existingThread
      });
    }
  }, [
    bccAddresses,
    editor,
    ccAddresses,
    composeIsDirty,
    subject,
    toAddresses,
    saveComposeDraft,
    existingThread,
    currentDraftID,
    fromEmail
  ]);

  const closeComposeWithDraftSnack = () => {
    closeCompose();
    if (composeIsDirty) {
      enqueueToast({ title: 'Draft saved', body: `Message ${isDraftsMailbox ? 'saved' : 'moved'} to drafts.` });
    }
  };
  const { replyComposeOpen } = useAppSelector((state) => state.modal);

  // Clear draft ID and reset redux on clean up
  useEffect(
    () => () => {
      if (replyComposeOpen.open && replyComposeOpen.popOut) {
        closeCompose();
      }
    },
    [closeCompose]
  );

  // Get the public key for the decryption service, which is used when sending emails to external users.
  const decryptionServicePublicKey = useDecryptionServicePublicKeyQuery();

  const getAddressSetterForFieldType = {
    [EmailFieldTypes.TO]: setToAddresses,
    [EmailFieldTypes.CC]: setCcAddresses,
    [EmailFieldTypes.BCC]: setBccAddresses
  };

  const moveAddressChip = (
    draggedAddressChip: AddressObject,
    fromFieldType: EmailFieldTypes,
    toFieldType: EmailFieldTypes
  ) => {
    if (!draggedAddressChip || toFieldType === fromFieldType) return;

    const addressToSetter = getAddressSetterForFieldType[toFieldType] as Dispatch<SetStateAction<AddressObject[]>>;
    const addressFromSetter = getAddressSetterForFieldType[fromFieldType] as Dispatch<SetStateAction<AddressObject[]>>;

    addressToSetter((prevAddr: AddressObject[]) => {
      if (!prevAddr.some((addr) => addr.address === draggedAddressChip.address))
        return [...prevAddr, draggedAddressChip];
      else return [...prevAddr];
    });

    addressFromSetter((prevAddr: AddressObject[]) => prevAddr.filter((addr) => addr !== draggedAddressChip));
  };

  // Discard the current draft when we send or trash the email
  // Hide the toast if the draft is discarded after an email is sent, so we don't show both
  // the 'Email Sent' and 'Draft Deleted' toasts
  const discardDraft = async (hideToast = false) => {
    if (currentDraftID) {
      await trashThreads([currentDraftID], true, hideToast);
    } else {
      console.error('No draft to discard, no draft is selected');
    }
    setShowMoreOptions(false);
    closeCompose();
  };

  const undoOptimisticReply = (emailIDOfReply: string) => {
    if (activeThreadID) {
      dispatch(
        skemailMailboxReducer.actions.removeFromPendingReplies({
          emailIDs: [emailIDOfReply]
        })
      );
      removeEmailFromOptimisticUpdate(activeThreadID, emailIDOfReply);
    }
  };

  const addPgpAttachments = async () => {
    if (!activeKey || !editor) return;
    const { messageWithInlineAttachments, inlineAttachments } = await prepareInlineAttachments(editor);

    const allAttachments = [...attachmentsRef.current, ...inlineAttachments];
    const localAttachments = allAttachments.filter(isClientLocalAttachment);

    const mimeMessage = await createPgpMIME(messageWithInlineAttachments, localAttachments);
    const versionText = 'Version: 1';

    // Creating the first file with MIME type application/pgp-encrypted
    const versionBlob = new Blob([versionText], { type: 'application/pgp-encrypted; charset=utf-8' });
    const versionFile = new File([versionBlob], VERSION_PGP_FILENAME, { type: 'application/pgp-encrypted' });
    await uploadAttachmentsAwait([versionFile]);

    const recipientPublicKeys = await getRecipientPgpInfo([...toAddresses, ...ccAddresses, ...bccAddresses]);
    const pgpEncryptedText = await encryptPgpEmail(
      activeKey,
      mimeMessage,
      recipientPublicKeys, // TODO: need PGPInfo type from contacts
      user.privateUserData.privateKey
    );

    const base64EncodedText = btoa(pgpEncryptedText);
    const dataUrl = contentAsDataUrl(base64EncodedText, 'application/octet-stream');

    // Creating the file using the data URL
    const textBlob = new Blob([dataUrl], { type: 'application/octet-stream; charset=utf-8' });
    const textFile = new File([textBlob], ENCRYPTED_PGP_FILENAME, { type: 'application/octet-stream' });

    await uploadFilesArrayAsInlineAttachments([textFile], uploadAttachmentsAwait);
  };

  const send = async (scheduleSendAt?: Date) => {
    // fallback to highest tier if active subscription hasn't loaded to prevent unmerited disruption
    const effectiveSubPlan = activeSubscriptionLoading ? HIGHEST_TIER : activeSubscription;
    const tierName = getTierNameFromSubscriptionPlan(effectiveSubPlan);
    const isSendFromQuickAliasEnabled = getSendFromQuickAliasEnabled(tierName);
    // the tier limit gates send but not reply for Quick Aliases
    const shouldPaywallQuickAliasSend = !replyEmailID && !isSendFromQuickAliasEnabled && isFromAddressQuickAlias;
    if (shouldPaywallQuickAliasSend) {
      return setOpenQuickAliasPaywallModal(true);
    }

    // block sending if user is using a paid-tier-associated address (e.g. custom domain or short alias)
    // for which they're no longer in good standing, or if they are a non-admin member of a workspace with too many members
    const isFromAddressPaidUpExclusive =
      !!downgradeProgress &&
      isPaidUpExclusiveEmailAddress(fromEmail, allUserAliases, tierName, downgradeProgress, quickAliasRootDomains);
    const isNonAdminExcessUser =
      !isCurrentUserOrgAdmin &&
      downgradeProgress?.workspaceUsers &&
      downgradeProgress.workspaceUsers > getMaxUsersPerWorkspace(tierName);
    const shouldBlockSend = !isUserPaidUp && (isFromAddressPaidUpExclusive || isNonAdminExcessUser);
    if (shouldBlockSend) {
      return openPlanDelinquencyModal(isFromAddressPaidUpExclusive ? fromEmail : undefined);
    }

    if (!editor) {
      console.error('No editor instance');
      enqueueToast({
        title: 'Failed to send message',
        body: 'The editor instance is missing.'
      });
      return;
    }

    if (toAddresses.length === 0 && ccAddresses.length === 0 && bccAddresses.length === 0) {
      enqueueToast({
        title: 'Failed to send message',
        body: 'Missing recipient address.'
      });
      return;
    }

    if (!decryptionServicePublicKey.data?.decryptionServicePublicKey) {
      console.error('Could not get external service public key.');
      enqueueToast({
        title: 'Failed to send message',
        body: 'External service public key error.'
      });
      return;
    }

    const handleViaPgp = allRecipientsHavePgp && !!activeKey && hasPgpFlag;
    if (handleViaPgp) {
      await addPgpAttachments();
    }
    const latestAttachments = attachmentsRef.current;
    const { inlineAttachments, messageWithInlineAttachments } = await prepareInlineAttachments(editor);
    const allAttachments = [
      ...inlineAttachments,
      ...latestAttachments.filter((attach) => !attach.inline || handleViaPgp)
    ];

    /**
     * Its important to set isSending after we serialize the doc
     * because its causing the editor dom to unmount and we cant get the computed style from the elements
     */
    setIsSending(true);

    if (isMobile) {
      // Close compose drawer after prepareInlineAttachments
      closeCompose();
    }

    if (!allAttachmentsHaveContent(allAttachments)) {
      enqueueToast({
        title: 'Attached files not uploaded',
        body: 'Some of the attached files were not sucessfully uploaded.'
      });
      return;
    }

    const convertedAttachments = await Promise.all(
      allAttachments.map(async ({ contentType, name, size, content, inline, id }): Promise<AttachmentPair> => {
        const { contentDisposition, checksum, contentID } = await createAttachmentHeaders({
          fileName: name,
          content,
          attachmentType: inline ? 'inline' : 'attachment',
          contentID: id ? `<${id}@skiff.town>` : undefined
        });

        return {
          content,
          metadata: {
            checksum,
            contentDisposition,
            contentId: contentID,
            contentType,
            filename: name,
            size
          }
        };
      })
    );

    // TODO - temporarily disabled
    const captchaToken = '';

    // TODO: If PGP run inside encryptMessage, to avoid fake attachments
    const pgpAttachments = convertedAttachments.filter((attach) => PGP_FILENAMES.includes(attach.metadata.filename));

    // entrypoint to encrypt
    const {
      encryptedSubject,
      encryptedText,
      encryptedHtml,
      encryptedTextAsHtml,
      encryptedTextSnippet,
      encryptedAttachments,
      toAddressesWithEncryptedKeys,
      ccAddressesWithEncryptedKeys,
      bccAddressesWithEncryptedKeys,
      externalEncryptedSessionKey,
      fromAddressWithEncryptedKey
    } = await encryptMessage(
      {
        messageSubject: subject,
        messageTextBody: convertHtmlToTextContent(handleViaPgp ? '' : messageWithInlineAttachments), // scrub content if using PGP
        messageHtmlBody: handleViaPgp ? '' : messageWithInlineAttachments, // scrub content if using PGP
        attachments: handleViaPgp ? pgpAttachments : convertedAttachments,
        // Uniq addresses before sending and remove the __typename field
        toAddresses: preprocessAddressesForEncryption(toAddresses),
        ccAddresses: preprocessAddressesForEncryption(ccAddresses),
        bccAddresses: preprocessAddressesForEncryption(bccAddresses),
        fromAddress: {
          name: overrideDisplayName ?? user.publicData?.displayName,
          address: fromEmail
        },
        privateKey: user.privateUserData.privateKey,
        publicKey: user.publicKey,
        externalPublicKey: decryptionServicePublicKey.data?.decryptionServicePublicKey
      },
      client
    );
    const request: SendEmailRequest = {
      from: fromAddressWithEncryptedKey,
      to: toAddressesWithEncryptedKeys,
      cc: ccAddressesWithEncryptedKeys,
      bcc: bccAddressesWithEncryptedKeys,
      attachments: encryptedAttachments,
      encryptedSubject,
      encryptedText,
      encryptedHtml,
      encryptedTextAsHtml,
      externalEncryptedSessionKey,
      encryptedTextSnippet,
      rawSubject: subject,
      scheduleSendAt,
      captchaToken
    };

    const newReplyEmailID = v4();
    if (activeThreadID && replyEmailID) {
      // For replies, optimistically store the new reply in redux
      // so that when we render the thread, the email renders immediately
      if (fromAddressWithEncryptedKey.encryptedSessionKey) {
        const decryptedText = convertHtmlToTextContent(messageWithInlineAttachments);
        const newEmail: ThreadViewEmailInfo = {
          createdAt: new Date(),
          id: newReplyEmailID,
          to: toAddresses,
          cc: ccAddresses,
          bcc: bccAddresses,
          from: {
            name: user.publicData?.displayName,
            address: fromEmail
          },
          decryptedText,
          decryptedTextAsHtml: decryptedText,
          decryptedHtml: messageWithInlineAttachments,
          decryptedSubject: subject,
          scheduleSendAt,
          notificationsTurnedOffForSender: false // Defaulting to false, needed as notificationsTurnedOffForSender is a required field
        };
        dispatch(
          skemailMailboxReducer.actions.addToPendingReplies({
            reply: {
              email: newEmail,
              threadID: replyComposeOpen?.threadID || activeThreadID
            }
          })
        );
      }
    }

    let messageAndThreadID: { messageID: string; threadID: string } | undefined | null;

    try {
      // TODO: Add spinner to toast once we have it in nightwatch-ui]
      if (replyEmailID) {
        const { data } = await sendReply({
          variables: {
            request: {
              ...request,
              replyID: replyEmailID,
              customMessageID: newReplyEmailID
            }
          },
          context: {
            headers: {
              'Apollo-Require-Preflight': true // this is required for attachment uploading. Otherwise, router backend will reject request.
            }
          },
          onCompleted: () => {
            // refetch getThreadByID for the active thread
            // the optimistic reply does not include attachments, so this will
            // ensure that what is rendered will match what is on the server + render attachments
            if (activeThreadID) {
              void fetchThreadFromID({ variables: { threadID: activeThreadID } });
            }
          },
          onError: () => {
            // the email did not send, so remove it from the pending replies
            dispatch(
              skemailMailboxReducer.actions.removeFromPendingReplies({
                emailIDs: [newReplyEmailID]
              })
            );
          }
        });
        messageAndThreadID = data?.replyToMessage;
      } else {
        const { data } = await sendMessage({
          variables: {
            request
          },
          context: {
            headers: {
              'Apollo-Require-Preflight': true // this is required for attachment uploading. Otherwise, router backend will reject request.
            }
          }
        });
        messageAndThreadID = data?.sendMessage;
      }

      enqueueToast({
        title: scheduleSendAt
          ? `Scheduled for ${dayjs(scheduleSendAt).format('ddd MMM D [at] h:mma')}`
          : 'Message sent',
        body: scheduleSendAt ? 'Your message will be sent at the scheduled time.' : 'Your message is on its way.',
        duration: 5000,
        actions: [
          {
            label: 'Undo',
            onClick: async (key) => {
              if (messageAndThreadID) {
                // remove message from send queue and retrieve email data
                const emailData = await unsendMessage({
                  variables: {
                    request: {
                      messageID: messageAndThreadID.messageID,
                      threadID: messageAndThreadID.threadID
                    }
                  }
                });

                // read the result of the mutation from the cache, so that it will go though the typePolicy and decrypt the values
                const emailFromCache = client.cache.readFragment<EmailFragment>({
                  id: client.cache.identify({
                    __typename: 'Email',
                    id: emailData?.data?.unsendMessage?.id
                  }),
                  fragment: EmailFragmentDoc,
                  fragmentName: 'Email'
                });

                if (!emailFromCache) return;

                const mailboxInfo: MailboxEmailInfo = emailFromCache;
                // re-open compose modal for draft
                reopenEditCompose(mailboxInfo);
                // since we are opening a new draft, this means there is no current draft we are deleting
                dispatch(skemailDraftsReducer.actions.clearCurrentDraftIDToDelete());

                if (replyEmailID) {
                  undoOptimisticReply(messageAndThreadID.messageID);
                }
              }
              closeToast(key);
            }
          }
        ]
      });

      removeAllAttachments();
      void discardDraft(true);

      // Refetch contacts
      void refetchContacts();
    } catch (err: any) {
      if (replyEmailID) {
        undoOptimisticReply(newReplyEmailID);
      }
      const paywallErrorCode = getPaywallErrorCode((err as ApolloError).graphQLErrors);
      if (paywallErrorCode) {
        openPaywallModal(paywallErrorCode);
      } else {
        enqueueToast({
          title: 'Failed to send message',
          body: (err as Error).message
        });
      }
    }
  };

  const handleSendClick = async (scheduleSendAt?: Date) => {
    await send(scheduleSendAt);
    setIsSending(false);
  };

  const insertImage = () => imageInputRef.current?.click();

  const wkdFound = false;
  const openAttachmentSelect = () => fileInputRef.current?.click();
  const attachedPgp = attachments.find((attachment) => attachment.name === SENDER_PUBLIC_KEY_FILENAME);
  const isPgpAttached = attachedPgp !== undefined;
  const attachPpgKey =
    !activeKey || autoAttachPgp || wkdFound
      ? undefined
      : () => {
          if (isPgpAttached) {
            // remove key on toggle
            removeAttachment(attachedPgp.id);
            return;
          }
          addSenderPublicKey(uploadAttachmentsAsync, activeKey?.publicKey);
          // TODO: hide button if WKD works (update dynamically)
        };

  /**
   * This auto adds PGP key if setting enabled
   */
  useEffect(() => {
    // TODO: don't add if WKD works
    if (!hasPgpFlag) return;
    if (!autoAttachPgp || !activeKey || wkdFound) {
      if (attachedPgp) removeAttachment(attachedPgp.id); // remove key if already added
      return;
    }
    addSenderPublicKey(uploadAttachmentsAsync, activeKey?.publicKey);
  }, [autoAttachPgp, activeKey, wkdFound, hasPgpFlag]);

  const { desktopBottomBarButtons, mobileActionBarButtons, ScheduleSendDrawer, handleScheduleSendClick } =
    useComposeActions({
      handleSendClick,
      toggleLink: () => {
        if (editor) toggleLink(editor);
      },
      insertImage,
      discardDraft,
      messageSizeExceeded,
      openAttachmentSelect,
      attachPpgKey,
      isPgpAttached,
      editor
    });

  /**
   * This sets the dirty state of the Placeholder extension
   */
  useEffect(() => {
    if (!editor) return;
    if (isEditorDirty) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      editor.extensionStorage[Placeholder.name].changed = true;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      editor.extensionStorage[Placeholder.name].changed = false;
    }
  }, [editor, isEditorDirty]);

  useEffect(() => {
    if ([ComposeExpandTypes.FullExpanded, ComposeExpandTypes.Expanded].includes(composeCollapseState)) {
      setFocusedField(EmailFieldTypes.TO);
    }
  }, [composeCollapseState]);

  const ccAndBccButtons = useMemo(
    () => (
      <>
        {!showCc && (
          <FieldButton>
            <Typography
              color='secondary'
              dataTest={ComposeDataTest.showCcButton}
              onClick={() => {
                setShowCc(true);
                setFocusedField(EmailFieldTypes.CC);
              }}
            >
              CC
            </Typography>
          </FieldButton>
        )}
        {!showBcc && (
          <FieldButton>
            <Typography
              color='secondary'
              dataTest={ComposeDataTest.showBccButton}
              onClick={() => {
                setShowBcc(true);
                setFocusedField(EmailFieldTypes.BCC);
              }}
            >
              BCC
            </Typography>
          </FieldButton>
        )}
      </>
    ),
    [showBcc, showCc]
  );

  const onFieldBlur = useCallback(() => setFocusedField(null), []);

  const onFieldFocus = useCallback((field: EmailFieldTypes) => setFocusedField(field), []);

  const recipientFieldSetAddresses = isComposeDirtyCheck(setToAddresses);

  const onMailEditorChange = (updatedEditor: Editor) => {
    if (!mailDraftDataRef.current || !mailDraftDataRef.current.composeIsDirty) return;

    const text = fromEditorToHtml(updatedEditor);
    mailDraftDataRef.current.text = text;

    const {
      toAddresses: toAddressesRef,
      bccAddresses: bccAddressesRef,
      ccAddresses: ccAddressesRef,
      subject: subjectRef,
      fromAddress: fromAddressRef
    } = mailDraftDataRef.current;
    if (!currentDraftID) return;
    void saveComposeDraft({
      draftID: currentDraftID,
      subject: subjectRef,
      text,
      toAddresses: toAddressesRef,
      ccAddresses: ccAddressesRef,
      bccAddresses: bccAddressesRef,
      fromAddress: fromAddressRef,
      existingThread
    });
  };

  const showPopOutButton = !!replyEmailID && !replyComposeOpen.popOut;

  // Renders To, Cc, Bcc, and From fields
  const renderAddressAndSubjectFields = () => {
    return (
      <>
        {!!allUserAliases.length && (
          <FromAddressField
            emailAliases={allUserAliases}
            endAdornment={
              showPopOutButton ? (
                <PopOutContainer>
                  {showPopOutButton && (
                    <IconText
                      onClick={() => {
                        popOutReplyCompose(mailDraftDataRef.current?.text ?? initialHtmlContent);
                      }}
                      size={Size.LARGE}
                      startIcon={Icon.PopOut}
                      tooltip='Pop out'
                    />
                  )}
                </PopOutContainer>
              ) : undefined
            }
            focusedField={focusedField}
            setCustomDomainAlias={setCustomDomainAlias}
            setFocusedField={setFocusedField}
            setUserEmail={isComposeDirtyCheck(setFromEmail)}
            userEmail={fromEmail ?? ''}
          />
        )}
        <RecipientField
          additionalButtons={(!showCc || !showBcc) && ccAndBccButtons}
          addresses={toAddresses}
          contactList={contactList}
          dataTest={ComposeDataTest.toField}
          field={EmailFieldTypes.TO}
          focusedField={focusedField}
          onDrop={moveAddressChip}
          onFocus={onFieldFocus}
          setAddresses={recipientFieldSetAddresses}
        />
        {showCc && (
          <RecipientField
            addresses={ccAddresses}
            contactList={contactList}
            dataTest={ComposeDataTest.ccField}
            field={EmailFieldTypes.CC}
            focusedField={focusedField}
            onDrop={moveAddressChip}
            onFocus={onFieldFocus}
            setAddresses={isComposeDirtyCheck(setCcAddresses)}
          />
        )}
        {showBcc && (
          <RecipientField
            addresses={bccAddresses}
            contactList={contactList}
            dataTest={ComposeDataTest.bccField}
            field={EmailFieldTypes.BCC}
            focusedField={focusedField}
            onDrop={moveAddressChip}
            onFocus={onFieldFocus}
            setAddresses={isComposeDirtyCheck(setBccAddresses)}
          />
        )}
        <SubjectField
          dataTest={ComposeDataTest.subjectField}
          focusedField={focusedField}
          onBlur={onFieldBlur}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const newSubject = e.target.value;
            isComposeDirtyCheck(setSubject)(newSubject);
          }}
          setFocusedField={setFocusedField}
          subject={subject}
        />
      </>
    );
  };

  const content = (
    <ComposeAttachmentContainer ref={contentRef}>
      {!isSending && (
        <ComposeContainer>
          {renderAddressAndSubjectFields()}
          {
            <MailEditor
              editorRef={mailEditorRef}
              extensionsOptions={mailEditorExtensionsOptions}
              focusedField={focusedField}
              hasAttachments={attachments.length > 0}
              initialHtmlContent={mailDraftDataRef.current?.text ?? initialHtmlContent}
              mobileToolbarButtons={mobileActionBarButtons}
              onBlur={onFieldBlur}
              onChange={onMailEditorChange}
              onCreate={mailEditorOnCreate}
              onDrop={(event) => {
                if (!editor?.view) return;
                uploadFilesAsInlineAttachments(event.dataTransfer.files, editor.view, uploadAttachmentsAsync);
                event.preventDefault();
              }}
              onFocus={() => onFieldFocus(EmailFieldTypes.BODY)}
              setIsEditorDirty={setIsEditorDirty}
              setIsEditorReady={setIsEditorReady}
            />
          }
          {!isMobile && (
            <BottomBar>
              <Attachments
                attachmentSizeExceeded={attachments.length ? attachmentsSize > MESSAGE_MAX_SIZE_IN_BYTES : false}
                attachments={attachments}
                onDelete={(id) => {
                  removeAttachment(id);
                }}
                onDrop={(event) => {
                  const filesArray = convertFileListToArray(event.dataTransfer.files);
                  uploadAttachmentsAsync(filesArray);
                }}
              />
              {ScheduleSendDrawer}
              <ButtonContainer>
                <FloatingDelayGroup delay={{ open: 200, close: 200 }}>{desktopBottomBarButtons}</FloatingDelayGroup>
              </ButtonContainer>
            </BottomBar>
          )}
        </ComposeContainer>
      )}
      <input
        data-test={ComposeDataTest.attachmentsInput}
        multiple
        onChange={() => {
          if (!fileInputRef.current?.files) return;
          uploadAttachmentsAsync(convertFileListToArray(fileInputRef.current.files));
        }}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        value={''}
      />
      <input
        accept={MIMETypes[FileTypes.Image].join(',')}
        multiple
        onChange={() => {
          if (!imageInputRef.current?.files || !editor?.view) return;
          const imagesFiles = convertFileListToArray(imageInputRef.current?.files);
          void (async (): Promise<void> => {
            const results = await createImagesFromFiles(imagesFiles, editor.view);
            const svgFailed = results.find((result) => !result.success && result.errorType == 'SVG');
            if (svgFailed) {
              enqueueToast({
                title: 'Attach SVGs as files',
                body: 'Inline SVG  images are prohibited'
              });
            }
          })();
        }}
        ref={imageInputRef}
        style={{ display: 'none' }}
        type='file'
        value={''}
      />
      {!isSending && (
        <MobileAttachments
          attachments={attachments}
          attachmentsSize={attachmentsSize}
          removeAttachment={removeAttachment}
        />
      )}
      <QuickAliasPaywallModal
        fromAlias={fromEmail}
        open={openQuickAliasPaywallModal}
        setOpen={setOpenQuickAliasPaywallModal}
      />
    </ComposeAttachmentContainer>
  );

  // On mobile display content in drawer
  if (isMobile) {
    return (
      <>
        <Drawer
          extraSpacer={false}
          forceTheme={theme}
          hideDrawer={closeCompose}
          paperId={MOBILE_COMPOSE_PAPER_ID}
          show={isOpen}
          verticalScroll={false}
        >
          <MobileButtonBar
            discardDraft={discardDraft}
            handleSendClick={handleSendClick}
            insertImage={insertImage}
            messageSizeExceeded={messageSizeExceeded}
            onAttachmentsClick={openAttachmentSelect}
          />
          <MobileComposeContentContainer isOpen={isOpen}>{content}</MobileComposeContentContainer>
          {ScheduleSendDrawer}
        </Drawer>
      </>
    );
  }

  const composeHeader = <>{!isSending && <ComposeHeader onClose={closeComposeWithDraftSnack} text='New message' />}</>;

  // Render only header on collapsed
  if (composeCollapseState === ComposeExpandTypes.Collapsed) {
    return composeHeader;
  }

  // If not mobile display content regularly with header
  return (
    <ComposeHotKeys
      bccAddresses={bccAddresses}
      ccAddresses={ccAddresses}
      discardDraft={discardDraft}
      handleSendClick={() => {
        if (!!ScheduleSendDrawer) {
          handleScheduleSendClick();
        } else {
          void handleSendClick();
        }
      }}
      openAttachmentSelect={openAttachmentSelect}
      setBccAddresses={setBccAddresses}
      setCcAddresses={setCcAddresses}
      setFocusedField={setFocusedField}
      setShowBcc={setShowBcc}
      setShowCc={setShowCc}
    >
      {composeHeader}
      {content}
    </ComposeHotKeys>
  );
};

export default Compose;
