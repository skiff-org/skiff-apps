import {
  Divider,
  getThemedColor,
  Icon,
  Icons,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetCreditsQuery } from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  getCreditCentsForInfoType,
  MAIL_MOBILE_APP_DOWNLOAD_LINK,
  SettingValue,
  SKIFF_PUBLIC_WEBSITE_DOWNLOAD,
  TabPage,
  useCurrentUserEmailAliases,
  useRequiredCurrentUserData,
  UserPreferenceKey,
  useToast,
  useUserPreference
} from 'skiff-front-utils';
import { CreditInfo, EntityType, SubscriptionInterval, SubscriptionPlan, WorkspaceEventType } from 'skiff-graphql';
import { getCategorizedAliases } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getCheckoutSessionOrUpdatePlan } from '../../../utils/paymentUtils';
import { storeWorkspaceEvent } from '../../../utils/userUtils';
import { useSettings } from '../../Settings/useSettings';

import ActivationChecklist, { ActivationChecklistItem, ActivationTask } from './ActivationChecklist';

const ActivationChecklistPaneContainer = styled.div`
  width: 440px;
  border-radius: 8px;
  border: 1px solid var(--border-secondary);
  box-shadow: var(--card-box-shadow);
  box-sizing: border-box;
  background: var(--bg-emphasis);
  box-shadow: var(--shadow-l3);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivationChecklistHeaderAndBody = styled.div`
  display: flex;
  padding: 8px 8px 0 8px;
  flex-direction: column;
  gap: 16px;
`;

const ActivationChecklistHeader = styled.div<{ complete?: boolean }>`
  padding: 16px;
  display: flex;
  gap: 16px;
  background: ${(props) =>
    props.complete
      ? getThemedColor('var(--accent-green-primary)', ThemeMode.DARK)
      : getThemedColor('var(--accent-blue-primary)', ThemeMode.DARK)};
  border-radius: 4px;
  align-items: center;
  user-select: none;
  ${(props) =>
    props.complete &&
    css`
      cursor: pointer;
    `}
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SuccessChevron = styled.div`
  margin-left: auto;
`;

const ActivationChecklistFooter = styled.div`
  display: flex;
  padding: 0 0 8px 20px;
  height: 24px;
`;

