import { Icon, Icons, Size, Typography } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

const SubscriptionBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubscriptionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  aspect-ratio: 1;
  width: 42px;
  height: 42px;
  background: var(--bg-overlay-secondary);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
`;

const SubscriptionIconInfo = styled.div`
  display: flex;
  gap: 12px;
`;

interface SubscriptionItemProps {
  icon: Icon;
  title: string;
  subtitle: string;
  endAction: JSX.Element;
}

const SubscriptionItem: React.FC<SubscriptionItemProps> = ({ icon, title, subtitle, endAction }) => {
  return (
    <SubscriptionBlock>
      <SubscriptionIconInfo>
        <IconContainer>
          <Icons icon={icon} color='secondary' size={Size.X_MEDIUM} />
        </IconContainer>
        <SubscriptionInfo>
          <Typography>{title}</Typography>
          <Typography color='secondary'>{subtitle}</Typography>
        </SubscriptionInfo>
      </SubscriptionIconInfo>
      {endAction}
    </SubscriptionBlock>
  );
};

export default SubscriptionItem;
