import { ButtonGroup, ButtonGroupItem, Icon, Icons, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { useQuickAliasForUserDefaultDomain } from 'skiff-front-utils';
import styled from 'styled-components';

import ActivatedTagAnimation from './ActivatedTagAnimation';

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;
  gap: 16px;
  box-sizing: border-box;
`;

const IconContainer = styled.div`
  background: var(--bg-l1-solid);
  border-radius: 8px;
  box-shadow: var(--shadow-l1);
  aspect-ratio: 1;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border-tertiary);
  margin-bottom: 4px;
`;

interface AddTagModalActivatedProps {
  onNext: () => void;
  onBack: () => void;
  subdomain: string;
}

export default function AddTagModalActivated(props: AddTagModalActivatedProps) {
  const { onNext, onBack, subdomain } = props;

  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();

  const fullDomain = `@${subdomain}.${defaultDomain || ''}`;

  return (
    <Container>
      <TextSection>
        <IconContainer>
          <Icons color='link' icon={Icon.At} size={20} />
        </IconContainer>
        <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
          {`‘${fullDomain}’ is all yours`}
        </Typography>
        <Typography color='secondary' wrap>
          {`Create a Quick Alias whenever you like by writing any name you can think of, followed by: ${fullDomain}`}
        </Typography>
      </TextSection>
      <ActivatedTagAnimation subdomain={subdomain} />
      <ButtonGroup>
        <ButtonGroupItem
          key='start'
          label='Try it out'
          onClick={() => {
            onNext();
          }}
        />
        <ButtonGroupItem key='back' label='Back' onClick={() => onBack()} />
      </ButtonGroup>
    </Container>
  );
}
