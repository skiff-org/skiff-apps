import { AnimateSharedLayout } from 'framer-motion';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';

const ComposePanelContainer = styled.div<{ $collapsed: boolean }>`
  position: absolute;
  width: fit-content;
  padding: 0px;
  width: ${(props) => (props.$collapsed ? '340px' : '572px')};
  box-sizing: border-box;
  box-shadow: var(--shadow-l2);
  border: 1px solid var(--border-secondary);
  border-radius: 12px 12px 0px 0px;
  margin-left: 20px;
  right: 16px;
  bottom: 0px;
  position: fixed;
  z-index: 999;
  backdrop-filter: blur(72px);
  background: ${(props) => (props.$collapsed ? 'var(--bg-emphasis)' : 'var(--bg-l2-solid)')};
  // Hide scrollbar
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

type ComposePanelProps = {
  children: React.ReactNode;
  open: boolean;
};

const ComposePanel: React.FC<ComposePanelProps> = (props: ComposePanelProps) => {
  const { children, open } = props;
  const { isComposeCollapsed } = useAppSelector((state) => state.modal);

  if (!open) return null;

  return (
    <AnimateSharedLayout>
      <ComposePanelContainer $collapsed={isComposeCollapsed}>{children}</ComposePanelContainer>
    </AnimateSharedLayout>
  );
};

export default ComposePanel;
