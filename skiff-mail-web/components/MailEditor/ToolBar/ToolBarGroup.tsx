import {
  DROPDOWN_CALLER_CLASSNAME,
  getThemedColor,
  Icon,
  Icons,
  Portal,
  Size,
  ThemeMode,
  Typography,
  TypographyWeight,
  useOnClickOutside
} from '@skiff-org/skiff-ui';
import { Editor } from '@tiptap/core';
import { FC, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { ToolBarCommand, ToolBarCommandGroupTypes } from './commands/types';

// the minimal distance from the floor
const OPEN_UPWARDS_OFFSET = 30;
const DROPDOWN_GAP = 6;
const ToolBarDropdownGroupContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  padding-left: 8px;
  gap: 6px;
  box-sizing: border-box;
  user-select: none;
  cursor: pointer;
  border-radius: 6px;
  &:hover {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
  }
`;

const DropdownContainer = styled.div`
  position: absolute;
  background: var(--bg-emphasis);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 216px;
  padding: 4px;
  border: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};
  top: -6px;
  left: 0;
  box-shadow: var(--shadow-l2);
  border-radius: 8px;
  z-index: 999999999999;
`;

const DropdownItemContainer = styled.div`
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  user-select: none;
  border-radius: 8px;
  padding: 4px;
  gap: 8px;
  width: 100%;
  &:hover {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
  }
`;

const IconBox = styled.div`
  display: flex;
  align-items: center;
  width: 30px;
  height: 30px;
  justify-content: center;
  background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
  padding: 6px;
  box-sizing: border-box;
  border-radius: 4px;
  aspect-ratio: 1;
`;

const IconHover = styled.div<{ $active: boolean; $disabled: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;

  ${(props) =>
    props.$active &&
    css`
      background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
    `}
  ${(props) =>
    props.$disabled &&
    css`
      background: transparent;
    `}
  &:hover {
    background: ${getThemedColor('var(--bg-overlay-secondary)', ThemeMode.DARK)};
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

  const groupRect = groupContainerRef?.current?.getBoundingClientRect();
  const dropdownRect = dropdownRef.current?.getBoundingClientRect();
  const openUpwards = (dropdownRect?.height || 0) + (groupRect?.top || 0) >= window.innerHeight - OPEN_UPWARDS_OFFSET;

  const currentActive =
    commands
      .filter(({ active }) => active(editor))
      // Get the highest priority active item
      .sort(({ priority: p1 }, { priority: p2 }) => (p2 || 0) - (p1 || 0))[0]?.label || commands[0]?.label;

  return (
    <>
      <ToolBarDropdownGroupContainer
        className='ignoreThisClick'
        onClick={() => {
          setOpen((o) => !o);
        }}
        ref={groupContainerRef}
      >
        <Typography mono uppercase forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
          {currentActive}
        </Typography>
        <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={Icon.ChevronDown} />
      </ToolBarDropdownGroupContainer>
      <Portal>
        <DropdownContainer
          className={DROPDOWN_CALLER_CLASSNAME}
          ref={dropdownRef}
          style={{
            top:
              (groupRect?.top || 0) +
              (openUpwards ? -(dropdownRect?.height || 0) - DROPDOWN_GAP : (groupRect?.height || 0) + DROPDOWN_GAP),
            left: groupRect?.left || 0,
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none'
          }}
        >
          {commands
            .filter(({ enabled }) => enabled(editor))
            .map(({ icon, command, label }) => (
              <DropdownItemContainer
                key={label}
                onClick={() => {
                  setOpen(false);
                  command(editor);
                }}
              >
                <IconBox>
                  <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={icon} />
                </IconBox>
                <Typography mono uppercase forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
                  {label}
                </Typography>
              </DropdownItemContainer>
            ))}
        </DropdownContainer>
      </Portal>
    </>
  );
};

const ToolBarNormalGroup: FC<Omit<ToolbarGroupProps, 'type'>> = ({ commands, editor }) => (
  <>
    {commands.map(({ active, icon, command, enabled, label }) => (
      <IconHover $active={active(editor)} $disabled={!enabled(editor)} key={label} onClick={() => command(editor)}>
        <Icons
          color={!enabled(editor) ? 'disabled' : 'primary'}
          forceTheme={ThemeMode.DARK}
          icon={icon}
          size={Size.MEDIUM}
        />
      </IconHover>
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
