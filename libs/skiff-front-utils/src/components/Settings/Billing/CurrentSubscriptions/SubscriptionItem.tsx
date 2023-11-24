import { Icon, Icons, Size, Typography } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
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
  isAppleSubscription?: boolean;
}

const SubscriptionItem: React.FC<SubscriptionItemProps> = ({
  icon,
  title,
  subtitle,
  endAction,
  isAppleSubscription
}) => {
  const appleSubSuffix = isAppleSubscription ? ' • Visit the App Store to manage your subscription.' : '';
  return (
    <>
      <SubscriptionBlock>
        <SubscriptionIconInfo>
          <IconContainer>
            <Icons color='secondary' icon={icon} size={Size.X_MEDIUM} />
          </IconContainer>
          <SubscriptionInfo>
            <Typography>{title}</Typography>
            <Typography color='secondary' wrap>
              {subtitle}
              {!isMobile && `${appleSubSuffix}`}
            </Typography>
          </SubscriptionInfo>
        </SubscriptionIconInfo>
        {endAction}
      </SubscriptionBlock>
    </>
  );
};

export default SubscriptionItem;
