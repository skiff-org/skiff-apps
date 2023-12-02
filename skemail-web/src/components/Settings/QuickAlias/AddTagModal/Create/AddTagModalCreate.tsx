import {
  ButtonGroup,
  ButtonGroupItem,
  Icon,
  IconText,
  Icons,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { GetUserQuickAliasDomainsDocument, useCreateQuickAliasDomainMutation } from 'skiff-front-graphql';
import styled from 'styled-components';

import { getRandomQuickAliasTag, useQuickAliasForUserDefaultDomain } from 'skiff-front-utils';
import { ApolloError } from '@apollo/client';

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

const StyledInput = styled.input<{ $color?: string; $width?: string }>`
  outline: none;
  font-family: 'Skiff Sans Text' !important;
  color: ${(props) => props.$color || 'var(--text-primary)'};
  font-size: 15px;
  line-height: 1.2;
  box-sizing: border-box;
  background: transparent;
  font-variant-numeric: tabular-nums;
  caret-color: var(--icon-link);
  border: none;
  font-weight: 380;
  width: ${(props) => props.$width || 'auto'};
  ::placeholder {
    color: var(--text-disabled);
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--border-secondary);
  padding: 12px;
  box-sizing: border-box;
  gap: 8px;
`;

const InputFieldContainer = styled.div`
  display: flex;
  background: var(--bg-overlay-tertiary);
  padding: 8px 12px;
  align-items: center;
  box-sizing: border-box;
  border-radius: 12px;
`;

const SubdomainPrefix = styled.span<{ $color?: string }>`
  font-family: 'Skiff Sans Text' !important;
  font-size: 15px;
  line-height: 1.2;
  font-weight: 380;
  color: ${(props) => props.$color || 'var(--text-secondary)'};
`;

const SubdomainSuffix = styled.span<{ $color?: string }>`
  font-family: 'Skiff Sans Text' !important;
  font-size: 15px;
  line-height: 1.2;
  font-weight: 380;
  color: ${(props) => props.$color || 'var(--text-secondary)'};
`;

const HiddenSpan = styled.span`
  visibility: hidden;
  position: absolute;
  white-space: nowrap;
  font-family: 'Skiff Sans Text' !important;
  font-size: 15px;
  font-weight: 380;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

interface QuickAliasSplashProps {
  onNext: () => void;
  onBack: () => void;
  subdomain: string;
  setSubdomain: (subdomain: string) => void;
}

export default function AddTagModalCreate(props: QuickAliasSplashProps) {
  const { onNext, onBack, subdomain, setSubdomain } = props;
  const [inputWidth, setInputWidth] = useState('auto');
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const [activateLoading, setActivateLoading] = useState(false);
  const [createQuickAliasDomain] = useCreateQuickAliasDomainMutation();
  const [error, setError] = useState<string | null>(null);
  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();

  const subdomainIsValid = (subdomainStr: string) => {
    // validate on backend
    const mockBackendResult = true;
    return mockBackendResult && subdomainStr.length > 0;
  };
  useEffect(() => {
    if (spanRef.current) {
      const buffer = 4; // font-dependent buffer
      const width = spanRef.current.offsetWidth + buffer;
      setInputWidth(`${width}px`);
    }
  }, [subdomain]);

  const validSubdomain = subdomainIsValid(subdomain);

  const onActivate = async () => {
    if (validSubdomain) {
      try {
        setActivateLoading(true);
        if (!defaultDomain) return;
        await createQuickAliasDomain({
          variables: {
            request: {
              rootDomain: defaultDomain,
              subDomain: subdomain
            }
          },
          refetchQueries: [{ query: GetUserQuickAliasDomainsDocument }]
        });
        setActivateLoading(false);
        onNext();
      } catch (e: any) {
        setError((e as ApolloError).message || 'Domain is not available');
        setActivateLoading(false);
      }
    }
  };

  const onRandom = () => {
    const randomTag = getRandomQuickAliasTag();
    setSubdomain(randomTag);
  };

  useEffect(() => {
    onRandom();
  }, []);

  return (
    <Container>
      <TextSection>
        <IconContainer>
          <Icons color='link' icon={Icon.At} size={20} />
        </IconContainer>
        <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
          Claim another domain
        </Typography>
        <Typography color='secondary' wrap>
          This unique domain is yours alone. You will use it to create made-to-order Quick Aliases whenever you like.
        </Typography>
      </TextSection>
      <InputContainer>
        <Header>
          <Typography color='disabled' mono size={TypographySize.SMALL} uppercase>
            Create domain
          </Typography>
          <IconText onClick={onRandom} startIcon={Icon.Reload} tooltip='Randomize' />
        </Header>
        <InputFieldContainer>
          <SubdomainPrefix>@</SubdomainPrefix>
          <StyledInput
            $width={inputWidth}
            autoFocus
            maxLength={18}
            onChange={(e) => {
              setError(null);
              setSubdomain(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && validSubdomain) {
                void onActivate();
              }
            }}
            placeholder='yourtag'
            value={subdomain}
          />
          <HiddenSpan ref={spanRef}>{subdomain || 'yourtag'}</HiddenSpan>
          <SubdomainSuffix>.{defaultDomain}</SubdomainSuffix>
        </InputFieldContainer>
        {error && (
          <Typography color='destructive' size={TypographySize.SMALL}>
            {error}
          </Typography>
        )}
      </InputContainer>
      <ButtonGroup>
        <ButtonGroupItem
          key='activate'
          label='Activate'
          loading={activateLoading}
          onClick={() => {
            void onActivate();
          }}
        />
        <ButtonGroupItem key='back' label='Back' onClick={() => onBack()} />
      </ButtonGroup>
    </Container>
  );
}
