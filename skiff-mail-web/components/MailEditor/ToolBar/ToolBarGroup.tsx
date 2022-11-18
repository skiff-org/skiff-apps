import { Editor } from '@tiptap/core';
import { Icon, IconButton, IconText, useOnClickOutside } from 'nightwatch-ui';
import { FC, useRef, useState } from 'react';
import styled from 'styled-components';

import { ToolBarCommand, ToolBarCommandGroupTypes } from './commands/types';

// the minimal distance from the floor
const OPEN_UPWARDS_OFFSET = 30;

const ToolBarDropdownGroupContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  cursor: pointer;
`;

const DropdownContainer = styled.div`
  position: absolute;
  background-color: var(--bg-emphasis);
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 187px;
  padding: 14px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  top: 0;
  left: 0;
  gap: 8px;
  -webkit-backdrop-filter: blur(72px);
  backdrop-filter: blur(72px);
  border-radius: 8px;
  z-index: 9999;
`;

const DropdownItemContainer = styled.div`
  box-sizing: border-box;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 6px;
  width: 100%;
  &:hover {
    background: rgba(235, 243, 255, 0.08);
  }
`;

const ToolBarDropdownGroup: FC<Omit<ToolbarGroupProps, 'type'>> = ({ commands, editor }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const groupContainerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(
    dropdownRef,
    () => {
      setOpen(false);
    },
    ['ignoreThisClick']
  );

  const openUpwards =
    (dropdownRef.current?.getBoundingClientRect()?.height || 0) +
      (groupContainerRef.current?.getBoundingClientRect()?.top || 0) >=
    window.innerHeight - OPEN_UPWARDS_OFFSET;

  const currentActive =
    commands
      .filter(({ active }) => active(editor))
      // Get the highest priority active item
      .sort(({ priority: p1 }, { priority: p2 }) => (p2 || 0) - (p1 || 0))[0]?.label || commands[0].label;

  return (
    <>
      <ToolBarDropdownGroupContainer
        className='ignoreThisClick'
        onClick={() => {
          setOpen((o) => !o);
        }}
        ref={groupContainerRef}
      >
        <IconText color='white' endIcon={open ? Icon.ChevronUp : Icon.ChevronDown} label={currentActive} level={3} />
      </ToolBarDropdownGroupContainer>
      {
        <DropdownContainer
          className='toolbar-dropdown'
          ref={dropdownRef}
          style={{
            transform: openUpwards ? 'translateY(calc(-5px - 100%))' : 'translateY(48px)',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none'
          }}
        >
          {commands
            .filter(({ enabled }) => enabled(editor))
            .map(({ icon, command, label }) => (
              <DropdownItemContainer key={label}>
                <IconText
                  label={label}
                  onClick={() => {
                    setOpen(false);
                    command(editor);
                  }}
                  startIcon={icon}
                  themeMode='dark'
                  type='paragraph'
                />
              </DropdownItemContainer>
            ))}
        </DropdownContainer>
      }
    </>
  );
};

const ToolBarNormalGroup: FC<Omit<ToolbarGroupProps, 'type'>> = ({ commands, editor }) => (
  <>
    {commands.map(({ active, icon, command, enabled, label }) => (
      <IconButton
        active={active(editor)}
        disabled={!enabled(editor)}
        icon={icon}
        key={label}
        onClick={() => command(editor)}
        themeMode='dark'
        tooltip={label}
      />
    ))}
  </>
);

interface ToolbarGroupProps {
  commands: ToolBarCommand[];
  type: ToolBarCommandGroupTypes;
  editor: Editor;
}

const ToolBarGroup: FC<ToolbarGroupProps> = ({ commands, type, editor }) =>
  type === ToolBarCommandGroupTypes.Normal ? (
    <ToolBarNormalGroup commands={commands} editor={editor} />
  ) : (
    <ToolBarDropdownGroup commands={commands} editor={editor} />
  );

export default ToolBarGroup;
