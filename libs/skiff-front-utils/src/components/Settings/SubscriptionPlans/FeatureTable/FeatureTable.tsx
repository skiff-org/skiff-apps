import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
  Divider,
  Icon,
  Icons,
  Size,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipPlacement,
  TooltipTrigger,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { SubscriptionInterval, SubscriptionPlan, WorkspaceEventType } from 'skiff-graphql';
import { OnboardingUpsellFeatureFlag } from 'skiff-utils';
import styled from 'styled-components';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../../../constants';
import {
  FEATURE_TABLE_RESPONSIVE_BREAKPOINT,
  FeatureData,
  FeatureItem,
  allFeatures,
  narrowViewFeatures,
  subscriptionTiers
} from '../../../../constants/plans.constants';
import { useTheme } from '../../../../theme/AppThemeProvider';
import { getPlanTableColumnWidths, getTierTitle, reduceFeatureDataToSupportedTiers } from '../../../../utils';
import BillingCycleSwitch from '../BillingCycleSwitch/BillingCycleSwitch';
import TierButton from '../TierButton/TierButton';

import { useMediaQuery } from '../../../../hooks';
import FeatureTableColumnEnd from './FeatureTableColumnEnd';
import FeatureTableSectionHeader from './FeatureTableSectionHeader';

interface FeatureTableHeaderProps {
  subscription: SubscriptionPlan;
  subscriptionInterval: SubscriptionInterval;
  theme: ThemeMode;
  isUpdatingPlan: boolean;
  supportedTiers: SubscriptionPlan[];
  spotlightPlan: SubscriptionPlan;
  showEssential?: boolean;
  setSubscriptionInterval: (subInterval: SubscriptionInterval) => void;
  startPolling: (pollInterval: number) => void;
  setIsUpdatingPlan: (isUpdating: boolean) => void;
  openBillingPage: () => void;
}

const TableContainer = styled.div``;

const Table = styled.div<{ showEssential?: boolean }>`
  display: grid;
  width: 100%;
  grid-template-columns: ${(props) => getPlanTableColumnWidths(props.showEssential)};
`;

const TableRow = styled.div<{ hasTooltip?: boolean }>`
  padding: 4px 0;
  display: flex;
  align-items: center;
  cursor: ${(props) => props.hasTooltip && 'help'};
`;

const TierRow = styled.div`
  margin-bottom: 4px;
`;

const GridItem = styled.div<{ theme: ThemeMode; isFirstItem?: boolean; showEssential?: boolean }>`
  padding-left: ${(props) => !props.isFirstItem && '28px'};
  &:nth-child(${(props) => (props.showEssential ? '5n-2' : '4n-1')}) {
    background: ${(props) => (props.theme === ThemeMode.LIGHT ? 'var(--bg-l0-solid)' : 'var(--bg-l1-solid)')};
    color: var(--text-primary);
  }
`;

const NarrowViewTierSection = styled.div`
  margin-top: 40px;
`;

const NarrowViewFeatureList = styled.div`
  margin: 16px 0 40px 0;
`;

export function FeatureTableHeader({
  subscription,
  subscriptionInterval,
  theme,
  isUpdatingPlan,
  supportedTiers,
  showEssential,
  spotlightPlan,
  setSubscriptionInterval,
  startPolling,
  setIsUpdatingPlan,
  openBillingPage
}: FeatureTableHeaderProps) {
  // we use the same breakpoint as the sidepanel toggle breakpoint
  const layoutBreakpoint = useMediaQuery(`(min-width:${FEATURE_TABLE_RESPONSIVE_BREAKPOINT}px)`);

  if (layoutBreakpoint) {
    return (
      <Table showEssential={showEssential}>
        <FeatureTableColumnEnd isTop showEssential={showEssential} theme={theme} />
        <BillingCycleSwitch
          setSubscriptionInterval={setSubscriptionInterval}
          size={Size.SMALL}
          subscriptionInterval={subscriptionInterval}
        />
        {supportedTiers.map((plan, idx) => (
          <GridItem isFirstItem={idx === 0} key={plan} showEssential={showEssential} theme={theme}>
            <TierButton
              activeSubscription={subscription}
              isUpdatingPlan={isUpdatingPlan}
              setIsUpdatingPlan={setIsUpdatingPlan}
              spotlightPlan={spotlightPlan}
              startPolling={startPolling}
              subscriptionInterval={subscriptionInterval}
              subscriptionPlan={plan}
              openBillingPage={openBillingPage}
            />
          </GridItem>
        ))}
      </Table>
    );
  }

  // if smaller screen, don't show tiers in header -> each tier will have its own row instead
  return (
    <BillingCycleSwitch setSubscriptionInterval={setSubscriptionInterval} subscriptionInterval={subscriptionInterval} />
  );
}

