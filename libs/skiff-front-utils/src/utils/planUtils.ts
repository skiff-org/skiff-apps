import { Type, Color, TextColor } from '@skiff-org/skiff-ui';
import pluralize from 'pluralize';
import {
  SubscriptionPlan,
  SubscriptionInterval,
  PlanRelation,
  isValidSubscriptionPlan,
  DowngradeProgress
} from 'skiff-graphql';
import { upperCaseFirstLetter, LIMITS_BY_TIER, TierName, MAXIMUM_STRIPE_PURCHASE_QUANTITY } from 'skiff-utils';

import { DowngradeTodoItemProps } from '../components/DowngradeTodoItem';
import { MONO_TYPE_TAG_STYLES_BY_PLAN, SPOTLIGHT_TEXT } from '../constants';
import { MONTHLY_PRICES_BY_SUBSCRIPTION_PLAN, FeatureData, PLAN_TABLE_COLUMN_WIDTHS } from '../constants';
import { EXPIRES_SOON_BUFFER_IN_MS } from '../constants';

import { getFormattedQuantifier, getFormattedStorage } from './copyUtils';
import { renderDate } from './dateUtils';
import { ALIAS_MINIMUM_LENGTH } from './emailUtils';

export const getTierPrice = (subscription: SubscriptionPlan, subscriptionInterval: SubscriptionInterval) => {
  return subscriptionInterval === SubscriptionInterval.Monthly
    ? MONTHLY_PRICES_BY_SUBSCRIPTION_PLAN[subscription].monthly
    : MONTHLY_PRICES_BY_SUBSCRIPTION_PLAN[subscription].yearly;
};

export const getTierTitle = (subscriptionPlan: SubscriptionPlan) => {
  return upperCaseFirstLetter(subscriptionPlan);
};

export const getSubscriptionIntervalTitle = (subscriptionInterval: SubscriptionInterval) => {
  return upperCaseFirstLetter(subscriptionInterval);
};

export const getTierLabel = (
  planRelation: PlanRelation,
  activeSubscription: SubscriptionPlan,
  isCryptoSubscription?: boolean
) => {
  switch (planRelation) {
    case PlanRelation.CURRENT: {
      const label =
        activeSubscription === SubscriptionPlan.Free || isCryptoSubscription ? 'Current plan' : 'Manage plan';
      return label;
    }
    case PlanRelation.DOWNGRADE: {
      return 'Downgrade';
    }
    case PlanRelation.UPGRADE: {
      return 'Upgrade';
    }
  }
};

export const getTierButtonType = (planRelation: PlanRelation) => {
  if (planRelation === PlanRelation.DOWNGRADE) return Type.DESTRUCTIVE;
  return Type.PRIMARY;
};

export const getExpiresSoonStatus = (supposedEndDate: Date, cancelAtPeriodEnd: boolean) => {
  return !!(cancelAtPeriodEnd && Date.now() > supposedEndDate.getTime() - EXPIRES_SOON_BUFFER_IN_MS);
};

export const getBillingCycleTextColor = (cancelAtPeriodEnd: boolean): TextColor => {
  return cancelAtPeriodEnd ? 'destructive' : 'secondary';
};

export const renderBillingCycleText = (supposedEndDate: Date, cancelAtPeriodEnd: boolean) => {
  const prefix = cancelAtPeriodEnd ? 'Expires ' : 'Renews ';
  return prefix + renderDate(supposedEndDate);
};

// reduces the record of FeatureData by tiers to only those supported for a given user (i.e. the record may contain experimental tiers)
export const reduceFeatureDataToSupportedTiers = (
  tiers: Record<SubscriptionPlan, FeatureData>,
  supportedTiers: SubscriptionPlan[]
) => {
  return Object.keys(tiers).reduce((obj: { [K in SubscriptionPlan]?: FeatureData }, key) => {
    if (isValidSubscriptionPlan(key) && supportedTiers.includes(key)) {
      obj[key] = tiers[key];
    }
    return obj;
  }, {});
};

// returns string specifying "grid-template-columns" CSS property for the plans table,
// which varies by the total number of tiers shown
export const getPlanTableColumnWidths = (showEssential?: boolean) => {
  const widths = Object.keys(PLAN_TABLE_COLUMN_WIDTHS).reduce((width, colNum) => {
    const col = Number(colNum);
    if (isNaN(col)) return '';
    return (width += ` ${
      showEssential ? PLAN_TABLE_COLUMN_WIDTHS[col].fourTiers : PLAN_TABLE_COLUMN_WIDTHS[col].threeTiers ?? ''
    }`);
  }, '');
  return widths.trim();
};

