import { Button, Icon, IconText, Icons, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import { useQuickAliasForUserDefaultDomain } from 'skiff-front-utils';
import styled from 'styled-components';

import { QuickAliasTutorialState } from '../../../QuickAliasModal.constants';

import QuickAliasTutorialInteractive from './QuickAliasTutorialInteractive';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: flex-start;
  padding: 0px 64px;
  box-sizing: border-box;
`;

const TextContainer = styled.div`
  width: 288px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  top: 0px;
  left: 0px;
  padding: 12px 16px;
`;

const IconTextContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TextCTA = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  padding-top: 70px;
`;

const IconContainer = styled.div`
  background: var(--accent-orange-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
`;

const TextInteractive = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 480px;
`;

const DisabledText = styled.span`
  color: var(--text-disabled);
`;

const MediumText = styled.span`
  font-weight: 470;
`;

const CTA = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
`;

interface QuickAliasTutorialProps {
  onNext: () => void;
  onClose: () => void;
  subdomain: string; // TODO: from BE?
}

export default function QuickAliasTutorial(props: QuickAliasTutorialProps) {
  const { onNext, onClose, subdomain } = props;
  const [state, setState] = React.useState<QuickAliasTutorialState>(QuickAliasTutorialState.INPUT);
  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();

  const onActivate = () => {
    setState(QuickAliasTutorialState.SENT);
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Container>
      <TextInteractive>
        <TopBar>
          <IconTextContainer>
            <IconContainer>
              <Icons color='link' icon={Icon.Bolt} />
            </IconContainer>
            <Typography color='secondary'>
              Using Quick Aliases <DisabledText>{`${state + 1} of 4`}</DisabledText>
            </Typography>
          </IconTextContainer>
          <IconText color='secondary' onClick={onClose} startIcon={Icon.Close} />
        </TopBar>
        <TextCTA
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
        >
          <TextContainer>
            {state === QuickAliasTutorialState.INPUT && (
              <Typography size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
                Create a Quick Alias
              </Typography>
            )}
            {state === QuickAliasTutorialState.SENT && (
              <Typography weight={TypographyWeight.MEDIUM}>Your Quick Alias has been activated</Typography>
            )}
            {state === QuickAliasTutorialState.INPUT && (
              <Typography color='secondary' wrap>
                On any website that requires an email, create an quick alias by using any email with your domain,{' '}
                <MediumText>{`@${subdomain}.${defaultDomain}`}</MediumText>
              </Typography>
            )}
            {state === QuickAliasTutorialState.SENT && (
              <Typography color='secondary' wrap>
                Your alias will appear in Skiff the first time it receives an email. <br /> <br />
                Looks like you&apos;re getting an email, let&apos;s go back to Skiff Mail to see your new quick alias
              </Typography>
            )}
          </TextContainer>
          <CTA>
            {state === QuickAliasTutorialState.INPUT ? (
              <>
                <Typography color='link'>Try it now by signing up for &apos;Whalemart&apos;</Typography>
                <Icons color='link' icon={Icon.ArrowRight} />
              </>
            ) : (
              <Button onClick={onNext}>Open mail</Button>
            )}
          </CTA>
        </TextCTA>
        <QuickAliasTutorialInteractive inputRef={inputRef} onNext={onActivate} state={state} subdomain={subdomain} />
      </TextInteractive>
    </Container>
  );
}
