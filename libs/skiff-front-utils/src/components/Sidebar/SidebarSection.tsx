import { Typography } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import styled from 'styled-components';

import SectionHeader from './SectionHeader';
import { ContentSection, SidebarSectionProps, SidebarSectionType } from './Sidebar.types';
import { getCollapsedLSKey, parseLSValue, parseValueToLS } from './utils';

const NoItemsLabel = styled.div`
  padding: 6px 4px 6px 24px;
`;

const LabelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
`;

const SectionItems = ({
  type,
  items,
  noItemsLabel,
  isOpen
}: {
  type: SidebarSectionType;
  items: {
    SectionItem: React.FC;
    key: string;
  }[];
  noItemsLabel: string;
  isOpen: boolean;
}) => {
  return (
    <>
      {(type === SidebarSectionType.NonCollapsible || isOpen) && (
        <LabelList>
          {items.length ? (
            items.map(({ SectionItem, key }: any) => <SectionItem key={key} />)
          ) : (
            <NoItemsLabel>
              <Typography mono uppercase color='disabled'>
                {noItemsLabel}
              </Typography>
            </NoItemsLabel>
          )}
        </LabelList>
      )}
    </>
  );
};

const SidebarSection = (section: SidebarSectionProps) => {
  const getInitialOpenState = () => {
    const storedVal = localStorage.getItem(getCollapsedLSKey(section.id));
    const booleanStoredVal = parseLSValue(storedVal);
    return storedVal ? booleanStoredVal : !!section.defaultIsOpenVal;
  };
  const [isOpen, setIsOpen] = useState<boolean>(getInitialOpenState());

  if (section.isCustom) return section.content;

  const toggleCollapseState = (forceValue?: boolean) => {
    const newValue = forceValue ? forceValue : !parseLSValue(localStorage.getItem(getCollapsedLSKey(section.id)));
    localStorage.setItem(getCollapsedLSKey(section.id), parseValueToLS(newValue));
    setIsOpen(newValue);
  };

  const { content, canDragToSection } = section as ContentSection;

  return (
    <>
      <SectionHeader
        {...content}
        canDragToSection={canDragToSection}
        isOpen={isOpen}
        key={section.id}
        toggleOpenState={toggleCollapseState}
      />
      <SectionItems
        isOpen={isOpen}
        items={content.items}
        noItemsLabel={content.noItemsLabel}
        type={section.content.type}
      />
    </>
  );
};

export default React.memo(SidebarSection);
