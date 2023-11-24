import { motion } from 'framer-motion';
import React, { ForwardedRef } from 'react';
import styled from 'styled-components';

import { DISPLAY_SCROLLBAR_CSS } from 'nightwatch-ui';
import ActionSidebarItem from './ActionSidebarItem';
import { SidebarProps } from './Sidebar.types';
import SidebarSection from './SidebarSection';

const SidebarContainer = styled.div<{ width?: number }>`
  flex-shrink: 0;
  background: var(--bg-sidepanel);
  text-align: left;
  flex-direction: column;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  overflow: hidden;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  border-right: 1px solid var(--border-tertiary);
  width: ${({ width }) => `${width || 240}px`};
`;

const ItemList = styled.div<{ $hasFooter?: boolean }>`
  overflow: auto;
  ::-webkit-scrollbar-thumb {
    background: transparent;
  }
  :hover {
    ${DISPLAY_SCROLLBAR_CSS}
  }
  flex-direction: column;
  display: flex;
  gap: ${(props) => (props.$hasFooter ? 0 : 12)}px;
  height: ${(props) => (props.$hasFooter ? 'calc(100% - 212px)' : '100%')};
`;

const ActionItemsList = styled(motion.div)`
  display: inherit;
  flex-direction: column;
  gap: 4px;
`;

const PrimaryActions = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-tertiary);
`;

const FooterContainer = styled.div`
  margin-top: auto;
`;

export const SidebarDataTest = {
  openComposeButton: 'open-compose-button'
};

const Sidebar = (
  { AppSwitcher, className, primaryActions, sections, Footer, width, isCollapsed, onClick, id }: SidebarProps,
  ref: ForwardedRef<HTMLDivElement | null>
) => {
  return (
    <SidebarContainer id={id} onClick={onClick} ref={ref} width={width} className={className}>
      {AppSwitcher}
      {!!primaryActions?.length && (
        <PrimaryActions>
          <ActionItemsList>
            {primaryActions.map((action) => (
              <ActionSidebarItem color={action?.color} isMinimized={isCollapsed} {...action} key={action.label} />
            ))}
          </ActionItemsList>
        </PrimaryActions>
      )}
      {!isCollapsed && (
        <ItemList $hasFooter={!!Footer}>
          {sections.map((section) => (
            <SidebarSection {...section} key={section.id} />
          ))}
        </ItemList>
      )}
      {Footer && !isCollapsed && <FooterContainer>{Footer}</FooterContainer>}
    </SidebarContainer>
  );
};

export default React.forwardRef<HTMLDivElement | null, SidebarProps>(Sidebar);
