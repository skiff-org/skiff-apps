import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ANDROID_DOWNLOAD_BASE_CREDITS_PROMPT,
  ANDROID_MAIL_APP_URL,
  CreditManagement,
  CreditPromptProps,
  getCreditCentsForInfoType,
  GITHUB_APP_URL,
  INVITE_BASE_CREDITS_PROMPT,
  IOS_DOWNLOAD_BASE_CREDITS_PROMPT,
  IPHONE_MAIL_APP_URL,
  MAC_DOWNLOAD_BASE_CREDITS_PROMPT
} from 'skiff-front-utils';
import { CreditInfo, EntityType } from 'skiff-graphql';
import { useGetCreditsQuery } from 'skiff-mail-graphql';
import { MAX_CREDIT_FOR_REFERRALS } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import SkemailApplyCreditsModal from '../../modals/SkemailApplyCreditsModal';

/**
 * This component is a wrapper around the CreditManagement component
 * in skiff-front-utils and handles/provides all needed Skemail specific logic (graphql, redux, etc)
 */
const SkemailCreditManagement: React.FC = () => {
  const { userID } = useRequiredCurrentUserData();
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Redux
  const dispatch = useDispatch();
  const openReferUsersModal = () => dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.InviteUsers }));

  // Fetch users credit info
  const { data, loading } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [
          CreditInfo.CurrentCredits,
          CreditInfo.CreditsFromReferrals,
          CreditInfo.CreditsFromIosApp,
          CreditInfo.CreditsFromAndroidApp,
          CreditInfo.CreditsFromMacApp
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

  const creditPrompts: CreditPromptProps[] = [
    // Invite friends
    {
      ...INVITE_BASE_CREDITS_PROMPT,
      complete: earnedMaxReferralCredits,
      onActionClick: openReferUsersModal
    },
    // Download iOS app
    {
      ...IOS_DOWNLOAD_BASE_CREDITS_PROMPT,
      complete: earnedIosCredit,
      onActionClick: () => window.open(IPHONE_MAIL_APP_URL, '_blank')
    },
    // Download Android app
    {
      ...ANDROID_DOWNLOAD_BASE_CREDITS_PROMPT,
      complete: earnedAndroidCredit,
      onActionClick: () => window.open(ANDROID_MAIL_APP_URL, '_blank')
    },
    // Download Mac app
    {
      ...MAC_DOWNLOAD_BASE_CREDITS_PROMPT,
      complete: earnedMacCredit,
      onActionClick: () => window.open(GITHUB_APP_URL, '_blank')
    }
  ];

  return (
    <>
      <CreditManagement
        creditPrompts={creditPrompts}
        currentCreditCents={currentCreditCents}
        loading={loading}
        openApplyCreditsModal={() => setApplyModalOpen(true)}
      />
      {/* Render this modal here and not in Layout so that it doesn't close the Settings modal when opened */}
      <SkemailApplyCreditsModal closeModal={() => setApplyModalOpen(false)} open={applyModalOpen} />
    </>
  );
};

export default SkemailCreditManagement;
