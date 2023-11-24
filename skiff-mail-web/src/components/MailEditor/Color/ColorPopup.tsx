import { Editor } from '@tiptap/react';
import {
  ACCENT_COLOR_VALUES,
  accentColorToPrimaryColor,
  DROPDOWN_CALLER_CLASSNAME,
  getThemedColor,
  Portal,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight,
  useOnClickOutside
} from 'nightwatch-ui';
import { FC, useEffect, useRef, useState } from 'react';
import { ColorSelector } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useGetPopupPosition } from '../mailEditorUtils';
import { getColor, getHighlightColor, TOOLBAR_CONTAINER } from '../ToolBar/ToolBar';

const Container = styled.div<{ $first: boolean }>`
  position: absolute;
  z-index: 999999999999;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 8px;
  gap: 10px;

  width: fit-content;

  background: var(--bg-emphasis);
  border: 1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)};

  box-shadow: var(--shadow-l2);
  border-radius: 8px;
  ${(props) => props.$first && 'opacity: 0;'}
`;

const HeaderColorBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
`;

const PrimaryColor = styled.div`
  background: ${getThemedColor('var(--text-primary)', ThemeMode.DARK)};
  border: 1px solid ${getThemedColor('var(--border-primary)', ThemeMode.DARK)};
  box-sizing: border-box;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const ColorContainer = styled.div<{ $isSelected?: boolean; $disabled?: boolean }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  min-width: 28px;
  height: 28px;
  border-radius: 28px;
  margin: 2px;
  cursor: pointer;

  ${(props) =>
    props.$isSelected &&
    `
  border: 2px white solid !important;
  `}

  ${(props) =>
    !props.$disabled &&
    `
    &:hover {
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
  `}
`;

const InlineColor = styled.div`
  display: flex;
  align-items: center;
`;

const NoHighlight = styled.div<{ $isSelected?: boolean }>`
  box-sizing: border-box;
  border-radius: 100px;
  border: 1px solid ${getThemedColor('var(--icon-disabled)', ThemeMode.DARK)};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  &:hover {
    border: 1px solid ${getThemedColor('var(--icon-secondary)', ThemeMode.DARK)};
  }
  &::before {
    content: '';
    position: absolute;
    bottom: 24x;
    left: 14px;
    width: 20px;
    height: 1px;
    background: ${getThemedColor('var(--icon-destructive)', ThemeMode.DARK)};
    transform: rotate(-45deg);
    transform-origin: center;
  }
`;

const FORMAT_TOP_OFFSET = -164;
const FORMAT_LEFT_OFFSET = 48;

interface ColorPopupProps {
  editor: Editor;
  editorContainerRef: React.RefObject<HTMLDivElement>;
}
/**
 * This is the popup that opens when hovering/clicking a link
 */
const ColorPopup: FC<ColorPopupProps> = ({ editor, editorContainerRef }) => {
  const { showFormatBar } = useAppSelector((state) => state.modal);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerColorContainerRef = useRef<HTMLDivElement>(null);

  const [first, setFirst] = useState<boolean>(true);
  const position = useGetPopupPosition(editor, containerRef, editorContainerRef, TOOLBAR_CONTAINER, showFormatBar);

  const closePopup = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    editor.commands.closeColorPopup();
  };

  useOnClickOutside(containerRef, closePopup, undefined, undefined, [pickerColorContainerRef]);

  // Handle transition
  useEffect(() => {
    setTimeout(() => {
      setFirst(false);
    }, 100);
  }, []);

  return (
    <>
      <Portal>
        <Container
          $first={first}
          className={DROPDOWN_CALLER_CLASSNAME}
          ref={containerRef}
          style={{ left: position.left, top: position.top }}
        >
          <HeaderColorBlock>
            <Typography
              color='secondary'
              forceTheme={ThemeMode.DARK}
              size={TypographySize.CAPTION}
              weight={TypographyWeight.BOLD}
            >
              TEXT
            </Typography>
            <InlineColor>
              <ColorContainer
                $isSelected={
                  getColor(editor).value === 'var(--text-always-white)' ||
                  getColor(editor).value === 'var(--text-primary)'
                }
                onClick={() => {
                  editor.commands.setColor('var(--text-primary)');
                }}
              >
                <PrimaryColor />
              </ColorContainer>
              <ColorSelector
                colorToStyling={accentColorToPrimaryColor}
                handleChange={(selectedColor) => {
                  editor.commands.setColor(ACCENT_COLOR_VALUES[selectedColor][0]);
                }}
                handlePickerChange={(color: string) => {
                  editor.chain().focus().setColor(color).run();
                }}
                pickerLeftOffset={showFormatBar ? 48 : undefined}
                pickerTopOffset={showFormatBar ? -164 : undefined}
                showHover
                pickerColorContainerRef={pickerColorContainerRef}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={getColor(editor).name}
              />
            </InlineColor>
          </HeaderColorBlock>
          <HeaderColorBlock>
            <Typography
              color='secondary'
              forceTheme={ThemeMode.DARK}
              size={TypographySize.CAPTION}
              weight={TypographyWeight.BOLD}
            >
              HIGHLIGHT
            </Typography>
            <InlineColor>
              <ColorContainer
                $disabled
                onClick={() => {
                  editor.commands.unsetHighlight();
                }}
              >
                <NoHighlight />
              </ColorContainer>
              <ColorSelector
                colorToStyling={accentColorToPrimaryColor}
                handleChange={(selectedColor) => {
                  editor.commands.setHighlight({ color: ACCENT_COLOR_VALUES[selectedColor][1] });
                }}
                handlePickerChange={(highlightColorValue: string) => {
                  editor.chain().focus().setHighlight({ color: highlightColorValue }).run();
                }}
                isHighlight
                pickerLeftOffset={showFormatBar ? FORMAT_LEFT_OFFSET : undefined}
                pickerTopOffset={showFormatBar ? FORMAT_TOP_OFFSET : undefined}
                showHover
                pickerColorContainerRef={pickerColorContainerRef}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={getHighlightColor(editor).name}
              />
            </InlineColor>
          </HeaderColorBlock>
        </Container>
      </Portal>
    </>
  );
};

export default ColorPopup;