const SuccessIconContainer = styled.div`
  background: ${getThemedColor('var(--bg-overlay-primary)', ThemeMode.LIGHT)};
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid ${getThemedColor('var(--bg-overlay-primary)', ThemeMode.LIGHT)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const activationChecklistItems = ({
  mobileAppCreditsEarned,
  importMailCreditsEarned,
  recoveryEmail,
  nonCryptoAliases,
  openMailImportModal,
  openQrCodeModal,
  openAccountTab,
  openAliasesTab
}: {
  mobileAppCreditsEarned: number;
  importMailCreditsEarned: number;
  recoveryEmail: string | null | undefined;
  nonCryptoAliases: string[];
  openMailImportModal: () => void;
  openQrCodeModal: () => void;
  openAccountTab: () => void;
  openAliasesTab: () => void;
}): ActivationChecklistItem[] => [
  {
    task: ActivationTask.DOWNLOAD_APP,
    title: 'Log into the Skiff mobile app',
    complete: mobileAppCreditsEarned > 0,
    onClick: openQrCodeModal
  },
  {
    task: ActivationTask.ADD_RECOVERY_EMAIL,
    title: 'Add a recovery email',
    complete: !!recoveryEmail,
    onClick: openAccountTab
  },
  {
    task: ActivationTask.IMPORT_MAIL,
    title: 'Import email from Gmail or Outlook',
    complete: importMailCreditsEarned > 0,
    onClick: openMailImportModal
  },
  {
    task: ActivationTask.ADD_ALIAS,
    title: 'Add an email alias',
    complete: nonCryptoAliases.length > 1,
    onClick: openAliasesTab
  }
];
const ActivationChecklistPane: React.FC = () => {
  const { userID, recoveryEmail } = useRequiredCurrentUserData();
  const { openSettings } = useSettings();
  const emailAliases = useCurrentUserEmailAliases();
  const [, setHideActivationChecklist] = useUserPreference(UserPreferenceKey.HIDE_ACTIVATION_CHECKLIST);
  const { nonCryptoAliases } = getCategorizedAliases(emailAliases);
  const { enqueueToast } = useToast();

  // Redux
  const dispatch = useDispatch();
  const openQrCodeModal = () =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.QrCode,
        title: 'Get the Skiff Mail mobile app',
        description: 'Available on iOS and Android',
        link: MAIL_MOBILE_APP_DOWNLOAD_LINK,
        buttonProps: {
          label: 'View all downloads',
          onClick: () => window.open(SKIFF_PUBLIC_WEBSITE_DOWNLOAD, '_blank')
        }
      })
    );

  // Fetch user's credit info
  const { data } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [
          CreditInfo.CreditsFromIosApp,
          CreditInfo.CreditsFromAndroidApp,
          CreditInfo.CreditsFromOutlookImport,
          CreditInfo.CreditsFromGmailImport
        ]
      }
    }
  });

  const { credits: creditsResponse } = data || {};
  const creditInfo = creditsResponse?.credits || [];

  const creditsEarnedFromIos = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromIosApp) ?? 0;
  const creditsEarnedFromAndroid = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromAndroidApp) ?? 0;
  const creditsEarnedFromOutlookImport =
    getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromOutlookImport) ?? 0;
  const creditsEarnedFromGmailImport = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromGmailImport) ?? 0;

  const mobileAppCreditCentsEarned = creditsEarnedFromIos + creditsEarnedFromAndroid;
  const importMailCreditsEarned = creditsEarnedFromOutlookImport + creditsEarnedFromGmailImport;

  const checklistItems = activationChecklistItems({
    mobileAppCreditsEarned: mobileAppCreditCentsEarned,
    importMailCreditsEarned: importMailCreditsEarned,
    recoveryEmail,
    nonCryptoAliases,
    openMailImportModal: () => openSettings({ tab: TabPage.Import }),
    openQrCodeModal,
    openAccountTab: () => openSettings({ tab: TabPage.Account }),
    openAliasesTab: () => openSettings({ tab: TabPage.Aliases, setting: SettingValue.AddEmailAlias })
  });

  const checkoutWithTrial = async () => {
    void storeWorkspaceEvent(WorkspaceEventType.ActivationChecklistStartCheckout, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    // backend will add trial to checkout session if user eligible;
    // default to monthly, since they can upgrade in cart
    const checkoutPortal = await getCheckoutSessionOrUpdatePlan(
      SubscriptionPlan.Essential,
      SubscriptionInterval.Monthly,
      window.location.href
    );
    if (checkoutPortal.url) {
      window.location.href = checkoutPortal.url;
    } else {
      enqueueToast({
        title: 'Failed to start your trial',
        body: 'Please try again later.'
      });
    }
  };

  const allItemsComplete = checklistItems.every((item) => item.complete);

  return (
    <ActivationChecklistPaneContainer>
      <ActivationChecklistHeaderAndBody>
        <ActivationChecklistHeader
          complete={allItemsComplete}
          onClick={allItemsComplete ? checkoutWithTrial : undefined}
        >
          {allItemsComplete && (
            <SuccessIconContainer>
              <Icons forceTheme={ThemeMode.LIGHT} icon={Icon.Gift} size={Size.X_MEDIUM} />
            </SuccessIconContainer>
          )}
          <HeaderText>
            <Typography mono uppercase color='black' size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM} wrap>
              {allItemsComplete ? 'Redeem your free trial now' : 'Get 2 months of Skiff Essential'}
            </Typography>
            <Typography mono uppercase color='black' wrap>
              {allItemsComplete
                ? 'You earned 2 months of Skiff Essential!'
                : 'Complete these tasks to unlock 15 GB of storage, a custom domain, and unlimited mail filters.'}
            </Typography>
          </HeaderText>
          {allItemsComplete && (
            <SuccessChevron>
              <Icons forceTheme={ThemeMode.LIGHT} icon={Icon.ChevronRight} size={Size.X_MEDIUM} />
            </SuccessChevron>
          )}
        </ActivationChecklistHeader>
        <ActivationChecklist allItemsComplete={allItemsComplete} items={checklistItems} />
      </ActivationChecklistHeaderAndBody>
      <Divider color='primary' forceTheme={ThemeMode.DARK} />
      <ActivationChecklistFooter>
        <Typography
          mono
          uppercase
          color='disabled'
          forceTheme={ThemeMode.DARK}
          onClick={() => {
            setHideActivationChecklist(true);
            void storeWorkspaceEvent(
              WorkspaceEventType.ActivationChecklistPermanentlyHide,
              '',
              DEFAULT_WORKSPACE_EVENT_VERSION
            );
          }}
        >
          Never show again
        </Typography>
      </ActivationChecklistFooter>
    </ActivationChecklistPaneContainer>
  );
};

export default ActivationChecklistPane;
