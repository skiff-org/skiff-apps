import { Alignment, Button, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import AliasOnboardIllustration from './AliasOnboardIllustration';

const Title = styled.div`
  display: flex;
  flex-direction: column;
`;

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 500px;
  gap: 24px;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 100px;
`;

interface QuickAliasSplashProps {
  onNext: () => void;
}

export default function QuickAliasSplash(props: QuickAliasSplashProps) {
  const { onNext } = props;

  return (
    <Container>
      <TextSection>
        <Title>
          <Typography align={Alignment.CENTER} size={TypographySize.H1} weight={TypographyWeight.BOLD}>
            Introducing
          </Typography>
          <Typography align={Alignment.CENTER} color='link' size={TypographySize.H1} weight={TypographyWeight.BOLD}>
            Quick Aliases
          </Typography>
        </Title>
        <Typography align={Alignment.CENTER} color='disabled' wrap>
          Quick Aliases are a magically simple new way to protect your privacy from marketers, spammers and shady “data
          brokers” of all stripes.
        </Typography>
        <Button onClick={onNext} size={Size.LARGE}>
          Get started
        </Button>
      </TextSection>
      <AliasOnboardIllustration />
    </Container>
  );
}