interface FeatureTableContentProps {
  subscription: SubscriptionPlan;
  subscriptionInterval: SubscriptionInterval;
  theme: ThemeMode;
  isUpdatingPlan: boolean;
  supportedTiers: SubscriptionPlan[];
  spotlightPlan: SubscriptionPlan;
  showEssential?: boolean;
  startPolling: (pollInterval: number) => void;
  setIsUpdatingPlan: (isUpdating: boolean) => void;
  openBillingPage: () => void;
}

function FeatureTableContent({
  subscription,
  subscriptionInterval,
  theme,
  isUpdatingPlan,
  supportedTiers,
  spotlightPlan,
  showEssential,
  startPolling,
  setIsUpdatingPlan,
  openBillingPage
}: FeatureTableContentProps) {
  const layoutBreakpoint = useMediaQuery(`(min-width:${FEATURE_TABLE_RESPONSIVE_BREAKPOINT}px)`);
  // constructing the table (feature-based) rows
  if (layoutBreakpoint) {
    return (
      <FloatingDelayGroup delay={{ open: 1000, close: 200 }}>
        <Table showEssential={showEssential}>
          {allFeatures.map((sectionItem, sectionItemIndex) => {
            const [sectionName, sectionFeatures] = sectionItem;
            // for each feature in this section
            return sectionFeatures.map((feature: FeatureItem, featureIdx: number) => {
              const { tiers: allTiers, label, hint } = feature;
              const tiers = reduceFeatureDataToSupportedTiers(allTiers, supportedTiers);
              return (
                <React.Fragment key={label}>
                  {/* when section changes display a header */}
                  {featureIdx === 0 && (
                    <FeatureTableSectionHeader
                      isFirstSectionHeader={sectionItemIndex === 0}
                      sectionName={sectionName}
                      showEssential={showEssential}
                      theme={theme}
                    />
                  )}
                  {/* extended description hint */}
                  <TableRow hasTooltip>
                    <Tooltip placement={TooltipPlacement.RIGHT}>
                      <TooltipContent>{hint}</TooltipContent>
                      <TooltipTrigger>
                        <Typography size={TypographySize.SMALL}>{label}</Typography>
                      </TooltipTrigger>
                    </Tooltip>
                  </TableRow>
                  {/* across each tier for that feature */}
                  {Object.values(tiers).map((tier: FeatureData, tierIndex: number) => {
                    const { value, enabled } = tier;
                    const tierName = Object.keys(tiers)[tierIndex];
                    const isSpotlightPlan = tierIndex === supportedTiers.indexOf(spotlightPlan);
                    return (
                      <GridItem
                        isFirstItem={tierIndex === 0}
                        key={`${label}-${tierName}`}
                        showEssential={showEssential}
                        theme={theme}
                      >
                        {value && (
                          <TableRow>
                            <Typography color={isSpotlightPlan ? 'primary' : 'secondary'} size={TypographySize.SMALL}>
                              {value}
                            </Typography>
                          </TableRow>
                        )}
                        {!value && (
                          <TableRow>
                            {enabled && (
                              <Icons
                                color={isSpotlightPlan ? 'primary' : 'secondary'}
                                icon={Icon.Check}
                                size={Size.SMALL}
                              />
                            )}
                          </TableRow>
                        )}
                      </GridItem>
                    );
                  })}
                </React.Fragment>
              );
            });
          })}
          <FeatureTableColumnEnd showEssential={showEssential} theme={theme} />
        </Table>
      </FloatingDelayGroup>
    );
  }

  // constructing tier-based rows, this logic assumes that the features are strictly increasing as we progress through the tiers
  return (
    <div>
      {supportedTiers.map((tier, index) => (
        <NarrowViewTierSection key={tier}>
          <TierButton
            activeSubscription={subscription}
            isUpdatingPlan={isUpdatingPlan}
            setIsUpdatingPlan={setIsUpdatingPlan}
            spotlightPlan={spotlightPlan}
            startPolling={startPolling}
            subscriptionInterval={subscriptionInterval}
            subscriptionPlan={tier}
            openBillingPage={openBillingPage}
          />
          <NarrowViewFeatureList>
            {index > 0 && (
              <TierRow>
                <Typography color='secondary' weight={TypographyWeight.MEDIUM}>
                  Everything in the {getTierTitle(supportedTiers[index - 1])} plan and...
                </Typography>
              </TierRow>
            )}
            {allFeatures.map((sectionItem) => {
              const [, sectionFeatures] = sectionItem;
              return sectionFeatures
                .filter((feature) => narrowViewFeatures.includes(feature))
                .map((feature) => {
                  const currentTier = feature.tiers[tier];
                  const { value, enabled } = currentTier;
                  const previousTier = index > 0 && feature.tiers[supportedTiers[index - 1]];
                  const featureCopy =
                    // check if there's a value property and use it to construct the row copy
                    typeof value === 'string' ? value + ' ' + feature.label.toLowerCase() : feature.label;
                  const featureComponent = (
                    <TierRow key={`${feature.label}-${tier}`}>
                      <Typography color='secondary'>{featureCopy}</Typography>
                    </TierRow>
                  );
                  if ((index === 0 && enabled) || (index === 0 && value)) {
                    return featureComponent;
                  }
                  // only show a feature item if it is newly enabled or has a different value than the same feature in the lower tier
                  if (previousTier && ((enabled && !previousTier.enabled) || value !== previousTier.value)) {
                    return featureComponent;
                  }
                  return null;
                });
            })}
          </NarrowViewFeatureList>
          {/* no divider for last tier*/}
          {index !== supportedTiers.length - 1 && <Divider />}
        </NarrowViewTierSection>
      ))}
    </div>
  );
}

