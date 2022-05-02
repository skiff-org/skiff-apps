import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

const MessageDetailsPanelContainer = styled.div`
  align-self: flex-end;
  width: 680px;
  height: 100%;
  max-height: calc(100vh - 96px);
  box-shadow: var(--shadow-l2);
  border: 1px solid var(--border-secondary);
  border-bottom: none;
  border-radius: 12px 12px 0px 0px;
  box-sizing: border-box;
  margin-left: 20px;
  right: 16px;

  display: flex;
  flex-direction: column;
  overflow: hidden;

  // Hide scrollbar
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  ${isMobile
    ? `
      max-height: 100vh;
      left: 0;
      position: absolute;
      width: 100vw;
      margin: 0;
      display: block;
      background: var(--bg-l1-solid);
      border-radius: 0;
      box-shadow: none;
      border: none;
    `
    : ''}
`;

type MessageDetailsPanelProps = {
  children: React.ReactNode;
  open: boolean;
};

const MessageDetailsPanel: React.FC<MessageDetailsPanelProps> = (props: MessageDetailsPanelProps) => {
  const { children, open } = props;
  if (!open) return null;

  return <MessageDetailsPanelContainer>{children}</MessageDetailsPanelContainer>;
};

export default MessageDetailsPanel;