// Gets text to add under a Tier Button, e.g. a "Popular" tag or a "Per user" pricing specification
interface GetTierButtonSecondaryTextParams {
  subscriptionPlan: SubscriptionPlan;
  spotlightPlan: SubscriptionPlan;
}
export const getTierButtonSecondaryText = ({
  subscriptionPlan,
  spotlightPlan
}: GetTierButtonSecondaryTextParams): { color: Color; text: string } | undefined => {
  switch (subscriptionPlan) {
    case SubscriptionPlan.Business:
      return { color: 'disabled', text: 'per user' };
    case spotlightPlan:
      return {
        color:
          MONO_TYPE_TAG_STYLES_BY_PLAN[subscriptionPlan].color ??
          MONO_TYPE_TAG_STYLES_BY_PLAN[subscriptionPlan].textColor ??
          'primary',
        text: SPOTLIGHT_TEXT
      };
    default:
      return undefined;
  }
};

// For mapping to DowngradeTodoItem component
interface DowngradeTodoItemWithKey extends DowngradeTodoItemProps {
  key: string;
}

export const getDowngradeTodoItems = (
  tierToDowngradeTo: TierName,
  {
    currentStorageInMb,
    emailAliases,
    customDomains,
    shortAliases,
    workspaceUsers,
    userLabels,
    userFolders,
    userMailFilters
  }: DowngradeProgress
) => {
  const {
    maxStorageInMb,
    maxNumNonWalletAliases,
    maxCustomDomains,
    allowedNumShortAliases,
    maxUsersPerWorkspace,
    maxNumLabelsOrFolders,
    maxNumMailFilters
  } = LIMITS_BY_TIER[tierToDowngradeTo];

  // paid features whose limits are at or above this number are effectively unlimited and user does not need to make any changes to achieve eligibility on this feature
  const isTierToDowngradeToUnlimited = (quantity: number) => quantity >= MAXIMUM_STRIPE_PURCHASE_QUANTITY;
  const sharedPrefix = "You're all set on ";

  const todoItemPropsList: Array<DowngradeTodoItemWithKey> = [
    {
      key: 'downgrade-storage-limit',
      checked: currentStorageInMb <= maxStorageInMb,
      description: `You have used ${getFormattedStorage(currentStorageInMb)} of storage.`,
      title: `Delete files above the ${tierToDowngradeTo} plan's ${getFormattedStorage(maxStorageInMb)} limit`
    },
    {
      key: 'downgrade-alias-limit',
      checked: emailAliases <= maxNumNonWalletAliases,
      description: `You have ${emailAliases} @skiff.com ${pluralize('alias', emailAliases)}.`,
      title: `Delete email aliases until you have ${getFormattedQuantifier(maxNumNonWalletAliases)} left`
    },
    {
      key: 'downgrade-custom-domains-limit',
      checked: customDomains <= maxCustomDomains,
      description: `You have ${customDomains} ${pluralize('custom domain', customDomains)}.`,
      title: `Delete custom domains until you have ${getFormattedQuantifier(maxCustomDomains)} left`
    },
    {
      key: 'downgrade-short-alias-limit',
      checked: shortAliases <= allowedNumShortAliases,
      description: `You have ${shortAliases} @skiff.com ${pluralize(
        'alias',
        shortAliases
      )} with less than ${ALIAS_MINIMUM_LENGTH} characters.`,
      title: `Delete short aliases until you have ${getFormattedQuantifier(allowedNumShortAliases)} left`
    },
    {
      key: 'downgrade-workspace-users-limit',
      checked: workspaceUsers <= maxUsersPerWorkspace,
      description: `You have ${workspaceUsers} ${pluralize('user', workspaceUsers)} in your workspace.`,
      title: isTierToDowngradeToUnlimited(maxUsersPerWorkspace)
        ? `${sharedPrefix}workspace membership`
        : `Remove users from your workspace until you have ${getFormattedQuantifier(maxUsersPerWorkspace)} left`
    },
    {
      key: 'downgrade-user-folders-limit',
      checked: userFolders <= maxNumLabelsOrFolders,
      description: `You have ${userFolders} ${pluralize('folder', userFolders)}.`,
      title: isTierToDowngradeToUnlimited(maxNumLabelsOrFolders)
        ? `${sharedPrefix}folders`
        : `Delete folders until you have ${getFormattedQuantifier(maxNumLabelsOrFolders)} left`
    },
    {
      key: 'downgrade-user-labels-limit',
      checked: userLabels <= maxNumLabelsOrFolders,
      description: `You have ${userLabels} ${pluralize('label', userLabels)}.`,
      title: isTierToDowngradeToUnlimited(maxNumLabelsOrFolders)
        ? `${sharedPrefix}labels`
        : `Delete labels until you have ${getFormattedQuantifier(maxNumLabelsOrFolders)} left`
    },
    {
      key: 'downgrade-user-mail-filters-limit',
      checked: userMailFilters <= maxNumMailFilters,
      description: `You have ${userMailFilters} mail ${pluralize('filter', userMailFilters)}.`,
      title: isTierToDowngradeToUnlimited(maxNumMailFilters)
        ? `${sharedPrefix}mail filters`
        : `Delete mail filters until you have ${getFormattedQuantifier(maxNumMailFilters)} left`
    }
  ];
  return todoItemPropsList;
};
