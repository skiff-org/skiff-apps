import { Editor } from '@tiptap/core';
import {
  DROPDOWN_CALLER_CLASSNAME,
  getThemedColor,
  Icon,
  Icons,
  IconText,
  Portal,
  Size,
  ThemeMode,
  Typography,
  TypographyWeight,
  useOnClickOutside
} from 'nightwatch-ui';
import { FC, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';

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

const DropdownContainer = styled.div<{ $icon?: boolean }>`
  position: absolute;
  background: var(--bg-emphasis);
  box-sizing: border-box;
  display: flex;
  flex-direction: ${(props) => (props.$icon ? 'row' : 'column')};
  align-items: flex-start;
  width: ${(props) => (props.$icon ? 'fit-content' : '216px')};

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

const IconHover = styled.div<{ $active: boolean; $disabled: boolean; $forceTheme?: ThemeMode }>`
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
      background: ${getThemedColor(
        props?.$forceTheme === ThemeMode.LIGHT ? 'var(--bg-overlay-tertiary)' : 'var(--bg-overlay-secondary)',
        props?.$forceTheme ?? ThemeMode.DARK
      )};
    `}
  ${(props) =>
    props.$disabled &&
    css`
      background: transparent;
    `}
  &:hover {
    background: ${(props) =>
      getThemedColor(
        props?.$forceTheme === ThemeMode.LIGHT ? 'var(--bg-overlay-tertiary)' : 'var(--bg-overlay-secondary)',
        props?.$forceTheme ?? ThemeMode.DARK
      )};
  }
`;

const IconChevron = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const ToolBarDropdownGroup: FC<Omit<ToolbarGroupProps & { forceTheme?: ThemeMode }, 'type'>> = ({
  commands,
  editor,
  showIcon,
  forceTheme
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const groupContainerRef = useRef<HTMLDivElement>(null);
  const { showFormatBar } = useAppSelector((state) => state.modal);
  useOnClickOutside(
    dropdownRef,
    () => {
      setOpen(false);
    },
    ['ignoreThisClick']
  );

  const groupRect = groupContainerRef?.current?.getBoundingClientRect();
  const dropdownRect = dropdownRef.current?.getBoundingClientRect();
  const openUpwards =
    showFormatBar || (dropdownRect?.height || 0) + (groupRect?.top || 0) >= window.innerHeight - OPEN_UPWARDS_OFFSET;

  const currentActiveLabel =
    commands
      .filter(({ active }) => active(editor))
      // Get the highest priority active item
      .sort(({ priority: p1 }, { priority: p2 }) => (p2 || 0) - (p1 || 0))[0]?.label || commands[0]?.label;

  const currentActiveIcon =
    commands
      .filter(({ active }) => active(editor))
      // Get the highest priority active item
      .sort(({ priority: p1 }, { priority: p2 }) => (p2 || 0) - (p1 || 0))[0]?.icon || commands[0]?.icon;
  return (
    <>
      <ToolBarDropdownGroupContainer
        className='ignoreThisClick'
        onClick={() => {
          setOpen((o) => !o);
        }}
        ref={groupContainerRef}
      >
        {!showIcon && (
          <>
            <Typography forceTheme={forceTheme || ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
              {currentActiveLabel}
            </Typography>
            <Icons
              color='secondary'
              forceTheme={forceTheme || ThemeMode.DARK}
              icon={open ? Icon.ChevronUp : Icon.ChevronDown}
            />
          </>
        )}
        {showIcon && currentActiveIcon && (
          <IconChevron>
            <Icons forceTheme={forceTheme || ThemeMode.DARK} icon={currentActiveIcon} />
            <Icons
              color='secondary'
              forceTheme={forceTheme || ThemeMode.DARK}
              icon={open ? Icon.ChevronUp : Icon.ChevronDown}
              size={Size.SMALL}
            />
          </IconChevron>
        )}
      </ToolBarDropdownGroupContainer>
      <Portal>
        <DropdownContainer
          $icon={showIcon}
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
                {!showIcon && (
                  <>
                    <IconBox>
                      <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={icon} />
                    </IconBox>
                    <Typography forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
                      {label}
                    </Typography>
                  </>
                )}
                {showIcon && (
                  <IconText
                    color={icon === currentActiveIcon ? 'primary' : 'secondary'}
                    forceTheme={ThemeMode.DARK}
                    startIcon={icon}
                  />
                )}
              </DropdownItemContainer>
            ))}
        </DropdownContainer>
      </Portal>
    </>
  );
};

const ToolBarNormalGroup: FC<Omit<ToolbarGroupProps & { forceTheme?: ThemeMode }, 'type'>> = ({
  commands,
  editor,
  forceTheme
}) => (
  <>
    {commands.map(({ active, icon, command, enabled, label }) => (
      <IconHover
        $active={active(editor)}
        $disabled={!enabled(editor)}
        $forceTheme={forceTheme}
        key={label}
        onClick={() => command(editor)}
      >
        <Icons
          color={!enabled(editor) ? 'disabled' : !!forceTheme ? 'secondary' : 'primary'}
          forceTheme={forceTheme || ThemeMode.DARK}
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
  showIcon?: boolean;
}

const ToolBarGroup: FC<ToolbarGroupProps & { forceTheme?: ThemeMode }> = ({ commands, type, editor, forceTheme }) => {
  if (type === ToolBarCommandGroupTypes.Normal) {
    return <ToolBarNormalGroup commands={commands} editor={editor} forceTheme={forceTheme} />;
  } else if (type === ToolBarCommandGroupTypes.Dropdown) {
    return <ToolBarDropdownGroup commands={commands} editor={editor} forceTheme={forceTheme} />;
  } else if (type === ToolBarCommandGroupTypes.DropdownIcon) {
    return <ToolBarDropdownGroup commands={commands} editor={editor} forceTheme={forceTheme} showIcon />;
  } else {
    return null;
  }
};

export default ToolBarGroup;
