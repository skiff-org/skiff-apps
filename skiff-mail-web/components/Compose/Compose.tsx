import { ApolloQueryResult, ApolloError } from '@apollo/client';
import { Editor } from '@tiptap/react';
import dayjs from 'dayjs';
import { Icon, IconButton, InputField, Typography, Drawer } from 'nightwatch-ui';
import { Node } from 'prosemirror-model';
import { default as React, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile, isAndroid } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import { convertFileListToArray, FileTypes, MIMETypes, useTheme, useToast } from 'skiff-front-utils';
import { useIosBackdropEffect } from 'skiff-front-utils';
import { AddressObject, getPaywallErrorCode, SendEmailRequest } from 'skiff-graphql';
import {
  EmailFragment,
  EmailFragmentDoc,
  GetUserProfileDataQuery,
  useDecryptionServicePublicKeyQuery,
  useGetUserContactListQuery,
  useSendMessageMutation,
  useSendReplyMessageMutation,
  useUnsendMessageMutation
} from 'skiff-mail-graphql';
import { AttachmentPair, encryptMessage } from 'skiff-mail-graphql';
import styled from 'styled-components';
import { v4 } from 'uuid';

import client from '../../apollo/client';
import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { MOBILE_MAIL_BODY_ID } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentUserEmailAliases } from '../../hooks/useCurrentUserEmailAliases';
import { useDefaultEmailAlias } from '../../hooks/useDefaultEmailAlias';
import { MailDraftAttributes, useDrafts } from '../../hooks/useDrafts';
import useLocalSetting from '../../hooks/useLocalSetting';
import { usePaywall } from '../../hooks/usePaywall';
import { useThreadActions } from '../../hooks/useThreadActions';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo } from '../../models/email';
import { skemailDraftsReducer } from '../../redux/reducers/draftsReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { AppDispatch, RootState } from '../../redux/store/reduxStore';
import { getMailFooter } from '../../utils/composeUtils';
import { getThreadSenders } from '../../utils/mailboxUtils';
import { getUserProfileFromID } from '../../utils/userUtils';
import {
  Attachments,
  AttachmentStates,
  createAttachmentHeaders,
  isAllHasContent,
  prepareInlineAttachments,
  uploadFilesAsInlineAttachments,
  useAttachments,
  usePopulateEditorImages
} from '../Attachments';
import { MailEditor } from '../MailEditor';
import { EditorExtensionsOptions } from '../MailEditor/Extensions';
import { Image } from '../MailEditor/Image';
import { createImagesFromFiles } from '../MailEditor/Image/utils';
import {
  convertHtmlToTextContent,
  fromEditorToHtml,
  isLinkEnabled,
  setEditor,
  toggleLink
} from '../MailEditor/mailEditorUtils';
import { Placeholder } from '../MailEditor/Placeholder';
import { MESSAGE_MAX_SIZE_IN_BYTES } from '../MailEditor/Plugins/MessageSizePlugin';

import AddressField from './AddressAndSubjectFields/AddressField';
import FromAddressField from './AddressAndSubjectFields/FromAddressField';
import RecipientField from './AddressAndSubjectFields/RecipientField';
import { EmailFieldTypes } from './Compose.constants';
import ComposeHeader from './ComposeHeader';
import ComposeHotKeys from './ComposeHotKeys';
import MobileAttachments from './MobileAttachments';
import MobileButtonBar from './MobileButtonBar';
import useComposeActions from './useComposeActions';
const ComposeContainer = styled.div<{ isMobile: boolean }>`
  display: ${(props) => (props.isMobile ? 'grid' : 'flex')};
  flex-direction: column;
  color: var(--text-primary);
  ${(props) => (props.isMobile ? '' : 'min-height:  430px;')};
`;

const BottomBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-top: 1px solid var(--border-secondary);
  padding: 12px 0px 0px 0px;
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
  height: calc(85vh - ${isAndroid ? window.statusBarHeight : 0}px);
  overflow: auto;
  width: 100vw;
  margin-left: -12px;
  padding: 0px 12px;
  box-sizing: border-box;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 36px;
  gap: 12px;
  justify-content: flex-start;
  padding-bottom: 24px;
  padding-top: 12px;
`;

const FieldButton = styled.div`
  &:hover * {
    color: var(--text-primary) !important;
  }
