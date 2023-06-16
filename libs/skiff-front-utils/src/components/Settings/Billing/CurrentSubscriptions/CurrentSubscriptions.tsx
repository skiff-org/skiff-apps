import { Typography } from 'nightwatch-ui';
import styled from 'styled-components';
import { TabPage } from '../../Settings.types';
import DomainSubscriptions from './DomainSubscriptions';
import TierSubscription from './TierSubscription';

export interface TabProp {
  tab: TabPage;
}
interface CurrentSubscriptionsProps {
  // Each app has its own state to control the Settings modal
  openPlansPage: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/**
 * Displays a list of all current subscriptions and domain purchases on the account
 */

const CurrentSubscriptions: React.FC<CurrentSubscriptionsProps> = ({ openPlansPage }) => {
  return (
    <Container>
      <Typography>Current subscriptions</Typography>
      <TierSubscription openPlansPage={openPlansPage} />
      <DomainSubscriptions />
    </Container>
  );
};

export default CurrentSubscriptions;
