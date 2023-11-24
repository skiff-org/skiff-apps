import { isMobile } from 'react-device-detect';
import { SubscriptionPlan } from 'skiff-graphql';
import { PaywallErrorCode } from 'skiff-utils';
import { SUPPORT_EMAIL } from 'skiff-utils';

import { HIGHEST_TIER } from '../constants/plans.constants';

export function getPaywallDescription(
  paywallErrorCode: PaywallErrorCode,
  currentSubscription: SubscriptionPlan
): string {
  const isOnHighestTier = currentSubscription === HIGHEST_TIER;
  const isOnFreeTier = currentSubscription === SubscriptionPlan.Free;
  const sharedLowerTierPrefix = `Upgrade your plan ${isMobile ? 'on desktop ' : ''}to`;
  const sharedHighestTierSuffix = ` Please contact ${SUPPORT_EMAIL} to discuss raising your limit.`;
  switch (paywallErrorCode) {
    case PaywallErrorCode.UploadLimit:
      return isOnHighestTier
        ? `You've exceeded the max upload size.${sharedHighestTierSuffix}`
        : `${sharedLowerTierPrefix} increase your maximum upload size.`;
    case PaywallErrorCode.AliasLimit:
      return isOnHighestTier
        ? `You have the max number of skiff.com aliases.${sharedHighestTierSuffix}`
        : `${sharedLowerTierPrefix} get access to more aliases.`;
    case PaywallErrorCode.ShortAlias:
      return isOnHighestTier
        ? `You have the max number of short aliases.${sharedHighestTierSuffix}`
        : `${sharedLowerTierPrefix} use ${isOnFreeTier ? '' : 'more '}short aliases.`;
    case PaywallErrorCode.CustomDomainLimit:
      return isOnHighestTier
        ? `You've added the max number of custom domains.${sharedHighestTierSuffix}`
        : `${sharedLowerTierPrefix} to add ${isOnFreeTier ? '' : 'more '}custom domains.`;
    case PaywallErrorCode.StorageLimit:
      return isOnHighestTier
        ? `You've reached the max storage limit.${sharedHighestTierSuffix}`
        : `${sharedLowerTierPrefix} use more storage.`;
    case PaywallErrorCode.UserFolderLimit: // no limit for highest tier
      return `${sharedLowerTierPrefix} create more custom folders.`;
    case PaywallErrorCode.UserLabelLimit: // no limit for highest tier
      return `${sharedLowerTierPrefix} create more custom labels.`;
    case PaywallErrorCode.SecuredBySkiffSig: // not relevant to highest tier
      return `${sharedLowerTierPrefix} remove the default signature.`;
    case PaywallErrorCode.MessageLimit:
      return `${sharedLowerTierPrefix} increase your sending limit.`; // no advertised limit for highest tier
    case PaywallErrorCode.WorkspaceUserLimit: // no practical limit for highest tier
      return `${sharedLowerTierPrefix} invite more collaborators to your workspace.`;
    case PaywallErrorCode.AutoReply: // not relevant to highest tier
      return `${sharedLowerTierPrefix} use auto-replies.`;
    case PaywallErrorCode.MailFilterLimit: // no limit for highest tier
      return `${sharedLowerTierPrefix} add more custom mail filters.`;
    case PaywallErrorCode.CatchallAlias: // not relevant for highest tier
      return `${sharedLowerTierPrefix} set a catch-all alias`;
    case PaywallErrorCode.EditAliasDisplayInfo:
      return `${sharedLowerTierPrefix} edit your alias display info.`;
    case PaywallErrorCode.AnonymousSubdomain:
      return `${sharedLowerTierPrefix} add more anonymous subdomains.`;
  }
}

export function getPaywallTitle(paywallErrorCode: PaywallErrorCode): string {
  switch (paywallErrorCode) {
    case PaywallErrorCode.UploadLimit:
      return 'File too large';
    case PaywallErrorCode.AliasLimit:
      return 'Alias limit reached';
    case PaywallErrorCode.ShortAlias:
      return 'Alias too short';
    case PaywallErrorCode.CustomDomainLimit:
      return 'Custom domain limit reached';
    case PaywallErrorCode.StorageLimit:
      return 'Storage limit reached';
    case PaywallErrorCode.UserFolderLimit:
      return 'Custom folder limit reached';
    case PaywallErrorCode.UserLabelLimit:
      return 'Custom label limit reached';
    case PaywallErrorCode.MessageLimit:
      return 'Daily sending message limit reached';
    case PaywallErrorCode.WorkspaceUserLimit:
      return 'Collaborator limit reached';
    case PaywallErrorCode.MailFilterLimit:
      return 'Mail filter limit reached';
    case PaywallErrorCode.AnonymousSubdomain:
      return 'Anonymous subdomain limit reached';
    case PaywallErrorCode.SecuredBySkiffSig:
    case PaywallErrorCode.AutoReply:
    case PaywallErrorCode.CatchallAlias:
    case PaywallErrorCode.EditAliasDisplayInfo:
      return 'Not available on free plan';
  }
}
