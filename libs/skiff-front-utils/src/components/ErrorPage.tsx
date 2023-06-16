import {
  Alignment,
  Button,
  Icon,
  Icons,
  Size,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { SnackbarProvider } from 'notistack';
import { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { SendFeedbackDocument, SendFeedbackMutation, SendFeedbackMutationVariables } from 'skiff-front-graphql';
import styled from 'styled-components';
import { SKIFF_PUBLIC_WEBSITE } from '../constants/routes.constants';
import { getFeedbackTokens } from '../utils';
import { FeedbackModal } from './modals';

const IconTextContainer = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 336px;
  gap: 24px;
`;

const IconContainer = styled.div`
  width: 72px;
  height: 72px;
  aspect-ratio: 1;
  border-radius: 100px;
  background: var(--bg-l0-solid);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
`;

const AbsoluteContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  flex-direction: center;
  z-index: 99999999;
  background: var(--bg-l3-solid);
  position: absolute;
  top: 0px;
  left: 0px;
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  padding: 16px;
  width: 374px;
  gap: 8px;
  background: var(--bg-overlay-tertiary);
  border-radius: 8px;
`;

const Highlight = styled.span`
  color: var(--text-link);
  font-weight: 470;
  padding: 0px 4px;
  background: var(--bg-overlay-tertiary);
  border-radius: 4px;
`;

const Link = styled.span`
  cursor: pointer;
  color: var(--text-link);
`;

const sendFeedback = async (
  client: ApolloClient<NormalizedCacheObject>,
  origin: string,
  feedbackText: string,
  supportingFiles?: File[]
) => {
  const zendeskUploadTokens: string[] = [];
  if (supportingFiles?.length) {
    zendeskUploadTokens.push(...(await getFeedbackTokens(supportingFiles)));
  }
  if (feedbackText.length) {
    await client.mutate<SendFeedbackMutation, SendFeedbackMutationVariables>({
      mutation: SendFeedbackDocument,
      variables: {
        request: {
          feedback: feedbackText,
          zendeskUploadTokens,
          isMobile,
          origin,
          isNative: false
        }
      }
    });
  }
};

interface ErrorPageProps {
  client: ApolloClient<NormalizedCacheObject>;
  origin: string;
  isDbError?: boolean;
}

function ErrorPage(props: ErrorPageProps) {
  const { client, origin, isDbError } = props;
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <>
      <AbsoluteContainer>
        <IconTextContainer>
          <IconContainer>
            <Icons icon={Icon.Warning} size={Size.LARGE} />
          </IconContainer>
          <TextContainer>
            <Typography align={Alignment.CENTER} size={TypographySize.H3} weight={TypographyWeight.BOLD}>
              {isDbError ? 'Check your browser settings' : 'Unable to load page'}
            </Typography>
            <Typography align={Alignment.CENTER} color='secondary' wrap>
              {isDbError
                ? `Unable to load Skiff ${origin} due to browser settings. Try the following:`
                : ' Please try again or get in touch with our team for further help'}
            </Typography>
          </TextContainer>
          {isDbError && (
            <InfoContainer>
              <Typography color='secondary'>
                · Disable <Highlight>browser extensions</Highlight>
              </Typography>
              <Typography color='secondary'>
                · Disable <Highlight>Never Remember History</Highlight> on Firefox
              </Typography>
              <Typography color='secondary'>
                · Exit <Highlight>Private Window</Highlight> on Firefox
              </Typography>
            </InfoContainer>
          )}
          <ButtonContainer>
            <Button fullWidth onClick={() => setShowFeedbackModal(true)} size={Size.LARGE}>
              Send feedback
            </Button>
            <Button
              dataTest='error-reload'
              fullWidth
              onClick={() => window.location.reload()}
              size={Size.LARGE}
              type={Type.SECONDARY}
            >
              Reload
            </Button>
          </ButtonContainer>
          <Typography color='secondary' size={TypographySize.LARGE}>
            Visit our&nbsp;
            <Link
              data-test='go-to-skiff-org'
              onClick={() => {
                window.open(`${SKIFF_PUBLIC_WEBSITE}/help`, '_blank', 'noopener noreferrer');
              }}
            >
              help page
            </Link>
          </Typography>
        </IconTextContainer>
      </AbsoluteContainer>
      <SnackbarProvider maxSnack={7} preventDuplicate>
        <FeedbackModal
          onClose={() => setShowFeedbackModal(false)}
          open={showFeedbackModal}
          sendFeedback={(feedbackText, supportingFiles) => sendFeedback(client, origin, feedbackText, supportingFiles)}
        />
      </SnackbarProvider>
    </>
  );
}

export default ErrorPage;
