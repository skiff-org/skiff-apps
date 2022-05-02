import { Button, Drawer, Icon, IconButton, InputField, Typography } from '@skiff-org/skiff-ui';
import Placeholder from '@tiptap/extension-placeholder';
import { uniqBy } from 'lodash';
import { default as React, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useTheme } from '../../context/ThemeContext';
import {
  AddressObject,
  SendEmailRequest,
  useDecryptionServicePublicKeyQuery,
  useGetCurrentUserEmailAliasesQuery,
  useSendMessageMutation,
  useSendReplyMessageMutation
} from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useComposeFocusedFields } from '../../hooks/useComposeFocusedFields';
import useCustomSnackbar from '../../hooks/useCustomSnackbar';
import { useDefaultEmailAlias } from '../../hooks/useDefaultEmailAlias';
import { useDrafts } from '../../hooks/useDrafts';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailDraftsReducer } from '../../redux/reducers/draftsReducer';
import { PopulateComposeTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { AppDispatch, RootState } from '../../redux/store/reduxStore';
import { AttachmentPair, encryptMessage } from '../../utils/crypto/encryptMessageUtils';
import { getThreadSenders } from '../../utils/mailboxUtils';
import { convertFileListToArray, IMAGE_MIME_TYPES } from '../../utils/readFile';
import { assertExists } from '../../utils/typeUtils';
import {
  Attachments,
  AttachmentTypes,
  createAttachmentHeaders,
  isAllSuccess,
  isInline,
  LocalAttachmentStates,
  prepareInlineAttachments,
  uploadFilesAsInlineAttachments,
  useAttachments,
  useDownloadAttachments,
  usePopulateEditorImages
} from '../Attachments';
import { fetchAndDecryptAttachment } from '../Attachments/useDownloadAttachments';
import { MailEditor, useMailEditor } from '../MailEditor';
import { createImagesFromFiles } from '../MailEditor/Image/utils';
import {
  convertHtmlToTextContent,
  createReplyInitialContent,
  fromEditorToHtml,
  getEmailBody
} from '../MailEditor/mailEditorUtils';
import { MESSAGE_MAX_SIZE } from '../MailEditor/Plugins/MessageSizePlugin';
import AddressField from './AddressAndSubjectFields/AddressField';
import FromAddressField from './AddressAndSubjectFields/FromAddressField';
import RecipientField from './AddressAndSubjectFields/RecipientField';
import { EmailFieldTypes, SKIFF_MAIL_FOOTER } from './Compose.constants';
import ComposeHeader from './ComposeHeader';
import MobileOptionsDrawer from './ComposeToolbarOptions/MobileOptionsDrawer';
import MoreBottomBarOptions from './ComposeToolbarOptions/MoreBottomBarOptions';

const ComposeContainer = styled.div<{ isMobile: boolean }>`
  display: ${(props) => (props.isMobile ? 'grid' : 'flex')};
  flex-direction: column;
  color: var(--text-primary);
`;

const BottomBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-top: 1px solid var(--border-secondary);
  padding: 24px 0px 0px 0px;
  box-sizing: border-box;
  grid-row: 1;
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
`;

const FieldButton = styled.div`
  &:hover * {
    color: var(--text-primary) !important;
  }
`;

const DeleteButtonContainer = styled.div`
  margin-left: auto;
`;

const CloseButtonContainer = styled.div`
  margin-right: auto;
`;

export const ComposeDataTest = {
  toField: 'to-field',
  ccField: 'cc-field',
  bccField: 'bcc-field',
  subjectField: 'subject-field',
  showCcButton: 'show-cc-button',
  showBccButton: 'show-bcc-button',
  closeCcButton: 'close-cc-button',
  closeBccButton: 'close-bcc-button'
};

const Compose: React.FC = () => {
  const user = useRequiredCurrentUserData();
  const { data: emailAliasQuery } = useGetCurrentUserEmailAliasesQuery();
  // memoize for useEffect dep
  const emailAliases = useMemo(
    () => emailAliasQuery?.currentUser?.emailAliases ?? [],
    [emailAliasQuery?.currentUser?.emailAliases]
  );

  const [defaultUserEmail, setDefaultUserEmail] = useDefaultEmailAlias();
  const { composeNewDraft, saveCurrentDraft, flushSaveCurrentDraft } = useDrafts();

  const mailFormDirty = useRef<boolean>(false);
  const currentDraftID = useAppSelector((state) => state.draft.currentDraftID);
  // currentDraftID can be undefined on mobile since this component is not rendered within ComposePanel
  // and therefore can be rendered before the Compose button is clicked
  if (!currentDraftID) {
    composeNewDraft();
  }

  const isOpen = useSelector((state: RootState) => state.modal.composeOpen);
  const isCollapsed = useAppSelector((state) => state.modal.isComposeCollapsed);

  const { trashThreads } = useThreadActions();

  const { attachments, addAttachment, removeAttachment, uploadAttachments, attachmentsSize } = useAttachments();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch<AppDispatch>();

  // more button
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // redux selectors
  const populateComposeContent = useAppSelector((state) => state.modal.populateComposeContent);
  const populateToAddresses = useAppSelector((state) => state.modal.populateComposeToAddresses) || [];
  const overrideSubject = useAppSelector((state) => state.modal.populateComposeSubject);

  const {
    type: populatedContentType,
    email: populatedContentEmail,
    thread: populatedContentThread
  } = populateComposeContent || {};

  const initialHtmlContent = useMemo(() => {
    // empty editor
    if (!populatedContentType || !populatedContentEmail) return SKIFF_MAIL_FOOTER;

    switch (populatedContentType as PopulateComposeTypes) {
      // Keep original content if editing draft or forwarding
      case PopulateComposeTypes.EditDraft:
      case PopulateComposeTypes.Forward:
        return getEmailBody(populatedContentEmail);
      case PopulateComposeTypes.Reply:
      case PopulateComposeTypes.ReplyAll:
        return createReplyInitialContent(populatedContentEmail);
    }
  }, [populatedContentEmail, populatedContentType]);

  const {
    decryptedSubject: populatedSubject,
    to: populatedContentTo,
    cc: populatedContentCC,
    bcc: populatedContentBCC
  } = populatedContentEmail || { decryptedSubject: '', to: null, cc: [], bcc: [] };
  const [toAddresses, setToAddresses] = useState<AddressObject[]>(populatedContentTo ?? populateToAddresses);
  const [ccAddresses, setCcAddresses] = useState<AddressObject[]>(populatedContentCC);
  const [bccAddresses, setBccAddresses] = useState<AddressObject[]>(populatedContentBCC);
  const [subject, setSubject] = useState<string>(overrideSubject ?? populatedSubject ?? '');

  const isComposeDirtyCheck = (setter) => (arg) => {
    mailFormDirty.current = true;
    return setter(arg);
  };

  const [sendMessage, { loading: sendingMessage }] = useSendMessageMutation();
  const [sendReply, { loading: sendingReply }] = useSendReplyMessageMutation();
  const [message, setMessage] = useState<string>(initialHtmlContent || '');

  const clearCurrentDraftID = useCallback(
    () => dispatch(skemailDraftsReducer.actions.clearCurrentDraftID()),
    [dispatch]
  );
  const closeCompose = () => dispatch(skemailModalReducer.actions.closeCompose());

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const { focusedField, setFocusedField } = useComposeFocusedFields({
    content: populateComposeContent,
    toAddresses,
    bccAddresses,
    ccAddresses,
    subject
  });

  const [showEditorToolbar, setShowEditorToolbar] = useState(false);

  const { enqueueCustomSnackbar, closeCustomSnackbar } = useCustomSnackbar();

  const { getAttachmentsDownloadData } = useDownloadAttachments(populatedContentEmail?.decryptedAttachmentMetadata);

  const isReplyOrReplyAll =
    populatedContentType === PopulateComposeTypes.Reply || populatedContentType === PopulateComposeTypes.ReplyAll;

  /** Populates certain values based on the PopulateComposeType
      IMPORTANT NOTE: To/CC/BCC/Subject/Message values are all populated from populateComposeContent at the top of the file
      when the state is declared. This ensures that there is no race condition between this function and saveDrafts
      (which would wipe fields that aren't populated by the time saveDrafts runs)
  */
  useEffect(() => {
    if (!populatedContentEmail) return;

    const { decryptedSubject, decryptedAttachmentMetadata, cc, bcc, from, to } = populatedContentEmail;

    if (populatedContentType === PopulateComposeTypes.Forward) {
      // Forward email
      setSubject(`FWD: ${decryptedSubject}`);
      // Clear all recipient fields
      setToAddresses([]);
      setCcAddresses([]);
      setBccAddresses([]);

      async function populateAttachments() {
        if (!decryptedAttachmentMetadata) return;
        const downloadData = await getAttachmentsDownloadData(
          decryptedAttachmentMetadata
            ?.filter((attachment) => !isInline(attachment))
            .map((attachment) => attachment.attachmentID)
        );

        decryptedAttachmentMetadata.forEach(async (attachment) => {
          const data = downloadData[attachment.attachmentID];
          const content = await fetchAndDecryptAttachment(data);
          if (!content) return;

          addAttachment({
            id: attachment.attachmentID,
            type: AttachmentTypes.Local,
            contentType: attachment.decryptedMetadata?.contentType || '',
            name: attachment.decryptedMetadata?.filename || '',
            size: attachment.decryptedMetadata?.size || 0,
            state: LocalAttachmentStates.Success,
            content
          });
        });
      }

      void populateAttachments();
    } else if (isReplyOrReplyAll) {
      // Reply or Reply all email
      const filterOutCurrUsersEmails = (addresses: AddressObject[]) =>
        addresses.filter(({ address }) => !emailAliases.includes(address));

      setSubject(`RE: ${decryptedSubject}`);
      setToAddresses([from]);

      if (populatedContentType === PopulateComposeTypes.Reply) {
        // Clear the Cc and Bcc fields. Replying should only set the To field.
        // This ensures that if we reply to an email that has a Cc and/or Bcc address,
        // the Cc/Bcc addresses will not be included
        setCcAddresses([]);
        setBccAddresses([]);
      } else if (populatedContentType === PopulateComposeTypes.ReplyAll) {
        // Also add the other recipients of the email
        // And filter out the current user's email aliases from the recipient fields
        setToAddresses((currToAddresses) => {
          const allToAddresses = [...currToAddresses, ...to];
          // If the original From and To addresses belong to the current user, this will be empty
          const filteredToAddresses = filterOutCurrUsersEmails(allToAddresses);
          // Unless the user is sending emails back and forth to themselves,
          // filter out the user's email addresses
          const updatedToAddresses = filteredToAddresses.length ? filteredToAddresses : allToAddresses;
          return uniqBy(updatedToAddresses, (addr) => addr.address);
        });
        const replyAllCcAddresses = filterOutCurrUsersEmails(cc);
        const replyAllBccAddresses = filterOutCurrUsersEmails(bcc);
        setCcAddresses(replyAllCcAddresses);
        setBccAddresses(replyAllBccAddresses);
        setShowCc(!!replyAllCcAddresses.length);
        setShowBcc(!!replyAllBccAddresses.length);
      }
    } else if (populatedContentType === PopulateComposeTypes.EditDraft) {
      setSubject(decryptedSubject || '');
      setToAddresses(to);
      setCcAddresses(cc);
      setBccAddresses(bcc);
      setShowCc(!!cc.length);
      setShowBcc(!!bcc.length);
    }
  }, [
    emailAliases,
    addAttachment,
    isReplyOrReplyAll,
    getAttachmentsDownloadData,
    populatedContentEmail,
    populatedContentType,
    populatedSubject,
    populatedContentTo,
    populatedContentCC,
    populatedContentBCC
  ]);

  const { theme } = useTheme();

  const { editor, setEditor, isLinkEnabled, toggleLink, isEditorDirty } = useMailEditor({
    onCreate(createdEditor) {
      // Flush on create so all content immediately gets saved and we don't run into race conditions
      void flushSaveCurrentDraft(subject, fromEditorToHtml(createdEditor), toAddresses, ccAddresses, bccAddresses);
    },
    onChange(currentEditor) {
      setMessage(fromEditorToHtml(currentEditor));
    },
    initialHtmlContent,
    extensionsOptions: {
      disableBlockquoteToggle: true,
      threadSenders: populatedContentThread ? getThreadSenders(populatedContentThread) : [],
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
      ]
    }
  });

  useEffect(() => {
    // Reset doc changed on placeholder extension storage
    if (editor) {
      editor.extensionStorage[Placeholder.name].changed = false;
    }
  }, [editor]);

  usePopulateEditorImages(populatedContentEmail?.decryptedAttachmentMetadata, editor);
  const editorContentSize = editor?.storage.messageSizeExtension.messageSize || 0;
  const messageSizeExceeded = editorContentSize + attachmentsSize > MESSAGE_MAX_SIZE;

  const composeIsDirty = isEditorDirty || mailFormDirty.current;

  const closeComposeWithDraftSnack = () => {
    closeCompose();
    if (composeIsDirty) {
      enqueueCustomSnackbar({ body: 'Draft saved', icon: Icon.Check });
    }
  };

  useEffect(() => {
    if (composeIsDirty) {
      // We want to save draft only in case form/editor are dirty
      void saveCurrentDraft(subject, message, toAddresses, ccAddresses, bccAddresses);
    }
  }, [subject, message, toAddresses, ccAddresses, bccAddresses, saveCurrentDraft, composeIsDirty]);

  // Clear draft ID on clean up
  useEffect(
    () => () => {
      clearCurrentDraftID();
    },
    [clearCurrentDraftID]
  );

  useEffect(() => {
    setMessage(initialHtmlContent);
    setEditor(initialHtmlContent);
    // setEditor in tiptap does not internally use useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtmlContent]);

  // Get the public key for the decryption service, which is used when sending emails to external users.
  const decryptionServicePublicKey = useDecryptionServicePublicKeyQuery();

  // Discard the current draft when we send or trash the email
  // Hide the snackbar if the draft is discarded after an email is sent, so we don't show both
  // the 'Email Sent' and 'Draft Deleted' snackbars
  const discardDraft = async (hideSnackbar = false) => {
    if (currentDraftID) {
      await trashThreads([currentDraftID], true, hideSnackbar);
    }
    setShowMoreOptions(false);
    closeCompose();
  };

  const handleSendClick = async () => {
    assertExists(editor, 'No editor instance');
    assertExists(
      decryptionServicePublicKey.data?.decryptionServicePublicKey,
      'Could not get external service public key.'
    );

    if (!editor) return;
    const { inlineAttachments, messageWithInlineAttachments } = await prepareInlineAttachments(editor);
    const allAttachments = [...inlineAttachments, ...attachments];

    if (!isAllSuccess(allAttachments)) {
      enqueueCustomSnackbar({
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
    } = await encryptMessage({
      messageSubject: subject,
      messageTextBody: convertHtmlToTextContent(messageWithInlineAttachments),
      messageHtmlBody: messageWithInlineAttachments,
      attachments: convertedAttachments,
      // Remove the __typename field before we send
      toAddresses: toAddresses.map(({ name, address }) => ({ name, address })),
      ccAddresses: ccAddresses.map(({ name, address }) => ({ name, address })),
      bccAddresses: bccAddresses.map(({ name, address }) => ({ name, address })),
      fromAddress: { name: user.publicData?.displayName, address: defaultUserEmail ?? '' },
      privateKey: user.privateUserData.privateKey,
      publicKey: user.publicKey,
      externalPublicKey: decryptionServicePublicKey.data?.decryptionServicePublicKey
    });
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
      rawSubject: subject
    };

    try {
      if (isReplyOrReplyAll) {
        assertExists(populatedContentEmail?.id);
        await sendReply({
          variables: {
            request: {
              ...request,
              replyID: populatedContentEmail?.id
            }
          }
        });
      } else {
        await sendMessage({
          variables: {
            request
          }
        });
      }

      enqueueCustomSnackbar({
        body: 'Message Sent',
        icon: Icon.Check,
        actions: [{ label: 'Dismiss', onClick: (key) => closeCustomSnackbar(key) }]
      });

      void discardDraft(true);
    } catch (err: any) {
      console.error(err);
      enqueueCustomSnackbar({
        body: err.message || 'Failed to send message',
        icon: Icon.Close,
        actions: [{ label: 'Dismiss', onClick: (key) => closeCustomSnackbar(key) }]
      });
    }
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  // Bottom bar options that are shown in mobile inside show more options dropdown
  // But not in regular pc view dropdown
  const sharedMoreBottomBarOptions = {
    text: {
      active: showEditorToolbar,
      icon: Icon.Text,
      onClick: () => {
        setShowEditorToolbar((show) => !show);
        setShowMoreOptions(false);
      },
      size: 'large',
      tooltip: 'Show formatting'
    },
    image: {
      icon: Icon.Image,
      size: 'large',
      onClick: insertImage,
      tooltip: 'Insert Image'
    }
  };
  const mobileDrawerOptions = {
    ...sharedMoreBottomBarOptions,
    trash: {
      icon: Icon.Trash,
      onClick: discardDraft,
      size: 'large',
      tooltip: 'Discard draft'
    }
  };

  // Renders To, Cc, Bcc, and From fields
  const renderAddressAndSubjectFields = () => {
    const ccAndBccButtons = (
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
              type='paragraph'
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
              type='paragraph'
            >
              BCC
            </Typography>
          </FieldButton>
        )}
      </>
    );

    const onBlur = () => setFocusedField(null);

    const onFocus = (field: EmailFieldTypes) => setFocusedField(field);

    return (
      <>
        <RecipientField
          additionalButtons={ccAndBccButtons}
          addresses={toAddresses}
          dataTest={ComposeDataTest.toField}
          field={EmailFieldTypes.TO}
          focusedField={focusedField}
          onBlur={onBlur}
          onFocus={onFocus}
          setAddresses={isComposeDirtyCheck(setToAddresses)}
          userID={user.userID}
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
              />
            }
            addresses={ccAddresses}
            dataTest={ComposeDataTest.ccField}
            field={EmailFieldTypes.CC}
            focusedField={focusedField}
            onBlur={onBlur}
            onFocus={onFocus}
            setAddresses={isComposeDirtyCheck(setCcAddresses)}
            userID={user.userID}
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
              />
            }
            addresses={bccAddresses}
            dataTest={ComposeDataTest.bccField}
            field={EmailFieldTypes.BCC}
            focusedField={focusedField}
            onBlur={onBlur}
            onFocus={onFocus}
            setAddresses={isComposeDirtyCheck(setBccAddresses)}
            userID={user.userID}
          />
        )}
        <AddressField
          dataTest={ComposeDataTest.subjectField}
          field={EmailFieldTypes.SUBJECT}
          focusedField={focusedField}
        >
          <InputField
            autoFocus={focusedField === EmailFieldTypes.SUBJECT}
            onBlur={onBlur}
            onChange={(e) => isComposeDirtyCheck(setSubject)(e.target.value)}
            onFocus={() => setFocusedField(EmailFieldTypes.SUBJECT)}
            placeholder='Add a subject'
            size='medium'
            type='unfilled'
            value={subject}
          />
        </AddressField>
        <FromAddressField
          emailAliases={emailAliases}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
          setUserEmail={setDefaultUserEmail}
          userEmail={defaultUserEmail ?? ''}
        />
      </>
    );
  };

  const sending = sendingMessage || sendingReply;

  const content = (
    <>
      {!sending && (
        <ComposeContainer
          isMobile={isMobile}
          onDrop={(event) => {
            if (!editor?.view) return;
            uploadFilesAsInlineAttachments(event.dataTransfer.files, editor.view, uploadAttachments);
            event.preventDefault();
          }}
        >
          {renderAddressAndSubjectFields()}
          {editor && (
            <MailEditor
              editor={editor}
              isFocused={focusedField === EmailFieldTypes.BODY}
              showToolbar={showEditorToolbar}
            />
          )}
          <BottomBar style={{ borderStyle: isMobile ? 'none' : undefined, padding: isMobile ? '0' : undefined }}>
            <Attachments
              attachmentSizeExceeded={attachments.length ? attachmentsSize > MESSAGE_MAX_SIZE : false}
              attachments={attachments}
              attachmentsSize={attachmentsSize}
              onDelete={(id) => {
                removeAttachment(id);
              }}
            />
            <ButtonContainer style={{ flexDirection: isMobile ? 'row-reverse' : undefined }}>
              <Button
                disabled={messageSizeExceeded}
                onClick={handleSendClick}
                tooltip={messageSizeExceeded ? 'Attachments are too large!' : undefined}
              >
                Send
              </Button>
              {!isMobile && <MoreBottomBarOptions moreBottomBarOptions={sharedMoreBottomBarOptions} />}
              {isMobile && (
                <MobileOptionsDrawer
                  moreBottomBarOptions={mobileDrawerOptions}
                  setShowMoreOptions={(value: boolean) => setShowMoreOptions(value)}
                  showMoreOptions={showMoreOptions}
                />
              )}
              <IconButton
                icon={Icon.PaperClip}
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                size='large'
                tooltip='Add attachments'
              />
              {!isMobile && (
                <IconButton
                  disabled={!isLinkEnabled()}
                  icon={Icon.Link}
                  onClick={toggleLink}
                  size='large'
                  tooltip='Insert link'
                />
              )}
              {/* Trash button for desktop */}
              {!isMobile && (
                <DeleteButtonContainer>
                  <IconButton icon={Icon.Trash} onClick={() => discardDraft()} size='large' tooltip='Discard draft' />
                </DeleteButtonContainer>
              )}
              {/* Close button for mobile */}
              {isMobile && (
                <CloseButtonContainer>
                  <IconButton
                    icon={Icon.Close}
                    onClick={() => {
                      dispatch(skemailModalReducer.actions.closeCompose());
                    }}
                    size='large'
                    tooltip='Close'
                  />
                </CloseButtonContainer>
              )}
            </ButtonContainer>
            {/* Add a title "New Message" to mobile */}
            {isMobile && <h2>New Message</h2>}
          </BottomBar>
        </ComposeContainer>
      )}
      <input
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
        accept={IMAGE_MIME_TYPES.join(',')}
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
    </>
  );

  // On mobile display content in drawer
  if (isMobile) {
    return (
      <Drawer
        hideDrawer={() => {
          dispatch(skemailModalReducer.actions.closeCompose());
        }}
        show={isOpen}
      >
        <div style={{ padding: '1em', height: '90vh' }}>{content}</div>
      </Drawer>
    );
  }

  const composeHeader = <>{!sending && <ComposeHeader onClose={closeComposeWithDraftSnack} text={subject || 'New message'} />}</>;
  // Render only header on collapsed
  if (isCollapsed) {
    return composeHeader;
  }

  // If not mobile display content regularly with header
  return (
    <>
      {composeHeader}
      {content}
    </>
  );
};

export default Compose;
