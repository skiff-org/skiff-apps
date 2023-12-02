import debounce from 'lodash/debounce';
import uniqBy from 'lodash/uniqBy';
import {
  AccentColor,
  Avatar,
  DISPLAY_SCROLLBAR_CSS,
  Divider,
  FilledVariant,
  Icon,
  IconText,
  Icons,
  InputField,
  MonoTag,
  Size,
  TextArea,
  Toggle,
  Typography,
  TypographySize,
  TypographyWeight,
  accentColorToPrimaryColor,
  getTextAndBgColors
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { encryptDatagramV2, generateSymmetricKey, stringEncryptAsymmetric } from 'skiff-crypto';
import {
  EncryptedAliasDataDatagram,
  useGetFullAliasInfoQuery,
  useGetUserQuickAliasesQuery,
  useMailboxQuery,
  useUpdateQuickAliasInfoMutation,
  useUserLabelsQuery
} from 'skiff-front-graphql';
import { ColorSelector, useAsyncHcaptcha, useRequiredCurrentUserData, useToast } from 'skiff-front-utils';
import { AddressObject, FullAliasInfo, UserThread } from 'skiff-graphql';
import styled from 'styled-components';

import { DEFAULT_MAILBOX_LIMIT } from '../../../../constants/mailbox.constants';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { sortByName, splitUserLabelsByVariant, userLabelFromGraphQL } from '../../../../utils/label';
import { MailboxSearchFilter, MailboxSearchFilterType } from '../../../../utils/search/searchTypes';
import { useSearch } from '../../../../utils/search/useSearch';
import { useSettings } from '../../useSettings';
import QuickAliasDropdown from '../QuickAliasModal/QuickAliasDropdown';

import QuickAliasSelectedSenderRow from './QuickAliasSelectedSenderRow';

const QuickAliasRight = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  ${DISPLAY_SCROLLBAR_CSS}
  justify-content: flex-start;
  align-items: flex-start;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  box-sizing: border-box;
  background: var(--bg-l3-solid);
  border-bottom: 1px solid var(--border-secondary);
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 50%;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
  border-left: 1px solid var(--border-secondary);
  background: var(--bg-l2-solid);
`;

const ColorSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  background: var(--bg-overlay-tertiary);
  align-items: center;
`;

const HeaderInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ColorSelectContainer = styled.div`
  width: 220px;
`;

const FieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
`;

const StatContainer = styled.div<{ $clickable?: boolean; $hide?: boolean }>`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  align-items: center;
  height: ${({ $hide }) => ($hide ? '46px' : '')};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  :hover {
    background: ${({ $clickable }) => ($clickable ? 'var(--bg-overlay-quaternary)' : 'none')};
  }
`;

const TitleToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const SenderList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  box-sizing: border-box;
`;

const ExpandableTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface QuickAliasSelectedViewProps {
  selectedQuickAlias: FullAliasInfo;
  setSelectedQuickAlias: (quickAlias?: FullAliasInfo) => void;
}

const getSenders = (threads?: UserThread[]): AddressObject[] => {
  if (!threads) return [];
  // Extract all senders
  const senders = threads.flatMap((thread) => thread.emails.map((email) => email.from));
  return uniqBy(senders, (sender) => sender.address);
};

export default function QuickAliasSelectedView(props: QuickAliasSelectedViewProps) {
  const { selectedQuickAlias, setSelectedQuickAlias } = props;

  const dispatch = useDispatch();
  const closeOpenModal = () => dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  const { searchInSearchRoute } = useSearch();
  const { closeSettings } = useSettings();
  const { data: quickAliasData } = useGetUserQuickAliasesQuery();
  const userData = useRequiredCurrentUserData();
  const { enqueueToast } = useToast();
  const { refetch } = useGetFullAliasInfoQuery();

  const isDisabled =
    quickAliasData?.currentUser?.quickAliases?.find((quickAlias) => quickAlias.alias === selectedQuickAlias.emailAlias)
      ?.isSendingAndReceivingEnabled === false;

  const [displayNameValue, setDisplayNameValue] = useState<string>(selectedQuickAlias?.displayName || '');
  const [enablePush, setEnablePush] = useState<boolean>(selectedQuickAlias?.areNotificationsEnabled ?? true);
  const [notes, setNotes] = useState<string>(selectedQuickAlias?.decryptedData?.note || '');
  const [colorValue, setColorValue] = useState<AccentColor | undefined>(
    selectedQuickAlias?.displayPictureData?.profileAccentColor as AccentColor
  );
  const [showOptionDropdown, setShowOptionDropdown] = useState<boolean>(false);
  const [isSenderExpanded, setIsSenderExpanded] = useState<boolean>(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string>('');

  const [colorName] = getTextAndBgColors(
    undefined,
    undefined,
    selectedQuickAlias?.displayName || selectedQuickAlias.emailAlias,
    undefined
  );
  const { requestHcaptchaToken } = useAsyncHcaptcha(true);

  useEffect(() => {
    setDisplayNameValue(selectedQuickAlias?.displayName || '');
    setNotes(selectedQuickAlias?.decryptedData?.note || '');
    setEnablePush(selectedQuickAlias?.areNotificationsEnabled ?? true);
    setColorValue(selectedQuickAlias?.displayPictureData?.profileAccentColor as AccentColor);
  }, [selectedQuickAlias.emailAlias]); // when alias changes only

  useEffect(() => {
    // get a token to send later when sending a message
    const getHcaptchaToken = async () => {
      try {
        const token = await requestHcaptchaToken();
        setHcaptchaToken(token);
      } catch (error) {
        console.error('Failed to get hcaptcha token', error);
      }
    };
    if (!hcaptchaToken) {
      void getHcaptchaToken();
    }
  }, [hcaptchaToken, requestHcaptchaToken]);

  const { data: userLabelData, refetch: refetchUserLabels } = useUserLabelsQuery();
  const { quickAliasLabels } = splitUserLabelsByVariant(
    userLabelData?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );
  const currentQuickAliasLabel = quickAliasLabels.find((label) => label.name === selectedQuickAlias?.emailAlias);

  const { data: mailboxData, refetch: mailboxRefetch } = useMailboxQuery({
    variables: {
      request: {
        userLabels: currentQuickAliasLabel ? [currentQuickAliasLabel.value] : undefined,
        cursor: null,
        limit: DEFAULT_MAILBOX_LIMIT,
        polling: false,
        filters: null,
        isAliasInbox: false,
        clientsideFiltersApplied: true,
        // include trashed mail in stats for senders and mail received;
        // important info on sender behavior
        noExcludedLabel: true
      }
    },
    skip: !currentQuickAliasLabel,
    notifyOnNetworkStatusChange: true
  });

  const openOptionDropdown = () => {
    setShowOptionDropdown(true);
  };

  useEffect(() => {
    void mailboxRefetch();
    void refetchUserLabels();
  }, [currentQuickAliasLabel?.value, mailboxRefetch, refetchUserLabels]);

  const currentQuickAliasMailbox = mailboxData?.mailbox;
  const senders = getSenders(currentQuickAliasMailbox?.threads as UserThread[]);
  const numSenders = senders.length;

  const numEmails = currentQuickAliasMailbox?.threads.reduce((acc, thread) => acc + thread.emails.length, 0) || 0;

  const [updateQuickAliasInfo] = useUpdateQuickAliasInfoMutation();
  const overflowButtonRef = useRef<HTMLDivElement>(null);

  const emailAlias = selectedQuickAlias?.emailAlias;

  const emailAliasRef = useRef(emailAlias);
  const displayNameValueRef = useRef(displayNameValue);
  const selectedQuickAliasRef = useRef(selectedQuickAlias);
  const enablePushRef = useRef(enablePush);
  const colorValueRef = useRef(colorValue);
  const notesRef = useRef(notes);

  emailAliasRef.current = emailAlias;
  displayNameValueRef.current = displayNameValue;
  selectedQuickAliasRef.current = selectedQuickAlias;
  enablePushRef.current = enablePush;
  colorValueRef.current = colorValue;
  notesRef.current = notes;

  const handleUpdate = async () => {
    const currentEmailAlias = emailAliasRef.current;
    const currentDisplayNameValue = displayNameValueRef.current;
    const currentSelectedQuickAlias = selectedQuickAliasRef.current;
    const currentEnablePush = enablePushRef.current;
    const currentColorValue = colorValueRef.current;
    const currentNotes = notesRef.current;

    if (!emailAlias) return;

    const { decryptedSessionKey } = currentSelectedQuickAlias || {};

    const quickAliasSessionsKey = !!decryptedSessionKey ? decryptedSessionKey : generateSymmetricKey();
    const quickAliasEncryptedData = !!currentNotes
      ? encryptDatagramV2(
          EncryptedAliasDataDatagram,
          {},
          {
            note: currentNotes
          },
          quickAliasSessionsKey
        )
      : null;
    const encryptedKey = quickAliasEncryptedData
      ? stringEncryptAsymmetric(userData.privateUserData.privateKey || '', userData.publicKey, quickAliasSessionsKey)
      : null;
    await updateQuickAliasInfo({
      variables: {
        request: {
          emailAlias: currentEmailAlias,
          displayName: currentDisplayNameValue,
          encryptedAliasData: quickAliasEncryptedData?.encryptedData,
          encryptedSessionKey: encryptedKey || undefined,
          encryptedByKey: quickAliasEncryptedData ? userData.publicKey.key : undefined,
          areNotificationsEnabled: currentEnablePush,
          displayPictureData: {
            profileCustomURI: null,
            profileIcon: null,
            profileAccentColor: currentColorValue
          }
        }
      }
    });
    void refetch();
  };

  const debouncedUpdateRef = useRef(
    debounce(() => {
      void handleUpdate();
    }, 150)
  );

  const debouncedUpdate = () => debouncedUpdateRef.current();

  const onCopy = () => {
    if (!selectedQuickAlias) {
      return;
    }
    void navigator.clipboard.writeText(selectedQuickAlias.emailAlias);
    enqueueToast({
      title: 'Copied to clipboard',
      body: `Copied ${selectedQuickAlias.emailAlias} to clipboard`
    });
  };

  useEffect(() => {
    setIsSenderExpanded(false);
    return () => {
      setIsSenderExpanded(false);
    };
  }, [selectedQuickAlias]);

  const viewMail = () => {
    const addressFilter: MailboxSearchFilter = {
      type: MailboxSearchFilterType.TO,
      addressObj: { address: selectedQuickAlias.emailAlias }
    };
    searchInSearchRoute('', [addressFilter]);
    setShowOptionDropdown(false);
    closeOpenModal();
    closeSettings();
  };

  return (
    <Container>
      <Header>
        <IconText
          color='secondary'
          onClick={() => {
            setSelectedQuickAlias(undefined);
          }}
          startIcon={Icon.Close}
        />
        <RightSection>
          {isDisabled && <MonoTag color='disabled' label='Disabled' />}
          <IconText color='secondary' onClick={openOptionDropdown} ref={overflowButtonRef} startIcon={Icon.OverflowH} />
        </RightSection>
      </Header>
      <QuickAliasDropdown
        buttonRef={overflowButtonRef}
        quickAlias={selectedQuickAlias}
        setShowOptionDropdown={setShowOptionDropdown}
        showOptionDropdown={showOptionDropdown}
      />
      <QuickAliasRight>
        <ColorSection>
          <Avatar
            color={colorValue || (colorName as AccentColor) || ('orange' as AccentColor)}
            label={selectedQuickAlias?.displayName || selectedQuickAlias.emailAlias}
            size={Size.LARGE}
          />
          <ColorSelectContainer>
            <ColorSelector
              colorToStyling={accentColorToPrimaryColor}
              disabled={isDisabled}
              handleChange={(color) => {
                setColorValue(color as AccentColor);
                void debouncedUpdate();
              }}
              value={colorValue || (colorName as AccentColor) || ('orange' as AccentColor)}
            />
          </ColorSelectContainer>
        </ColorSection>
        <FieldsContainer>
          <HeaderInput>
            <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase weight={TypographyWeight.MEDIUM}>
              Email
            </Typography>
            <InputField
              disabled={isDisabled}
              endAdornment={<IconText onClick={onCopy} startIcon={Icon.Copy} />}
              onChange={() => {}}
              value={selectedQuickAlias.emailAlias}
            />
          </HeaderInput>
          <HeaderInput>
            <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase weight={TypographyWeight.MEDIUM}>
              Display name
            </Typography>
            <InputField
              disabled={isDisabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDisplayNameValue(e.target.value);
                void debouncedUpdate();
              }}
              placeholder='Add a display name'
              value={displayNameValue}
            />
          </HeaderInput>
          <HeaderInput>
            <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase weight={TypographyWeight.MEDIUM}>
              Alias info
            </Typography>
            <StatContainer $hide={!numEmails}>
              {!!numEmails && (
                <>
                  <IconText
                    color='secondary'
                    label={`${numEmails.toLocaleString()} ${pluralize('email', numEmails)} received`}
                    startIcon={Icon.Envelope}
                    weight={TypographyWeight.REGULAR}
                  />
                  <IconText label='View mail' onClick={viewMail} variant={FilledVariant.FILLED} />
                </>
              )}
            </StatContainer>
            <StatContainer
              $clickable={!isSenderExpanded}
              $hide={!numSenders}
              onClick={() => {
                if (isSenderExpanded) return;
                setIsSenderExpanded(true);
              }}
            >
              {!!numSenders && (
                <SenderList>
                  <ExpandableTitle>
                    <IconText
                      color='secondary'
                      label={`${numSenders.toLocaleString()} ${pluralize('sender', numSenders)}`}
                      startIcon={Icon.UserCircle}
                      weight={TypographyWeight.REGULAR}
                    />
                    <IconText
                      onClick={() => {
                        setIsSenderExpanded(!isSenderExpanded);
                      }}
                      startIcon={isSenderExpanded ? Icon.ChevronDown : Icon.ChevronRight}
                    />
                  </ExpandableTitle>
                  {isSenderExpanded && (
                    <>
                      <Divider />
                      {senders.map((sender) => {
                        return <QuickAliasSelectedSenderRow key={sender.address} sender={sender} />;
                      })}
                    </>
                  )}
                </SenderList>
              )}
            </StatContainer>
          </HeaderInput>
          <HeaderInput>
            <LabelRow>
              <Icons color='disabled' icon={Icon.Lock} size={Size.X_SMALL} tooltip='End-to-end encrypted' />

              <Typography
                color='disabled'
                mono
                size={TypographySize.CAPTION}
                uppercase
                weight={TypographyWeight.MEDIUM}
              >
                Notes
              </Typography>
            </LabelRow>
            <TextArea
              disabled={isDisabled}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setNotes(e.target.value);
                void debouncedUpdate();
              }}
              placeholder='Add note'
              typographySize={TypographySize.LARGE}
              value={notes}
            />
          </HeaderInput>
          <HeaderInput>
            <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase weight={TypographyWeight.MEDIUM}>
              Notifications
            </Typography>
            <TitleToggle>
              <Typography color='secondary'>Push notifications</Typography>
              <Toggle
                checked={enablePush}
                disabled={isDisabled}
                onChange={() => {
                  setEnablePush(!enablePush);
                  void debouncedUpdate();
                }}
              />
            </TitleToggle>
          </HeaderInput>
        </FieldsContainer>
      </QuickAliasRight>
    </Container>
  );
}