interface FeatureTableProps {
  subscription: SubscriptionPlan;
  isUpdatingPlan: boolean;
  activeSubscriptionBillingInterval: SubscriptionInterval | null | undefined;
  setIsUpdatingPlan: (isUpdating: boolean) => void;
  startPolling: (pollInterval: number) => void;
  openBillingPage: () => void;
}

function FeatureTable({
  subscription,
  isUpdatingPlan,
  activeSubscriptionBillingInterval,
  setIsUpdatingPlan,
  startPolling,
  openBillingPage
}: FeatureTableProps) {
  // if user has a paid plan with a billing interval, default to the view for that interval to ensure they can see their current plan
  const [subInterval, setSubInterval] = useState(activeSubscriptionBillingInterval || SubscriptionInterval.Yearly);
  const { theme } = useTheme();
  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();
  const flags = useFlags();
  const onboardingCohort = flags.onboardingUpsell as OnboardingUpsellFeatureFlag;
  useEffect(() => {
    void storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.PlanTableShown,
          data: JSON.stringify({ onboardingCohort }),
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });
  }, [storeWorkspaceEvent, onboardingCohort]);
  const showEssential = true;
  const supportedTiers = showEssential
    ? [...subscriptionTiers.slice(0, 1), SubscriptionPlan.Essential, ...subscriptionTiers.slice(1)]
    : subscriptionTiers;
  const spotlightPlan = showEssential ? SubscriptionPlan.Essential : SubscriptionPlan.Pro;

  return (
    <TableContainer>
      <FeatureTableHeader
        isUpdatingPlan={isUpdatingPlan}
        setIsUpdatingPlan={setIsUpdatingPlan}
        setSubscriptionInterval={setSubInterval}
        showEssential={showEssential}
        spotlightPlan={spotlightPlan}
        startPolling={startPolling}
        subscription={subscription}
        subscriptionInterval={subInterval}
        supportedTiers={supportedTiers}
        theme={theme}
        openBillingPage={openBillingPage}
      />
      <FeatureTableContent
        isUpdatingPlan={isUpdatingPlan}
        setIsUpdatingPlan={setIsUpdatingPlan}
        showEssential={showEssential}
        spotlightPlan={spotlightPlan}
        startPolling={startPolling}
        subscription={subscription}
        subscriptionInterval={subInterval}
        supportedTiers={supportedTiers}
        theme={theme}
        openBillingPage={openBillingPage}
      />
    </TableContainer>
  );
}

export default FeatureTable;
