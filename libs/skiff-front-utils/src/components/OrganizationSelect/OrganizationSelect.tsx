import Portal from '@mui/material/Portal';
import { AnimatePresence } from 'framer-motion';
import { BANNER_HEIGHT, useOnClickOutside } from '@skiff-org/skiff-ui';
import React, { useState, useRef } from 'react';
import { isMobile } from 'react-device-detect';

import { AppSection } from './AppSection';
import {
  DROPDOWN_OFFSET,
  OrganizationSelectProps,
  OrgSelectDropdown,
  ReferenceContainer,
  WorkspaceSection,
  WorkspaceOptionItem,
  BlockPointerWindow
} from './OrganizationSelect.constants';
import { OrgButton } from './OrgButton';
import { OrgSection } from './OrgSection';

const getActiveWorkspace = (section: WorkspaceSection): WorkspaceOptionItem => {
  const activeWorkspace = section?.workspaces
    .filter(({ active }) => active)
    .flat()
    .filter(Boolean)[0];
  return activeWorkspace || section.workspaces[0];
};

export const OrganizationSelect = (props: OrganizationSelectProps) => {
  const {
    anchor,
    activeApp,
    actions,
    numBannersOpen,
    customOnClicks,
    forceOpen,
    section,
    label,
    sidepanelOpen = false,
    numUnread,
    storeWorkspaceEvent,
    username,
    blockPointerEvents
  } = props;

  const activeWorkspace = section ? getActiveWorkspace(section) : undefined;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle outside clicks
  const wrapperRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const dropdownRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);

  useOnClickOutside(
    dropdownRef,
    () => {
      setDropdownOpen(false);
    },
    [],
    {}, // Use default event handling
    [], // No excluded refs
    isMobile
  );

  return (
    <ReferenceContainer data-test={'organization-select-loaded'} ref={wrapperRef}>
      {!forceOpen && (
        <OrgButton
          activeApp={activeApp}
          activeWorkspace={activeWorkspace}
          loading={false}
          sidepanelOpen={sidepanelOpen}
          toggleDropdown={() => setDropdownOpen((prev: boolean) => !prev)}
        />
      )}
      <AnimatePresence>
        {(forceOpen || dropdownOpen) && (
          // Org Dropdown
          <Portal>
            {blockPointerEvents && <BlockPointerWindow />}
            <OrgSelectDropdown
              animate={{ opacity: 1, scale: 1 }}
              data-test='organization-select'
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              ref={dropdownRef}
              style={
                !!anchor
                  ? {
                      ...anchor
                    }
                  : {
                      top: DROPDOWN_OFFSET + (numBannersOpen || 0) * BANNER_HEIGHT,
                      left: 0,
                      originX: '0px',
                      originY: '0px'
                    }
              }
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
            >
              <AppSection
                activeApp={activeApp}
                closeDropdown={() => setDropdownOpen(false)}
                customOnClicks={customOnClicks}
                label={label}
                numUnread={numUnread}
                storeWorkspaceEvent={storeWorkspaceEvent}
                username={username}
              />
              <OrgSection
                actions={actions}
                closeDropdown={() => setDropdownOpen(false)}
                disabled={forceOpen}
                section={section}
              />
            </OrgSelectDropdown>
          </Portal>
        )}
      </AnimatePresence>
    </ReferenceContainer>
  );
};
