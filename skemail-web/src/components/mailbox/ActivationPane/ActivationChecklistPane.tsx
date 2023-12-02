import {
  Divider,
  Icon,
  Icons,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight,
  getThemedColor
} from 'nightwatch-ui';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetCreditsQuery, useGetCurrentUserCustomDomainsQuery } from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  MAIL_MOBILE_APP_DOWNLOAD_LINK,
  SKIFF_PUBLIC_WEBSITE_DOWNLOAD,
  SettingValue,
  TabPage,
  UserPreferenceKey,
  getCreditCentsForInfoType,
  useCurrentUserEmailAliases,
  useGetFF,
  useRequiredCurrentUserData,
  useToast,
  useUserPreference
} from 'skiff-front-utils';
import { CreditInfo, EntityType, SubscriptionInterval, SubscriptionPlan, WorkspaceEventType } from 'skiff-graphql';
import { FreeCustomDomainFeatureFlag, getCategorizedAliases } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { getCheckoutSessionOrUpdatePlan } from '../../../utils/paymentUtils';
import { storeWorkspaceEvent } from '../../../utils/userUtils';
import { useSettings } from '../../Settings/useSettings';

import ActivationChecklist, { ActivationChecklistItem, ActivationPromo, ActivationTask } from './ActivationChecklist';

const ActivationChecklistSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
`;

const ActivationChecklistHeaderAndBody = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${getThemedColor('var(--border-secondary)', ThemeMode.DARK)};
  border-radius: 8px;
`;

const ActivationChecklistHeader = styled.div<{ complete?: boolean }>`
  padding: 8px;
  display: flex;
  gap: 16px;
  background: ${(props) =>
    props.complete
      ? getThemedColor('var(--accent-blue-primary)', ThemeMode.DARK)
      : getThemedColor('var(--bg-overlay-tertiary)', ThemeMode.DARK)};
  border-radius: 8px 8px 0 0;
  align-items: center;
  user-select: none;
  ${(props) =>
    props.complete &&
    css`
      cursor: pointer;
    `}
`;

const HeaderAdornment = styled.div`
  margin-left: auto;
`;

const InnerText = styled.div`
  :hover {
    color: ${getThemedColor('var(--text-secondary)', ThemeMode.DARK)} !important;
  }
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

const activationPromoItems = ({
  openCustomDomainSearchModal,
  openConfigureDomainSetting
}: {
  openCustomDomainSearchModal: () => void;
  openConfigureDomainSetting: () => void;
}): ActivationChecklistItem[] => [
  {
    task: ActivationPromo.BUY_DOMAIN,
    title: 'Get a custom domain',
    onClick: openCustomDomainSearchModal
  },
  {
    task: ActivationPromo.TRANSFER_DOMAIN,
    title: 'Use an existing domain for free',
    onClick: openConfigureDomainSetting
  }
];

interface ActivationChecklistPaneProps {
  onOpenShortcuts: () => void;
}

const ActivationChecklistPane: React.FC<ActivationChecklistPaneProps> = ({
  onOpenShortcuts
}: ActivationChecklistPaneProps) => {
  const { userID, recoveryEmail } = useRequiredCurrentUserData();
  const { openSettings } = useSettings();
  const { emailAliases } = useCurrentUserEmailAliases();
  const [, setHideActivationChecklist] = useUserPreference(UserPreferenceKey.HIDE_ACTIVATION_CHECKLIST);
  const { nonCryptoAliases } = getCategorizedAliases(emailAliases);
  const { enqueueToast } = useToast();
  const hasFreeCustomDomainFlag = useGetFF<FreeCustomDomainFeatureFlag>('freeCustomDomain');
  const { data: customDomainData } = useGetCurrentUserCustomDomainsQuery();
  const customDomains = customDomainData?.getCurrentUserCustomDomains.domains;
  const hasCustomDomain = !!customDomains?.length;

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
  const openCustomDomainSearchModal = () =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.SearchCustomDomain
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
    openAliasesTab: () => openSettings({ tab: TabPage.Addresses, setting: SettingValue.AddEmailAlias })
  });

  // additional CTA's on the checklist pane that do NOT need to be completed to redeem the free trial
  const promoItems = activationPromoItems({
    openCustomDomainSearchModal,
    openConfigureDomainSetting: () =>
      openSettings({ tab: TabPage.CustomDomains, setting: SettingValue.CustomDomainSetup })
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
    <>
      <ActivationChecklistSection>
        <ActivationChecklistHeaderAndBody>
          <ActivationChecklistHeader
            complete={allItemsComplete}
            onClick={allItemsComplete ? checkoutWithTrial : undefined}
          >
            <Typography color={allItemsComplete ? 'black' : 'white'} weight={TypographyWeight.MEDIUM}>
              {allItemsComplete
                ? 'Redeem your free Skiff Essential trial now'
                : 'Complete to get 2 months of Skiff Essential'}
            </Typography>
            {allItemsComplete && (
              <HeaderAdornment>
                <Icons forceTheme={ThemeMode.LIGHT} icon={Icon.ChevronRight} />
              </HeaderAdornment>
            )}
          </ActivationChecklistHeader>
          <ActivationChecklist items={checklistItems} />
        </ActivationChecklistHeaderAndBody>
        {/* only show the custom domain promo to those who don't yet have a custom domain */}
        {!hasCustomDomain && hasFreeCustomDomainFlag && (
          <ActivationChecklistHeaderAndBody>
            <ActivationChecklistHeader>
              <Typography color='white' weight={TypographyWeight.MEDIUM}>
                Use a custom domain
              </Typography>
              <HeaderAdornment>
                <Typography color='link' forceTheme={ThemeMode.DARK} mono size={TypographySize.SMALL} uppercase>
                  exclusive offer
                </Typography>
              </HeaderAdornment>
            </ActivationChecklistHeader>
            <ActivationChecklist items={promoItems} />
          </ActivationChecklistHeaderAndBody>
        )}
        <Typography
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
          <InnerText>Permanently hide tutorial list</InnerText>
        </Typography>
      </ActivationChecklistSection>
      <Divider color='secondary' forceTheme={ThemeMode.DARK} />
      <ActivationChecklistSection>
        <Typography color='disabled' forceTheme={ThemeMode.DARK} onClick={onOpenShortcuts}>
          <InnerText>Keyboard shortcuts</InnerText>
        </Typography>
      </ActivationChecklistSection>
    </>
  );
};

export default ActivationChecklistPane;
