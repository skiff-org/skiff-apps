import { AnimatePresence, motion } from 'framer-motion';
import {
  Alignment,
  CircularProgress,
  Icon,
  Icons,
  InputField,
  Size,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipPlacement,
  TooltipTrigger,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect } from 'react';
import { useSendAnonymousSubdomainTutorialEmailMutation } from 'skiff-front-graphql';
import { Illustration, Illustrations, useMediaQuery, useQuickAliasForUserDefaultDomain } from 'skiff-front-utils';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import isEmail from 'validator/lib/isEmail';

import { ILLUSTRATION_BREAKPOINT, QuickAliasTutorialState } from '../../../QuickAliasModal.constants';

const BrowserContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
  height: 480px;
  width: 54%;
  position: absolute;
  right: 0px;
  flex-direction: column;
  background: #309ffc;
  border-radius: 6px;
`;

const BrowserTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 4px;
  background: var(--bg-l3-solid);
  border: 1px solid var(--border-primary);
  border-radius: 6px 6px 0px 0px;
`;

const Circle = styled.div<{ $bgColor: string }>`
  background: ${(props) => props.$bgColor};
  width: 9px;
  height: 9px;
  border-radius: 50%;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IconGradientContainer = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(0deg, #0062e0 0%, #19afff 100%);
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const IconTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const PaddedContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  padding-bottom: 0px;
`;

const CTAContainer = styled.div`
  border-top: 1px solid var(--border-tertiary);
  background: rgba(14, 138, 241, 0.04);
  padding: 20px;
`;

const WhaleModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 24px;
  background: var(--bg-l3-solid);
  margin: auto;
  width: calc(100% - 96px);
  max-width: 454px;
`;

const ContinueButton = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  background: #0e8af1;
  opacity: ${(props) => (props.$disabled ? 0.3 : 1)};
  justify-content: center;
  height: 44px;
  border-radius: 100px;
  width: 100%;
  pointer-events: ${(props) => (props.$disabled ? 'none' : 'auto')};
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  &:hover {
    background: ${(props) => (props.$disabled ? '#0e8af1' : '#0b7dda')};
  }
`;

const StyledInputField = styled(InputField)<{ $subdomain: string; $cursorPosition: number }>`
  position: relative;

  &::after {
    display: ${(props) => (props.$cursorPosition === 0 ? 'none' : 'block')};
    content: '${(props) => props.$subdomain}';
    position: absolute;
    top: 50%;
    left: ${(props) => `${props.$cursorPosition + 12}px`};
    transform: translateY(-50%);
    pointer-events: none; // Ensure the suffix doesn't interfere with user interactions
    color: var(--text-disabled);
    font-family: 'Skiff Sans Text' !important;
    font-size: 15px;
    line-height: 1.2;
    font-weight: 380;
  }
`;
const rotation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const GlobalStyle = createGlobalStyle`
  :root {
    --base-color: transparent;
    --move-color: rgb(239, 90, 60);
  }
`;

const ColoredFeather = styled.div`
  /* set all fill of descendants to be red */
  svg * {
    fill: #0e8af1;
  }
`;

const ButtonToggle = styled.button<{ $fullyTypedIn: boolean; $color?: string }>`
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  clip-path: inset(0px, 0px, 0px, 0px);
  outline: none;
  padding: 1px;
  overflow: hidden;
  width: 100%;
  border: 0;
  border-radius: 13px;
  cursor: pointer;
  background: ${(props) => (props.$fullyTypedIn ? 'var(--accent-green-primary)' : '')};

  .animating {
    background-size: 100% 100%;
    background: ${(props) =>
      `linear-gradient(0deg, var(--base-color) 40%, ${
        props.$color || 'var(--move-color)'
      } 50%, var(--base-color) 60%)`};
    animation: ${rotation} 4s linear infinite;
  }

  .animating {
    border-radius: 12px;
    z-index: 0;
    height: 500%;
    width: 300%;
    display: flex;
    align-items: center;
    position: absolute;
  }

  .innerAnimating {
    height: 150%;
    width: 50%;
    background: var(--base-color);
  }
`;

