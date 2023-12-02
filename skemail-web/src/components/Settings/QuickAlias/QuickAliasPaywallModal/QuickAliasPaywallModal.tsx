import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  MonoTag,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React from 'react';
import { useDispatch } from 'react-redux';
import { DottedGrid, NameMarquee, TabPage } from 'skiff-front-utils';
import { getTierNameFromSubscriptionPlan } from 'skiff-graphql';
import { TierName, getMaxQuickAliasSubdomains } from 'skiff-utils';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import { useSubscriptionPlan } from '../../../../utils/userUtils';
import { useSettings } from '../../useSettings';
import ActivatedTagAnimation from '../AddTagModal/Activated/ActivatedTagAnimation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0px;
  height: 100%;
  width: 100%;
`;

const Title = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 4px;
  height: 100%;
  width: 100%;
`;

const CenterSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px 12px;
  gap: 12px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
`;

const MarqueeContainer = styled.div`
  width: 100%;
  overflow: hidden;
  background: var(--bg-overlay-tertiary);
  height: 174px;
  border-radius: 12px 12px 0px 0px;
`;
const ButtonSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  padding-top: 0px;
  height: 100%;
  width: 100%;
  align-items: center;
  box-sizing: border-box;
`;

const OrangeText = styled.span`
  color: var(--text-link);
`;

const StyledDottedGrid = styled(DottedGrid)`
  z-index: -1;
`;

const StyledMarquee = styled(NameMarquee)`
  transform: scale(0.6) translate(-588px, -40px);
  margin-top: 0px;
`;

const AbsoluteContainer = styled.div`
  position: absolute;
  top: 68px;
  left: calc(50% - 103px);
`;

interface QuickAliasPaywallModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  // a quick alias prohibited from sending (applicable to Free tier users)
  fromAlias?: string;
}

interface TitleDescription {
  title: string;
  description: string;
  highlight?: string;
}

const getTitleDescriptionFromTier = (currentTier: TierName, fromAlias?: string): TitleDescription => {
  let title: string, description: string, highlight: string | undefined;
  switch (currentTier) {
    case TierName.Free:
      title = fromAlias ? 'Unlock sending from' : 'Unlock more domains and';
      highlight = 'unlimited Quick Aliases';
      description = `${
        fromAlias ? `Upgrade to send from  ${fromAlias}` : 'Enjoy more Quick Alias domains'
      } and create unlimited aliases whenever and wherever you want.${
        fromAlias ? ' Sending from standard addresses is always allowed.' : ''
      }`;
      break;
    case TierName.Pro:
    case TierName.Essential:
      title = 'Unlock more';
      highlight = 'personalized domains';
      description = 'Claim multiple domains and use them to create unlimited email aliases';
      break;
    case TierName.Business:
      title = "You've reached the max personalized domains";
      description = 'If you need more, please reach us at support@skiff.org';
      break;
    default:
      title = 'Unlock unlimited';
      description = 'Mask your identity on-the-fly, anywhere with unlimited Quick Aliases';
  }
  return { title, description, highlight } as TitleDescription;
};

const MOCK_SUBDOMAIN = 'stealth';

export const QuickAliasPaywallModal: React.FC<QuickAliasPaywallModalProps> = ({
  open,
  setOpen,
  fromAlias
}: QuickAliasPaywallModalProps) => {
  const { openSettings } = useSettings();
  const openPlansPage = () => openSettings({ tab: TabPage.Plans });
  const {
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const dispatch = useDispatch();
  const currentTier = getTierNameFromSubscriptionPlan(activeSubscription);
  const maxQuickAliasSubdomains = getMaxQuickAliasSubdomains(currentTier);
  const { title, description, highlight } = getTitleDescriptionFromTier(currentTier, fromAlias);
  const onClose = () => {
    setOpen(false);
  };
  const openFeedbackModal = () => {
    onClose();
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Feedback }));
  };
  const isBusiness = currentTier === TierName.Business;

  return (
    <Dialog customContent hideCloseButton noPadding onClose={onClose} open={open} size={Size.MEDIUM}>
      <Container>
        <MarqueeContainer>
          <StyledDottedGrid noAnimation height={174} hideMotionLine left={0} top={0} />
          <StyledMarquee pillColor='var(--bg-l2-solid)' subdomain={MOCK_SUBDOMAIN} />
          <AbsoluteContainer>
            <ActivatedTagAnimation hideCopyButton subdomain={MOCK_SUBDOMAIN} />
          </AbsoluteContainer>
        </MarqueeContainer>
        <CenterSection>
          <MonoTag
            color='secondary'
            label={
              fromAlias
                ? 'Quick Alias sending'
                : `${maxQuickAliasSubdomains} of ${maxQuickAliasSubdomains} ${pluralize(
                    'domain',
                    maxQuickAliasSubdomains
                  )} used`
            }
          />
          <Title>
            <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM} wrap>
              {title}
              <OrangeText>&nbsp;{highlight}</OrangeText>
            </Typography>
            <Typography color='secondary' size={TypographySize.MEDIUM} wrap>
              {description}
            </Typography>
          </Title>
        </CenterSection>
        <ButtonSection>
          <ButtonGroup>
            <ButtonGroupItem
              key='upgrade'
              label={isBusiness ? 'Contact' : 'Upgrade'}
              onClick={isBusiness ? openFeedbackModal : openPlansPage}
            />
            <ButtonGroupItem key='not-now' label='Not now' onClick={() => onClose()} />
          </ButtonGroup>
        </ButtonSection>
      </Container>
    </Dialog>
  );
};
