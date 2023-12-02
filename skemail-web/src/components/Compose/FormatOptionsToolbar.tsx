import { Editor } from '@tiptap/react';
import { Icon, IconText, Icons } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { toggleColor } from '../MailEditor/mailEditorUtils';
import { TOOLBAR_CONTAINER, getColor, getToolbarCommands } from '../MailEditor/ToolBar/ToolBar';
import ToolBarGroup from '../MailEditor/ToolBar/ToolBarGroup';

const CurrentTextColorCircle = styled.div`
  display: flex;
  align-items: center;
`;

const CurrentTextColor = styled.span<{ $textColor: string }>`
  height: 18px;
  width: 18px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: 1px solid var(--border-primary);
  ${(props) =>
    `background: ${props.$textColor !== 'var(--text-always-white)' ? props.$textColor : 'var(--text-primary)'}`};
`;

const ToolBarGroupDivider = styled.div`
  width: 1px;
  height: 24px;
  margin: 4px;
  box-sizing: border-box;
  background: var(--border-primary);
`;

const CommandsGroupContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0px;
`;

const ColorSelect = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
  gap: 2px;
  height: 32px;

  cursor: pointer;
  border-radius: 6px;
  &:hover {
    background: var(--bg-overlay-secondary);
  }
`;

const CloseButton = styled.div`
  margin-left: auto;
`;

const FormatRow = styled.div`
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  padding: 0 16px;
  padding: 8px 8px 8px 16px;
  height: 44px;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-overlay-tertiary);
  border-top: 1px solid var(--border-tertiary);
`;

interface FormatOptionsToolbarProps {
  editor?: Editor;
  ref?: React.Ref<HTMLDivElement>;
}

const FormatOptionsToolbar = (props: FormatOptionsToolbarProps) => {
  const { editor, ref } = props;
  const { showFormatBar } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();
  const toggleFormatBar = () => {
    dispatch(skemailModalReducer.actions.toggleFormatBar());
  };

  const { theme } = useTheme();

  if (!editor || !showFormatBar) return null;
  const commands = getToolbarCommands(editor, showFormatBar);
  const [textType, ...rest] = commands;

  return (
    <FormatRow id={TOOLBAR_CONTAINER} ref={ref}>
      {textType && (
        <CommandsGroupContainer>
          <ToolBarGroup commands={textType.commands} editor={editor} forceTheme={theme} type={textType.type} />
        </CommandsGroupContainer>
      )}
      <CommandsGroupContainer>
        <ToolBarGroupDivider />
        <ColorSelect onClick={() => toggleColor(editor)}>
          <CurrentTextColorCircle>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
            <CurrentTextColor $textColor={getColor(editor).value} />
          </CurrentTextColorCircle>
          <Icons color='secondary' icon={Icon.ChevronDown} />
        </ColorSelect>
      </CommandsGroupContainer>
      {rest.map((commandGroup, index) => (
        <CommandsGroupContainer key={index}>
          <ToolBarGroupDivider />
          <ToolBarGroup commands={commandGroup.commands} editor={editor} forceTheme={theme} type={commandGroup.type} />
        </CommandsGroupContainer>
      ))}
      <CloseButton>
        <IconText color='secondary' onClick={toggleFormatBar} startIcon={Icon.Close} />
      </CloseButton>
    </FormatRow>
  );
};

export default FormatOptionsToolbar;
