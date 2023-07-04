import { Icon, Icons, IconText, IconTextProps, Size } from '@skiff-org/skiff-ui';
import React, { useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';

import IconTextWithEndActions, { IconTextEndAction } from '../IconTextWithEndActions';

import { SidebarHeaderProps, SidebarSectionType } from './Sidebar.types';

const Header = styled.div<{ $collapsible: boolean }>`
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  height: 32px;
  max-height: 32px;
  justify-content: space-between;
  box-sizing: border-box;
  border-radius: 4px;

  ${(props) =>
    props.$collapsible
      ? `
          user-select: none;
          padding: 4px 4px 4px 8px;
          margin: 0px 6px;
          cursor: pointer;

          &:hover {
            background: var(--bg-overlay-tertiary);
          }
        `
      : `
          padding: 4px 12px 4px 16px;
          margin-top: 4px;
        `}
`;

const NewLabelContainerStyle = styled.div`
  display: flex;
  width: 100%;
  border-radius: 4px;
  box-sizing: border-box;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
`;

const SectionHeaderContainer = ({
  onOver,
  acceptedDragType,
  children
}: {
  onOver: () => void;
  acceptedDragType: string;
  children?: React.ReactNode;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: acceptedDragType,
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  useEffect(() => {
    if (isOver) {
      onOver();
    }
  }, [isOver, onOver]);

  return <NewLabelContainerStyle ref={drop}>{children}</NewLabelContainerStyle>;
};

const SectionHeader = ({
  acceptedDragType,
  label,
  type,
  titleButton,
  toggleOpenState,
  isOpen,
  canDragToSection = true
}: SidebarHeaderProps) => {
  const [hover, setHover] = useState(false);

  const isCollapsible = type === SidebarSectionType.Collapsible;
  const iconTextProps: IconTextProps = {
    color: 'disabled',
    label,
    size: Size.SMALL,
    uppercase: true,
    mono: true
  };

  const getEndActions = () => {
    const actions: IconTextEndAction[] = [];
    if (!!titleButton) {
      actions.push({
        icon: <Icons color='secondary' icon={Icon.Plus} />,
        onClick: titleButton.onClick,
        tooltip: titleButton.tooltip
      });
    }
    if (isCollapsible) {
      actions.push({
        icon: <Icons color='secondary' icon={Icon.ChevronRight} rotate={isOpen ? 90 : 0} />,
        onClick: () => toggleOpenState()
      });
    }
    return actions;
  };

  const endActions = getEndActions();

  return (
    <SectionHeaderContainer
      acceptedDragType={acceptedDragType}
      onOver={() => {
        if (canDragToSection) toggleOpenState(true);
      }}
    >
      <Header
        $collapsible={isCollapsible}
        onClick={isCollapsible ? () => toggleOpenState() : undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {!endActions.length && <IconText {...iconTextProps} />}
        {!!endActions.length && (
          <IconTextWithEndActions endActions={endActions} showEndActions={hover} {...iconTextProps} />
        )}
      </Header>
    </SectionHeaderContainer>
  );
};

export default SectionHeader;
