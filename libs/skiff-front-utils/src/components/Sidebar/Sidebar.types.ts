import { Icon } from '@skiff-org/skiff-ui';
import React from 'react';

export enum SidebarSectionType {
  Collapsible,
  NonCollapsible
}

export type SidebarSectionContent = {
  type: SidebarSectionType;
  label: string;
  items: {
    SectionItem: React.FC;
    key: string;
  }[];
  acceptedDragType: string;
  noItemsLabel: string;
  titleButton?: {
    onClick: (e?: React.MouseEvent<Element, MouseEvent>) => void;
    tooltip: string;
  };
};

type NodeSection = {
  id: string;
  isCustom: true;
  content: JSX.Element;
  defaultIsOpenVal?: boolean;
};

export type ContentSection = {
  id: string;
  content: SidebarSectionContent;
  isCustom?: false;
  defaultIsOpenVal?: boolean;
  canDragToSection?: boolean;
};

export type SidebarSectionProps = NodeSection | ContentSection;

export interface ActionSidebarItemProps {
  label: string;
  icon: Icon;
  // whether button should stand out as white
  primaryAction?: boolean;
  spinner?: boolean;
  progress?: number;
  dataTest?: string;
  tooltip?: string;
  color?: 'primary' | 'secondary';
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  isMinimized?: boolean;
  endLabel?: string;
  className?: string;
}

export type SidebarProps = {
  AppSwitcher?: React.ReactNode;
  primaryActions?: ActionSidebarItemProps[];
  sections: SidebarSectionProps[];
  Footer?: React.ReactNode;
  width?: number;
  isCollapsed?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  id?: string;
};

export type SidebarHeaderProps = SidebarSectionContent & {
  toggleOpenState: (forceValue?: boolean) => void;
  isOpen: boolean;
  canDragToSection?: boolean;
};
