import { Icon, Icons, KeyCodeSequence, ThemeMode, Typography, TypographyWeight } from 'nightwatch-ui';
import styled from 'styled-components';

import { ShortcutItems } from './constants';

const Row = styled.div<{ isHeader: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  height: ${(props) => (props.isHeader ? '48px' : '66px')};
`;

const RowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const KeyCodesContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// this component holds all the list of shortcuts after filtering
export const ShortcutsList = () => {
  // renders the header of a section
  const renderHeaderRow = (header) => (
    <Row isHeader={true}>
      <Typography color='secondary' forceTheme={ThemeMode.DARK} weight={TypographyWeight.MEDIUM}>
        {header}
      </Typography>
    </Row>
  );

  // renders a shortcut row
  const renderShortcutRow = ({ icon, name, shortcuts }) => (
    <Row isHeader={false}>
      <RowHeader>
        {icon && <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={icon as Icon} />}
        <Typography forceTheme={ThemeMode.DARK}>{name}</Typography>
      </RowHeader>
      <KeyCodesContainer>
        {shortcuts.map((shortcut, i) => {
          // different shortcuts are separated with an 'or'
          const isLastShortcut = i === shortcuts.length - 1;
          return (
            <KeyCodesContainer key={shortcut}>
              <KeyCodeSequence shortcut={shortcut} />
              {!isLastShortcut && (
                <Typography color='secondary' forceTheme={ThemeMode.DARK}>
                  or
                </Typography>
              )}
            </KeyCodesContainer>
          );
        })}
      </KeyCodesContainer>
    </Row>
  );

  return (
    <>
      {ShortcutItems.map((section) => (
        <div key={section.key}>
          {renderHeaderRow(section.key)}
          {section.items.map((item) =>
            renderShortcutRow({ name: item.name, icon: item.icon, shortcuts: item.shortcuts })
          )}
        </div>
      ))}
    </>
  );
};
