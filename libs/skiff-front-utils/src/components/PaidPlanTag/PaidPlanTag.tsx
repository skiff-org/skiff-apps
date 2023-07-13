import { MonoTag, ThemeMode } from '@skiff-org/skiff-ui';
import { SubscriptionPlan } from 'skiff-graphql';

import { MONO_TYPE_TAG_STYLES_BY_PLAN } from '../../constants';
import { useTheme } from '../../theme/AppThemeProvider';
import { getTierTitle } from '../../utils/planUtils';

interface PaidPlanTagProps {
  subscriptionPlan: SubscriptionPlan;
}

export default function PaidPlanTag({ subscriptionPlan }: PaidPlanTagProps) {
  const { theme } = useTheme();
  const tagStyles = MONO_TYPE_TAG_STYLES_BY_PLAN[subscriptionPlan];
  const forceBoxShadowTheme = subscriptionPlan === SubscriptionPlan.Business && theme;
  // Force inverse theme for the Business tag
  const forceTheme =
    subscriptionPlan === SubscriptionPlan.Business && (theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK);

  return (
    <MonoTag
      bgColor={tagStyles.bgColor}
      color={tagStyles.color}
      forceBoxShadowTheme={forceBoxShadowTheme || undefined}
      forceTheme={forceTheme || undefined}
      label={getTierTitle(subscriptionPlan)}
      textColor={tagStyles.textColor}
    />
  );
}
