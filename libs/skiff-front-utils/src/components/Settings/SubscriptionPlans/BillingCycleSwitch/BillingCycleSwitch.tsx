import { Tabs, TabsSize } from 'nightwatch-ui';
import React from 'react';
import { SubscriptionInterval } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

type BillingCycleSwitchProps = {
  subscriptionInterval: SubscriptionInterval;
  setSubscriptionInterval: (subInterval: SubscriptionInterval) => void;
  size?: TabsSize;
};

const BillingCycleSwitchContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/**
 * Toggle for selecting between either a monthly or
 * a year billing plan.
 */
function BillingCycleSwitch(props: BillingCycleSwitchProps) {
  const { subscriptionInterval, setSubscriptionInterval, size } = props;
  return (
    <BillingCycleSwitchContainer>
      <Tabs
        size={size}
        tabs={Object.values(SubscriptionInterval).map((interval) => ({
          label: upperCaseFirstLetter(interval),
          active: subscriptionInterval === interval,
          onClick: () => setSubscriptionInterval(interval)
        }))}
      />
    </BillingCycleSwitchContainer>
  );
}

export default BillingCycleSwitch;