const BlueText = styled.span`
  color: #0e8af1;
`;

const InputFieldAnimateContainer = styled.div`
  z-index: 1;
  background: var(--bg-l3-solid);
  width: 100%;
  border-radius: 12px;
`;

const SentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0px;
  padding-bottom: 60px;
`;

const SentText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
`;

const Absolute = styled.div`
  position: absolute;
  z-index: 9999999;
  left: -20px;
`;

const Relative = styled.div`
  position: relative;
  z-index: 9999999;
`;

const spinnerVariants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50, transition: { duration: 0.5 } }
};

const checkVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 0.5 } }
};

interface QuickAliasTutorialInteractiveProps {
  subdomain: string; // TODO: from BE?
  inputRef: React.RefObject<HTMLInputElement>;
  state: QuickAliasTutorialState;
  onNext: () => void;
}

const MAX_LEN = 14;

export default function QuickAliasTutorialInteractive(props: QuickAliasTutorialInteractiveProps) {
  const { subdomain, inputRef, onNext, state } = props;
  const [email, setEmail] = React.useState('');
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [widthUpToCursor, setWidthUpToCursor] = React.useState(0);
  const { data: defaultDomain } = useQuickAliasForUserDefaultDomain();
  const [sendAnonymousSubdomainTutorialEmail] = useSendAnonymousSubdomainTutorialEmailMutation();
  const [showCheck, setShowCheck] = React.useState(false);
  const isCompact = useMediaQuery(`(max-width:${ILLUSTRATION_BREAKPOINT}px)`, { noSsr: true });

  const domain = `${subdomain}.${defaultDomain}`;
  const atPrependedDomain = `@${domain}`;
  const suggestedQuickAlias = `shop${atPrependedDomain}`;
  const [tutorialSubdomain, setTutorialSubdomain] = React.useState(atPrependedDomain);
  const [showError, setShowError] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState('');

  useEffect(() => {
    if (state === QuickAliasTutorialState.SENT) {
      const timer = setTimeout(() => {
        setShowCheck(true);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const containerRef = React.useRef<HTMLDivElement>(null); // Ref for the SubdomainInputContainer
  const fullyTypedIn = email.includes(domain);

  useEffect(() => {
    // if compact skip this step
    if (isCompact) {
      onNext();
    }
  }, [isCompact, onNext]);

  useEffect(() => {
    if (inputRef.current) {
      const span = document.createElement('span');
      span.style.fontFamily = 'Skiff Sans Text';
      span.style.fontSize = '15px';
      span.style.fontWeight = '380';
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'nowrap';
      span.textContent = email.substring(0, cursorPosition);
      document.body.appendChild(span);
      const width = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      setWidthUpToCursor(width);
    }
  }, [email, cursorPosition, inputRef]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setShowTooltip('');
    setShowError(false);
    // if '@'
    if (e.target.value.includes('@')) {
      const typedDomain = inputValue.split('@')[1];
      if (typedDomain !== undefined && domain.startsWith(typedDomain)) {
        const matchingDomain = domain.slice(typedDomain.length);
        setTutorialSubdomain(`${matchingDomain}`);
      } else {
        if (fullyTypedIn) return;
        // show error unless backspace
        setShowError(true);
        setShowTooltip('Fill in the rest of the domain');
        return;
      }
    } else if (inputValue.length > MAX_LEN) {
      setShowTooltip('Type in ‘@‘');
      return;
    } else {
      setTutorialSubdomain(atPrependedDomain);
    }
    setEmail(inputValue);
    // Remember cursor position
    setCursorPosition(e.target.selectionStart || 0);
  };

  const onContinue = async () => {
    const isLikelyValidQuickAlias = email.endsWith(atPrependedDomain) && isEmail(email);
    try {
      await sendAnonymousSubdomainTutorialEmail({
        variables: {
          email: isLikelyValidQuickAlias ? email : suggestedQuickAlias // fall back on the suggestion if user fails to enter appropriate address
        }
      });
    } catch (e) {
      console.error(e);
    }
    onNext();
  };

  if (isCompact) return null;

  return (
    <BrowserContainer>
      <BrowserTopBar>
        <Actions>
          <Circle $bgColor='var(--accent-red-primary)' />
          <Circle $bgColor='var(--accent-yellow-primary)' />
          <Circle $bgColor='var(--accent-green-primary)' />
        </Actions>
      </BrowserTopBar>
      <WhaleModal>
        <GlobalStyle />
        <PaddedContainer>
          {state === QuickAliasTutorialState.INPUT && (
            <>
              <IconTitleContainer>
                <IconGradientContainer>
                  <Illustration illustration={Illustrations.Whale} />
                </IconGradientContainer>
                <TextContainer>
                  <Typography size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
                    Sign up for Whalemart
                  </Typography>
                  <Typography color='secondary' wrap>
                    Dive into a sea of savings and catch the biggest deals in the deep blue.
                  </Typography>
                </TextContainer>
              </IconTitleContainer>
              <InputContainer ref={containerRef}>
                <Typography color='disabled'>Your email</Typography>
                <ButtonToggle
                  $color={fullyTypedIn ? 'var(--accent-green-primary)' : undefined}
                  $fullyTypedIn={fullyTypedIn}
                >
                  <Tooltip open={!!showTooltip} placement={TooltipPlacement.TOP_START}>
                    <TooltipContent>
                      <Typography forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
                        {showTooltip}
                      </Typography>
                    </TooltipContent>
                    <InputFieldAnimateContainer>
                      <TooltipTrigger style={{ width: '100%' }}>
                        <StyledInputField
                          $cursorPosition={widthUpToCursor}
                          $subdomain={tutorialSubdomain}
                          autoFocus
                          error={showError}
                          innerRef={inputRef}
                          onChange={handleInputChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !!email) {
                              onNext();
                            }
                          }}
                          placeholder={suggestedQuickAlias}
                          value={email}
                        />
                      </TooltipTrigger>
                    </InputFieldAnimateContainer>
                  </Tooltip>
                  {(email.length === 0 || fullyTypedIn) && (
                    <div className='animating'>
                      <div className='innerAnimated' />
                    </div>
                  )}
                </ButtonToggle>
              </InputContainer>
            </>
          )}
          {state === QuickAliasTutorialState.SENT && (
            <>
              <SentContainer>
                <AnimatePresence>
                  {!showCheck && (
                    <>
                      <motion.div key='spinner' variants={spinnerVariants}>
                        <Relative>
                          <Absolute>
                            <CircularProgress progressColor='blue' size={Size.LARGE} spinner thickness={1} />
                          </Absolute>
                        </Relative>
                      </motion.div>
                      <ColoredFeather>
                        <Illustration illustration={Illustrations.Whale} />
                      </ColoredFeather>
                    </>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {showCheck && (
                    <motion.div animate='visible' initial='hidden' key='check' variants={checkVariants}>
                      <ColoredFeather>
                        <Icons icon={Icon.CheckCircle} size={40} />
                      </ColoredFeather>
                    </motion.div>
                  )}
                </AnimatePresence>
                <SentText>
                  <Typography align={Alignment.CENTER} size={TypographySize.H4} weight={TypographyWeight.MEDIUM} wrap>
                    An email has been sent to{' '}
                    <BlueText>
                      {email.includes(domain)
                        ? email
                        : `${email.includes('@') ? email.split('@')[0] || '' : email}@${domain}`}
                    </BlueText>
                  </Typography>
                  <Typography color='secondary'>Check your inbox to finish signing in</Typography>
                </SentText>
              </SentContainer>
            </>
          )}
        </PaddedContainer>
        {state === QuickAliasTutorialState.INPUT && (
          <CTAContainer>
            <ContinueButton $disabled={!fullyTypedIn} onClick={() => void onContinue()}>
              <Typography color='white' size={TypographySize.LARGE} weight={TypographyWeight.MEDIUM}>
                Continue
              </Typography>
            </ContinueButton>
          </CTAContainer>
        )}
      </WhaleModal>
    </BrowserContainer>
  );
}
