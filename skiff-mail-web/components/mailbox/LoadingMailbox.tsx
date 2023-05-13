import { Illustration, Illustrations } from 'skiff-front-utils';
import styled from 'styled-components';

import { fadeInAnimation } from './Mailbox.styles';

const LoadingMailboxContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  justify-content: center;

  opacity: 1;
  animation: ${fadeInAnimation} 0.2s linear;
`;

export const LoadingMailbox: React.FC = () => {
  return (
    <LoadingMailboxContainer>
      <Illustration illustration={Illustrations.LoadingSkiffLogo} />
    </LoadingMailboxContainer>
  );
};

export default LoadingMailbox;
