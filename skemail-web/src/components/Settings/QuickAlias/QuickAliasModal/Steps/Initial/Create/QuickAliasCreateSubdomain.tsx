import { AnimatePresence, motion } from 'framer-motion';
import range from 'lodash/range';
import {
  Alignment,
  Button,
  Icon,
  IconText,
  Icons,
  Size,
  ThemeMode,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { GetUserQuickAliasDomainsDocument, useCreateQuickAliasDomainMutation } from 'skiff-front-graphql';
import { NameMarquee, getRandomQuickAliasTag, useQuickAliasForUserDefaultDomain, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import { ApolloError } from '@apollo/client';

const Title = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 480px;
`;

const TextSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 500px;
  gap: 24px;
  justify-content: center;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SubdomainInputContainer = styled(motion.div)<{ $animated?: boolean }>`
  display: flex;
  align-items: center;
  border: 1.5px solid ${(props) => (props.$animated ? 'rgba(255, 142, 120, 0.3)' : 'var(--border-secondary)')};
  border-radius: 16px;
  padding: 16px 32px;
  box-sizing: border-box;
  box-shadow: var(--shadow-l2);
  background: var(--bg-l2-solid);
  height: 70px;
`;

const SubdomainActiveInputContainer = styled(motion.div)<{ $animated?: boolean }>`
  display: flex;
  align-items: center;
  border: 1.5px solid ${(props) => (props.$animated ? 'rgba(255, 255, 255, 0.5)' : 'var(--border-secondary)')};
  border-radius: 16px;
  padding: 16px 32px;
  box-sizing: border-box;
  box-shadow: var(--shadow-l2);
  background: var(--bg-emphasis);
  height: 70px;
  transition: border-color 0.2s ease-in-out;
  :hover {
    border-color: white;
  }
`;

const SubdomainSuffix = styled.span<{ $color?: string }>`
  font-family: 'Skiff Sans Text' !important;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 470;
  color: ${(props) => props.$color || 'var(--text-secondary)'};
`;

const StyledInput = styled.input<{ $color?: string; $width?: string }>`
  outline: none;
  font-family: 'Skiff Sans Text' !important;
  color: ${(props) => props.$color || 'var(--text-primary)'};
  font-size: 28px;
  line-height: 1.2;
  box-sizing: border-box;
  background: transparent;
  font-variant-numeric: tabular-nums;
  caret-color: var(--icon-link);
  border: none;
  font-weight: 470;
  width: ${(props) => props.$width || 'auto'};
  ::placeholder {
    color: var(--text-disabled);
  }
`;

// used to show "@yourdomain.{defaultDomain}.com" after the caret in input
const HiddenSpan = styled.span`
  visibility: hidden;
  position: absolute;
  white-space: nowrap;
  font-family: 'Skiff Sans Text' !important;
  font-size: 28px;
  font-weight: 470;
`;

const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--bg-emphasis);
  box-shadow: var(--shadow-l2);
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 100px;
`;

const CopyButtonContainer = styled.div`
  position: relative;
  z-index: 99999;
  margin-left: 16px;
  margin-right: -8px;
`;

const Relative = styled.div`
  position: relative;
  left: -33px;
  top: -34px;
`;

const Pulse = styled(motion.div)<{ $path: string; $opacity: number }>`
  width: 3px;
  border-radius: 10px;
  height: 3px;
  background: ${({ $opacity }) => `rgba(255, 255, 255, ${$opacity})`};
  position: absolute;
  top: 0;
  left: 0;
  offset-path: ${({ $path }) => `path('${$path}')`};
`;

const CursorCircle = styled.div`
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  filter: blur(18px);
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: transform 0.1s, opacity 0.1s;
  opacity: 0;
`;

const StyledTypography = styled(Typography)`
  margin-top: -4px;
`;

const NUM_PULSE = 40;

enum QuickAliasCreateSubdomainState {
  INPUT,
  ACTIVATED
}

interface QuickAliasCreateSubdomainProps {
  onNext: () => void;
  onClose: () => void;
  setSubdomain: (subdomain: string) => void;
  subdomain: string;
}

export default function QuickAliasCreateSubdomain(props: QuickAliasCreateSubdomainProps) {
  const { onNext, onClose, subdomain, setSubdomain } = props;
  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();

  const { enqueueToast } = useToast();
  const [createQuickAliasDomain] = useCreateQuickAliasDomainMutation();
  const [activateLoading, setActivateLoading] = useState(false);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeState, setActiveState] = useState(QuickAliasCreateSubdomainState.INPUT);
  const [inputWidth, setInputWidth] = useState('auto');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [path, setPath] = useState('');

  const containerRef = React.useRef<HTMLDivElement>(null); // Ref for the SubdomainInputContainer

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 2;
        const height = containerRef.current.offsetHeight - 2;
        const r = 16; // border-radius value

        // Considerations for the cubic bezier curve
        const c = r * (1 - 0.552284749831);

        const newPath = `
          M ${r} 0
          H ${width - r}
          C ${width - c} 0, ${width} 0, ${width} ${r}
          V ${height - r}
          C ${width} ${height - c}, ${width} ${height}, ${width - r} ${height}
          H ${r}
          C ${c} ${height}, 0 ${height}, 0 ${height - r}
          V ${r}
          C 0 ${c}, 0 0, ${r} 0
        `;
        setPath(newPath);
      }
    };

    // Initial path update
    updatePath();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(updatePath);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (spanRef.current) {
      const buffer = 4; // font-dependent buffer
      const width = spanRef.current.offsetWidth + buffer;
      setInputWidth(`${width}px`);
    }
  }, [subdomain]);

  const subdomainIsValid = (subdomainStr: string) => {
    // validate on backend
    const mockBackendResult = true;
    return mockBackendResult && subdomainStr.length > 0;
  };

  const onRandom = () => {
    const randomTag = getRandomQuickAliasTag();
    setSubdomain(randomTag);
  };

  useEffect(() => {
    onRandom();
  }, []);

  const validSubdomain = subdomainIsValid(subdomain);

  const onActivate = async () => {
    if (validSubdomain) {
      try {
        setActivateLoading(true);
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
        setActiveState(QuickAliasCreateSubdomainState.ACTIVATED);
      } catch (e: any) {
        setError((e as ApolloError).message || 'Domain is not available');
        setActivateLoading(false);
      }
    }
  };

  const getTitleText = (tag?: string) => {
    switch (activeState) {
      case QuickAliasCreateSubdomainState.INPUT:
        return 'Claim your Quick Alias domain';
      case QuickAliasCreateSubdomainState.ACTIVATED:
        return `‘${tag || ''}.${defaultDomain}’ is all yours!`;
    }
  };

  const getSubtitleText = () => {
    switch (activeState) {
      case QuickAliasCreateSubdomainState.INPUT:
        return 'This unique domain name is yours alone. You will use it to create made-to-order Quick Aliases whenever you like. ';
      case QuickAliasCreateSubdomainState.ACTIVATED:
        return "The alias you choose will be automatically created in your Skiff account. Here's the best part: This works whether you're entering the alias into an online form or a hand-written one.";
    }
  };

  const titleText = getTitleText(subdomain);
  const subtitleText = getSubtitleText();

  const onCopy = () => {
    void navigator.clipboard.writeText(`@${subdomain || ''}.${defaultDomain}`);
    enqueueToast({
      title: 'Copied to clipboard',
      body: `@${subdomain || ''}.${defaultDomain}`
    });
  };

  return (
    <Container>
      <TextSection>
        <IconContainer>
          <Icons color='white' icon={Icon.Bolt} size={24} />
        </IconContainer>
        <Title>
          <Typography align={Alignment.CENTER} size={TypographySize.H3} weight={TypographyWeight.BOLD}>
            {titleText}
          </Typography>
          <Typography align={Alignment.CENTER} color='disabled' wrap>
            {subtitleText}
          </Typography>
        </Title>
        {activeState === QuickAliasCreateSubdomainState.INPUT && (
          <SubdomainInputContainer ref={containerRef}>
            <StyledTypography color='disabled' size={TypographySize.H1} weight={TypographyWeight.MEDIUM}>
              @
            </StyledTypography>
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
          </SubdomainInputContainer>
        )}
        {activeState === QuickAliasCreateSubdomainState.ACTIVATED && (
          <>
            <CursorCircle
              style={{
                left: cursorPosition.x - 210,
                top: cursorPosition.y - 80,
                opacity: isHovered ? 1 : 0
              }}
            />
            <SubdomainActiveInputContainer
              $animated
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={(e) => {
                setCursorPosition({ x: e.clientX, y: e.clientY });
              }}
              ref={containerRef}
            >
              <Relative>
                <AnimatePresence>
                  {!isHovered &&
                    range(NUM_PULSE).map((i) => {
                      return (
                        <Pulse
                          $opacity={1 - i * (1 / NUM_PULSE)}
                          $path={path}
                          animate={{ offsetDistance: '100%' }}
                          initial={{ offsetDistance: `${(NUM_PULSE - i) * 0.3}%` }}
                          key={i}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'linear',
                            repeatDelay: 0
                          }}
                        />
                      );
                    })}
                </AnimatePresence>
              </Relative>
              <Typography
                color='white'
                size={TypographySize.H1}
                weight={TypographyWeight.MEDIUM}
              >{`@${subdomain}.${defaultDomain}`}</Typography>
              <CopyButtonContainer>
                <IconText
                  color='secondary'
                  forceTheme={ThemeMode.DARK}
                  onClick={onCopy}
                  size={Size.LARGE}
                  startIcon={Icon.Copy}
                />
              </CopyButtonContainer>
            </SubdomainActiveInputContainer>
          </>
        )}
        {activeState === QuickAliasCreateSubdomainState.INPUT && (
          <>
            <Typography
              align={Alignment.CENTER}
              color={error ? 'destructive' : subdomain.length === 0 || validSubdomain ? 'disabled' : 'destructive'}
              wrap
            >
              {error ||
                (subdomain.length === 0 || validSubdomain
                  ? "Tip: Choose a domain that's easy to remember. But avoid using your name or any identifying info to make sure your domain protects your privacy."
                  : 'This domain has already been claimed')}
            </Typography>
            <ButtonGroup>
              <Button onClick={onRandom} size={Size.LARGE} type={Type.SECONDARY}>
                Randomize
              </Button>
              <Button disabled={!validSubdomain} loading={activateLoading} onClick={onActivate} size={Size.LARGE}>
                Activate
              </Button>
            </ButtonGroup>
          </>
        )}
        {activeState === QuickAliasCreateSubdomainState.ACTIVATED && (
          <>
            <ButtonGroup>
              <Button onClick={onClose} size={Size.LARGE} type={Type.SECONDARY}>
                Finish
              </Button>
              <Button disabled={!validSubdomain} onClick={onNext} size={Size.LARGE}>
                Show me how
              </Button>
            </ButtonGroup>
          </>
        )}
      </TextSection>
      {activeState === QuickAliasCreateSubdomainState.ACTIVATED && <NameMarquee subdomain={subdomain} />}
    </Container>
  );
}
