import { useDispatch } from 'react-redux';
import { useGetCreditsQuery } from 'skiff-front-graphql';
import {
  ANDROID_DOWNLOAD_BASE_CREDITS_PROMPT,
  ANDROID_MAIL_APP_URL,
  CreditManagement,
  CreditPromptProps,
  DESKTOP_DOWNLOAD_BASE_CREDITS_PROMPT,
  GITHUB_APP_URL,
  IMPORT_MAIL_BASE_CREDITS_PROMPT,
  INVITE_BASE_CREDITS_PROMPT,
  IOS_DOWNLOAD_BASE_CREDITS_PROMPT,
  IPHONE_MAIL_APP_URL,
  SettingValue,
  TabPage,
  getCreditCentsForInfoType,
  isMobileApp,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { CreditInfo, EntityType } from 'skiff-graphql';
import { MAX_CREDIT_FOR_REFERRALS, insertIf } from 'skiff-utils';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { useSettings } from '../useSettings';

/**
 * This component is a wrapper around the CreditManagement component
 * in skiff-front-utils and handles/provides all needed Skemail specific logic (graphql, redux, etc)
 */
const SkemailCreditManagement: React.FC = () => {
  const { userID } = useRequiredCurrentUserData();
  const { openSettings } = useSettings();

  // Redux
  const dispatch = useDispatch();
  const openReferUsersModal = () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.InviteUsers }));
  const openImportTab = () => openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });

  // Fetch users credit info
  const {
    data,
    loading,
    refetch: refetchCredits
  } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [
          CreditInfo.CurrentCredits,
          CreditInfo.CreditsFromReferrals,
          CreditInfo.CreditsFromIosApp,
          CreditInfo.CreditsFromAndroidApp,
          CreditInfo.CreditsFromMacApp,
          CreditInfo.CreditsFromGmailImport,
          CreditInfo.CreditsFromOutlookImport
        ]
      }
    }
  });

  const { credits: creditsResponse } = data || {};
  const creditInfo = creditsResponse?.credits || [];

  // Current Credits
  const currentCreditCents = getCreditCentsForInfoType(creditInfo, CreditInfo.CurrentCredits) ?? 0;

  // Referrals
  const centsEarnedFromReferrals = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromReferrals) ?? 0;
  const earnedMaxReferralCredits = centsEarnedFromReferrals >= MAX_CREDIT_FOR_REFERRALS.cents;

  /** One time credit opportunities */

  // iOS App
  const centsEarnedFromIosApp = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromIosApp) ?? 0;
  const earnedIosCredit = centsEarnedFromIosApp > 0;

  // Android app
  const centsEarnedFromAndroidApp = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromAndroidApp) ?? 0;
  const earnedAndroidCredit = centsEarnedFromAndroidApp > 0;

  // Mac app
  const centsEarnedFromMacApp = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromMacApp) ?? 0;
  const earnedMacCredit = centsEarnedFromMacApp > 0;

  // Gmail import
  const centsEarnedFromGmailImport = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromGmailImport) ?? 0;
  const earnedGmailImportCredit = centsEarnedFromGmailImport > 0;

  // Outlook import
  const centsEarnedFromOutlookImport = getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromOutlookImport) ?? 0;
  const earnedOutlookImportCredit = centsEarnedFromOutlookImport > 0;

  //General mail import
  const earnedMailImportCredit = earnedGmailImportCredit || earnedOutlookImportCredit;

  const creditPrompts: CreditPromptProps[] = [
    // Invite friends
    {
      ...INVITE_BASE_CREDITS_PROMPT,
      complete: earnedMaxReferralCredits,
      onActionClick: openReferUsersModal
    },
    // Download iOS app
    ...insertIf(!isMobileApp() || earnedIosCredit, {
      ...IOS_DOWNLOAD_BASE_CREDITS_PROMPT,
      complete: earnedIosCredit,
      onActionClick: () => window.open(IPHONE_MAIL_APP_URL, '_blank')
    }),
    // Download Android app
    ...insertIf(!isMobileApp() || earnedAndroidCredit, {
      ...ANDROID_DOWNLOAD_BASE_CREDITS_PROMPT,
      complete: earnedAndroidCredit,
      onActionClick: () => window.open(ANDROID_MAIL_APP_URL, '_blank')
    }),
    // Download Desktop app
    ...insertIf(earnedMacCredit, {
      ...DESKTOP_DOWNLOAD_BASE_CREDITS_PROMPT,
      complete: earnedMacCredit,
      onActionClick: () => window.open(GITHUB_APP_URL(), '_blank')
    }),
    // Import mail (technically possible to be rewarded for both outlook and gmail, but we present as a single action encompassing both)
    ...insertIf(!isMobileApp() || earnedMailImportCredit, {
      ...IMPORT_MAIL_BASE_CREDITS_PROMPT,
      complete: earnedMailImportCredit,
      onActionClick: openImportTab
    })
  ];

  const openPlansTab = () => {
    openSettings({ tab: TabPage.Plans });
  };

  return (
    <>
      <CreditManagement
        creditPrompts={creditPrompts}
        currentCreditCents={currentCreditCents}
        loading={loading}
        openPlansTab={openPlansTab}
        refetchCredits={refetchCredits}
      />
    </>
  );
};

export default SkemailCreditManagement;
