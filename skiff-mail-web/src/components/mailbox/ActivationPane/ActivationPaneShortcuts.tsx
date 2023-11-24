import {
  Divider,
  FilledVariant,
  Icon,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React from 'react';
import { KeyCodeSequence } from 'skiff-front-utils';
import styled from 'styled-components';

import { ShortcutItem, SHORTCUT_ITEMS } from './ActivationPane.constants';

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
`;

const Shortcuts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  max-height: 500px;
  overflow-y: scroll;
`;

const SectionHeader = styled.div`
  padding: 4px 0;
`;

const ShortcutRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 6px 0;
`;

const KeyCodesContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export interface ActivationPaneShortcutsProps {
  onBack: (e?: React.MouseEvent) => void;
}

const ActivationPaneShortcuts: React.FC<ActivationPaneShortcutsProps> = ({ onBack }) => {
  // Renders the header of a section
  const renderSectionHeader = (header) => (
    <SectionHeader>
      <Typography forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
        {header}
      </Typography>
    </SectionHeader>
  );

  // Renders a shortcut row
  const renderShortcutRow = ({ name, shortcuts }: ShortcutItem) => (
    <ShortcutRow>
      <Typography color='secondary' forceTheme={ThemeMode.DARK}>
        {name}
      </Typography>
      <KeyCodesContainer>
        {shortcuts.map((shortcut, i) => {
          // Different shortcuts are separated with an 'or'
          const isLastShortcut = i === shortcuts.length - 1;
          return (
            <KeyCodesContainer key={shortcut}>
              <KeyCodeSequence shortcut={shortcut} size={Size.SMALL} />
              {!isLastShortcut && (
                <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.CAPTION}>
                  OR
                </Typography>
              )}
            </KeyCodesContainer>
          );
        })}
      </KeyCodesContainer>
    </ShortcutRow>
  );

  return (
    <div>
      <Title>
        <IconText
          forceTheme={ThemeMode.DARK}
          onClick={onBack}
          startIcon={Icon.ChevronLeft}
          variant={FilledVariant.FILLED}
        />
        <Typography forceTheme={ThemeMode.DARK} size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
          Keyboard shortcuts
        </Typography>
      </Title>
      <Divider forceTheme={ThemeMode.DARK} />
      <Shortcuts>
        {SHORTCUT_ITEMS.map((section) => (
          <div key={section.key}>
            {renderSectionHeader(section.key)}
            {section.items.map((item) => renderShortcutRow(item))}
          </div>
        ))}
      </Shortcuts>
    </div>
  );
};

export default ActivationPaneShortcuts;