`;

export const ComposeDataTest = {
  toField: 'to-field',
  ccField: 'cc-field',
  bccField: 'bcc-field',
  subjectField: 'subject-field',
  showCcButton: 'show-cc-button',
  showBccButton: 'show-bcc-button',
  closeCcButton: 'close-cc-button',
  closeBccButton: 'close-bcc-button',
  attachmentsInput: 'attachments-input',
  insertImage: 'insert-image',
  sendButton: 'send-button'
};

const Compose: React.FC = () => {
  const emailAliases = useCurrentUserEmailAliases();

  const contentRef = useRef<HTMLDivElement>(null);
  if (contentRef.current) contentRef.current.focus();

  const [defaultEmailAlias, setDefaultUserEmail] = useDefaultEmailAlias();
  const { composeNewDraft, saveCurrentDraft, flushSaveCurrentDraft } = useDrafts();

  const mailFormDirty = useRef<boolean>(false);
  const currentDraftID = useAppSelector((state) => state.draft.currentDraftID);
  // currentDraftID can be undefined on mobile since this component is not rendered within ComposePanel
  // and therefore can be rendered before the Compose button is clicked
  if (!currentDraftID) {
    composeNewDraft();
  }

  const { trashThreads } = useThreadActions();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const subjectFieldRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const mailEditorRef = useRef<Editor>(null);
  const editor: Editor | null = mailEditorRef.current;

  const user = useRequiredCurrentUserData();
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
    isComposeCollapsed: isCollapsed,
    populateComposeContent
  } = useSelector((state: RootState) => state.modal);

  const {
    subject: populatedSubject,
    toAddresses: populatedToAddresses,
    ccAddresses: populatedCCAddresses,
    bccAddresses: populatedBCCAddresses,
    fromAddress: populatedFromAddress,
    messageBody: populatedMessage,
    attachmentMetadata: populatedAttachmentMetadata,
    replyEmailID,
    replyThread
  } = populateComposeContent;

  const [fromEmail, setFromEmail] = useState(populatedFromAddress || defaultEmailAlias);
  const [customDomainAlias, setCustomDomainAlias] = useState('');

  // update the from email to be the default email alias
  // if there is not already a preset populated from address
  useEffect(() => {
    if (!fromEmail) setFromEmail(customDomainAlias || defaultEmailAlias);
  }, [customDomainAlias, defaultEmailAlias]);

  // Get contact list
  const { data } = useGetUserContactListQuery({
    variables: {
      request: {
        userID: user.userID
      }
    },
    fetchPolicy: 'cache-and-network'
  });

  const contactList = data?.user?.contactList ?? [];

  const [securedBySkiffSigDisabled] = useLocalSetting('securedBySkiffSigDisabled');
  const initialHtmlContent = useMemo(
    () => populatedMessage || getMailFooter(userSignature, !!securedBySkiffSigDisabled),
    [populatedMessage, userSignature, securedBySkiffSigDisabled]
  );

  // In the future, we likely want to move filtering logic into replyAllCompose in modalReducer.ts
  // Limitation with this is that the users email will get filtered out of CC/BCC in a draft, but this is
  // an rare use case
  const [toAddresses, setToAddresses] = useState<AddressObject[]>(populatedToAddresses);
  const [ccAddresses, setCcAddresses] = useState<AddressObject[]>(populatedCCAddresses);
  const [bccAddresses, setBccAddresses] = useState<AddressObject[]>(populatedBCCAddresses);

  const [subject, setSubject] = useState<string>(populatedSubject);

  const isComposeDirtyCheck = (setter) => (arg) => {
    mailFormDirty.current = true;
    return setter(arg);
  };

  const [sendMessage] = useSendMessageMutation();
  const [sendReply] = useSendReplyMessageMutation();
  const [unsendMessage] = useUnsendMessageMutation();

  const reopenEditCompose = (draft: MailboxEmailInfo) => dispatch(skemailModalReducer.actions.editDraftCompose(draft));

  // Whether a message is currently being sent
  const isSending = useAppSelector((state) => state.modal.isSending);
  const setIsSending = (isSending: boolean) => dispatch(skemailModalReducer.actions.setIsSending(isSending));

  const clearCurrentDraftID = useCallback(
    () => dispatch(skemailDraftsReducer.actions.clearCurrentDraftID()),
    [dispatch]
  );
  const closeCompose = () => dispatch(skemailModalReducer.actions.closeCompose());

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

  useEffect(() => {
    // Becouse we always render compose and just show it base on isOpen
    // Everytime we reopen compose we want to reset compoes dirty to false
    setIsEditorDirty(false);
    mailFormDirty.current = false;
  }, [isOpen]);
  const { enqueueToast, closeToast } = useToast();

  const { attachmentsSize, attachments, removeAttachment, removeAllAttachments, uploadAttachments } = useAttachments(
    { metadata: populatedAttachmentMetadata },
    true
  );

  const { theme } = useTheme();

  usePopulateEditorImages(attachments, editor);

  const editorContentSize = editor?.storage.messageSizeExtension.messageSize || 0;
  const messageSizeExceeded = editorContentSize + attachmentsSize > MESSAGE_MAX_SIZE_IN_BYTES;

  const composeIsDirty = isEditorDirty || mailFormDirty.current;

  // Reset data when new populated content is passed in
  useEffect(() => {
    setSubject(populatedSubject);
    setToAddresses(populatedToAddresses);
    setCcAddresses(populatedCCAddresses);
    setBccAddresses(populatedBCCAddresses);

    mailDraftDataRef.current = {
      composeIsDirty: false, // compose never starts dirty
      subject: populatedSubject,
      toAddresses: populatedToAddresses,
      bccAddresses: populatedBCCAddresses,
      ccAddresses: populatedCCAddresses,
      text: initialHtmlContent
    };
  }, [populatedBCCAddresses, populatedCCAddresses, initialHtmlContent, populatedToAddresses, populatedSubject, isOpen]);

  // When the initial content change, set editor - helps when there is a minimize mail while clicking reply on any thread mail
  useEffect(() => {
    if (mailEditorRef.current) {
      setEditor(mailEditorRef.current, initialHtmlContent, true);
    }
  }, [initialHtmlContent]);

  // Using memo for readability - create on mount once
  const mailEditorExtensionsOptions: EditorExtensionsOptions = useMemo(
    () => ({
      disableBlockquoteToggle: true,
      isMobileApp: isMobile,
      threadSenders: replyThread ? getThreadSenders(replyThread) : [],
      theme,
      pasteHandlers: [
        function handleImagePaste(view, event) {
          const files = event.clipboardData?.files;
          if (files?.length) {
            uploadFilesAsInlineAttachments(files, view, uploadAttachments);
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
      // Flush on create so all content immediately gets saved and we don't run into race conditions
      flushSaveCurrentDraft(subject, fromEditorToHtml(createdEditor), toAddresses, ccAddresses, bccAddresses);
      // Focus into editor / body on mount if there are addresses in the To header
      if (!createdEditor.isFocused && initialFocus === EmailFieldTypes.BODY) {
        setTimeout(() => {
          // Timeout is important for iOS, otherwise the keyboard open before compose completely showed and it case issue with app header
          createdEditor.commands.focus();
        }, 100);
        setFocusedField(initialFocus);
      }
    },
    [initialFocus]
  );

  useEffect(() => {
    if (composeIsDirty && mailDraftDataRef.current) {
      mailDraftDataRef.current = {
        ...mailDraftDataRef.current,
        bccAddresses,
        ccAddresses,
        subject,
        toAddresses,
        composeIsDirty
      };

      const { text } = mailDraftDataRef.current;

      saveCurrentDraft(subject, text, toAddresses, ccAddresses, bccAddresses);
    }
  }, [bccAddresses, editor, ccAddresses, composeIsDirty, subject, toAddresses, saveCurrentDraft]);

  const closeComposeWithDraftSnack = () => {
    closeCompose();
    if (composeIsDirty) {
      enqueueToast({ body: 'Draft saved', icon: Icon.Check });
    }
  };

  // Clear draft ID on clean up
  useEffect(
    () => () => {
      clearCurrentDraftID();
    },
    [clearCurrentDraftID]
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
    }
    setShowMoreOptions(false);
    closeCompose();
  };

  const send = async (scheduleSendAt?: Date) => {
    if (!editor) {
      console.error('No editor instance');
      enqueueToast({
        body: 'Failed to send message: Editor instance missing',
        icon: Icon.Close,
        actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
      });
      return;
    }

    if (toAddresses.length === 0 && ccAddresses.length === 0 && bccAddresses.length === 0) {
      enqueueToast({
        body: 'Failed to send message: Missing recipient address',
        icon: Icon.At
      });
      return;
    }

    if (!decryptionServicePublicKey.data?.decryptionServicePublicKey) {
      console.error('Could not get external service public key.');
      enqueueToast({
        body: 'Failed to send message: External service public key error',
        icon: Icon.Close,
        actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
      });
      return;
    }

    const { inlineAttachments, messageWithInlineAttachments } = await prepareInlineAttachments(editor);

    const allAttachments = [...inlineAttachments, ...attachments.filter((attach) => !attach.inline)];

    /**
     * Its important to set isSending after we serialize the doc
     * because its causing the editor dom to unmount and we cant get the computed style from the elements
     */
    setIsSending(true);

    if (isMobile) {
      // Close compose drawer after prepareInlineAttachments
      closeCompose();
    }

    if (!isAllHasContent(allAttachments)) {
      enqueueToast({
        body: 'Some of the attached files are not uploaded',
        icon: Icon.Warning
      });
      return;
    }

    const convertedAttachments = await Promise.all(
      allAttachments.map(async ({ contentType, name, size, content, inline, id }): Promise<AttachmentPair> => {
        const { contentDisposition, checksum, contentID } = await createAttachmentHeaders({
          fileName: name,
          content,
          attachmentType: inline ? 'inline' : 'attachment'
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

    // Update the default email alias to the latest from email used
    if (fromEmail) {
      await setDefaultUserEmail(fromEmail);
    }

    // get user profile data, force network
    // if user is disabled, this will fail
    let profileResponse: ApolloQueryResult<GetUserProfileDataQuery> | undefined;
    try {
      profileResponse = await getUserProfileFromID(user.userID, true);
      if (!profileResponse.data?.user) {
        throw new Error('Did not fetch data');
      }
    } catch (error) {
      console.warn('Could not fetch profile data');
      enqueueToast({
        body: 'Failed to send message: Could not fetch profile data',
        icon: Icon.Close,
        actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
      });
      void discardDraft(true);
      return;
    }

    const fromEmailWithCustomDomain = fromEmail;

    const {
      encryptedSubject,
      encryptedText,
      encryptedHtml,
      encryptedTextAsHtml,
      encryptedAttachments,
      toAddressesWithEncryptedKeys,
      ccAddressesWithEncryptedKeys,
      bccAddressesWithEncryptedKeys,
      externalEncryptedSessionKey,
      fromAddressWithEncryptedKey
    } = await encryptMessage(
      {
        messageSubject: subject,
        messageTextBody: convertHtmlToTextContent(messageWithInlineAttachments),
        messageHtmlBody: messageWithInlineAttachments,
        attachments: convertedAttachments,
        // Remove the __typename field before we send
        toAddresses: toAddresses.map(({ name, address }) => ({ name, address })),
        ccAddresses: ccAddresses.map(({ name, address }) => ({ name, address })),
        bccAddresses: bccAddresses.map(({ name, address }) => ({ name, address })),
        fromAddress: {
          name: profileResponse.data.user.publicData?.displayName,
          address: fromEmailWithCustomDomain ?? ''
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
      rawSubject: subject,
      scheduleSendAt
    };

    let messageAndThreadID: { messageID: string; threadID: string } | undefined | null;

    try {
      // TODO: Add spinner to toast once we have it in skiff-ui]
      if (replyEmailID) {
        const { data } = await sendReply({
          variables: {
            request: {
              ...request,
              replyID: replyEmailID
            }
          },
          context: {
            headers: {
              'Apollo-Require-Preflight': true // this is required for attachment uploading. Otherwise, router backend will reject request.
            }
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
        body: scheduleSendAt ? `Scheduled for ${dayjs(scheduleSendAt).format('ddd MMM D [at] h:mma')}` : 'Message Sent',
        icon: Icon.Check,
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
                const emailFromCache = await client.cache.readFragment<EmailFragment>({
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
              }
              closeToast(key);
            }
          }
        ]
      });

      removeAllAttachments();
      void discardDraft(true);
    } catch (err: any) {
      const paywallErrorCode = getPaywallErrorCode((err as ApolloError).graphQLErrors);
      if (paywallErrorCode) {
        openPaywallModal(paywallErrorCode);
      } else {
        console.error(err);
        enqueueToast({
          body: (err as Error).message || 'Failed to send message',
          icon: Icon.Close,
          actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
        });
      }
    }
  };

  const handleSendClick = async (scheduleSendAt?: Date) => {
    await send(scheduleSendAt);
    setIsSending(false);
  };

  const insertImage = () => imageInputRef.current?.click();

  const openAttachmentSelect = () => fileInputRef.current?.click();

  const { desktopBottomBarButtons, mobileActionBarButtons, ScheduleSendDrawer } = useComposeActions({
    handleSendClick,
    toggleLink: () => {
      if (editor) toggleLink(editor);
    },
    insertImage,
    discardDraft,
    isLinkEnabled: () => editor && isLinkEnabled(editor),
    messageSizeExceeded,
    openAttachmentSelect
  });

  /**
   * This sets the dirty state of the Placeholder extension
   */
  useEffect(() => {
    if (!editor) return;
    if (isEditorDirty) {
      editor.extensionStorage[Placeholder.name].changed = true;
    } else {
      editor.extensionStorage[Placeholder.name].changed = false;
    }
  }, [editor, isEditorDirty]);

  const ccAndBccButtons = useMemo(
    () => (
      <>
        {!showCc && (
          <FieldButton>
            <Typography
              color='secondary'
              dataTest={ComposeDataTest.showCcButton}
              level={3}
              onClick={() => {
                setShowCc(true);
                setFocusedField(EmailFieldTypes.CC);
              }}
              style={{ flexShrink: 0 }}
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
              level={3}
              onClick={() => {
                setShowBcc(true);
                setFocusedField(EmailFieldTypes.BCC);
              }}
              style={{ flexShrink: 0 }}
            >
              BCC
            </Typography>
          </FieldButton>
        )}
      </>
    ),
    [showBcc, showCc]
  );

  const onFiledBlur = useCallback(() => setFocusedField(null), []);

  const onFiledFocus = useCallback((field: EmailFieldTypes) => setFocusedField(field), []);

  const recipientFieldSetAddresses = isComposeDirtyCheck(setToAddresses);

  const onMailEditorChange = (updatedEditor: Editor) => {
    if (!mailDraftDataRef.current || !mailDraftDataRef.current.composeIsDirty) return;

    const text = fromEditorToHtml(updatedEditor);
    mailDraftDataRef.current.text = text;

    const {
      toAddresses: toAddressesRef,
      bccAddresses: bccAddressesRef,
      ccAddresses: ccAddressesRef,
      subject: subjectRef
    } = mailDraftDataRef.current;

    saveCurrentDraft(subjectRef, text, toAddressesRef, ccAddressesRef, bccAddressesRef);
  };

  // Renders To, Cc, Bcc, and From fields
  const renderAddressAndSubjectFields = () => {
    return (
      <>
        <RecipientField
          additionalButtons={ccAndBccButtons}
          addresses={toAddresses}
          contactList={contactList}
          dataTest={ComposeDataTest.toField}
          field={EmailFieldTypes.TO}
          focusedField={focusedField}
          onBlur={onFiledBlur}
          onDrop={moveAddressChip}
          onFocus={onFiledFocus}
          setAddresses={recipientFieldSetAddresses}
        />
        {showCc && (
          <RecipientField
            additionalButtons={
              <IconButton
                color='secondary'
                dataTest={ComposeDataTest.closeCcButton}
                icon={Icon.Close}
                onClick={() => {
                  setShowCc(false);
                  isComposeDirtyCheck(setCcAddresses)([]);
                }}
                size='small'
              />
            }
            addresses={ccAddresses}
            contactList={contactList}
            dataTest={ComposeDataTest.ccField}
            field={EmailFieldTypes.CC}
            focusedField={focusedField}
            onBlur={onFiledBlur}
            onDrop={moveAddressChip}
            onFocus={onFiledFocus}
            setAddresses={isComposeDirtyCheck(setCcAddresses)}
          />
        )}
        {showBcc && (
          <RecipientField
            additionalButtons={
              <IconButton
                color='secondary'
                dataTest={ComposeDataTest.closeBccButton}
                icon={Icon.Close}
                onClick={() => {
                  setShowBcc(false);
                  isComposeDirtyCheck(setBccAddresses)([]);
                }}
                size='small'
              />
            }
            addresses={bccAddresses}
            contactList={contactList}
            dataTest={ComposeDataTest.bccField}
            field={EmailFieldTypes.BCC}
            focusedField={focusedField}
            onBlur={onFiledBlur}
            onDrop={moveAddressChip}
            onFocus={onFiledFocus}
            setAddresses={isComposeDirtyCheck(setBccAddresses)}
          />
        )}
        <AddressField
          dataTest={ComposeDataTest.subjectField}
          field={EmailFieldTypes.SUBJECT}
          focusedField={focusedField}
        >
          <InputField
            autoFocus={focusedField === EmailFieldTypes.SUBJECT}
            innerRef={subjectFieldRef}
            onBlur={onFiledBlur}
            onChange={(e) => isComposeDirtyCheck(setSubject)(e.target.value)}
            onFocus={() => setFocusedField(EmailFieldTypes.SUBJECT)}
            onKeyDown={(e: React.KeyboardEvent) => {
              // Remove focus from field when Escape is pressed
              if (e.key === 'Escape') subjectInputRef.current?.blur();
            }}
            placeholder='Add a subject'
            size='medium'
            style={{ padding: '8px 0px' }}
            type='unfilled'
            value={subject}
          />
        </AddressField>
        {!!emailAliases.length && (
          <FromAddressField
            emailAliases={emailAliases}
            focusedField={focusedField}
            setCustomDomainAlias={setCustomDomainAlias}
            setFocusedField={setFocusedField}
            setUserEmail={setFromEmail}
            userEmail={fromEmail ?? ''}
          />
        )}
      </>
    );
  };

  const content = (
    <div ref={contentRef}>
      {!isSending && (
        <ComposeContainer isMobile={isMobile}>
          {renderAddressAndSubjectFields()}
          {
            <MailEditor
              editorRef={mailEditorRef}
              extensionsOptions={mailEditorExtensionsOptions}
              hasAttachments={attachments.length > 0}
              initialHtmlContent={mailDraftDataRef.current?.text ?? initialHtmlContent}
              mobileToolbarButtons={mobileActionBarButtons}
              onBlur={onFiledBlur}
              onChange={onMailEditorChange}
              onCreate={mailEditorOnCreate}
              onDrop={(event) => {
                if (!editor?.view) return;
                uploadFilesAsInlineAttachments(event.dataTransfer.files, editor.view, uploadAttachments);
                event.preventDefault();
              }}
              onFocus={() => onFiledFocus(EmailFieldTypes.BODY)}
              setIsEditorDirty={setIsEditorDirty}
            />
          }
          {!isMobile && (
            <BottomBar>
              <Attachments
                attachmentSizeExceeded={attachments.length ? attachmentsSize > MESSAGE_MAX_SIZE_IN_BYTES : false}
                attachments={attachments}
                attachmentsSize={attachmentsSize}
                onDelete={(id) => {
                  removeAttachment(id);
                }}
                onDrop={(event) => {
                  const filesArray = convertFileListToArray(event.dataTransfer.files);
                  void uploadAttachments(filesArray);
                }}
              />
              <ButtonContainer>{desktopBottomBarButtons}</ButtonContainer>
            </BottomBar>
          )}
        </ComposeContainer>
      )}
      <input
        data-test={ComposeDataTest.attachmentsInput}
        multiple
        onChange={() => {
          if (!fileInputRef.current?.files) return;
          void uploadAttachments(convertFileListToArray(fileInputRef.current.files));
        }}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        value={''}
      />
      <input
        accept={MIMETypes[FileTypes.Image].join(',')}
        multiple
        onChange={async () => {
          if (!imageInputRef.current?.files || !editor?.view) return;
          const imagesFiles = convertFileListToArray(imageInputRef.current?.files);
          void createImagesFromFiles(imagesFiles, editor.view);
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
    </div>
  );

  // On mobile display content in drawer
  if (isMobile) {
    return (
      <>
        <Drawer
          extraSpacer={false}
          hideDrawer={() => {
            dispatch(skemailModalReducer.actions.closeCompose());
          }}
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
  if (isCollapsed) {
    return composeHeader;
  }

  // If not mobile display content regularly with header
  return (
    <ComposeHotKeys
      bccAddresses={bccAddresses}
      ccAddresses={ccAddresses}
      discardDraft={discardDraft}
      handleSendClick={handleSendClick}
      openAttachmentSelect={openAttachmentSelect}
      setBccAddresses={setBccAddresses}
      setCcAddresses={setCcAddresses}
      setFocusedField={setFocusedField}
      setShowBcc={setShowBcc}
      setShowCc={setShowCc}
      subjectFieldRef={subjectFieldRef}
    >
      {composeHeader}
      {content}
    </ComposeHotKeys>
  );
};

export default Compose;
