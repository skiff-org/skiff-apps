import { Size, ThemeMode, themeNames, Typography } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import { KeyCodeSequenceProps, KeyCodeSequenceSize, TYPOGRAPHY_SIZE } from './KeyCodeSequence.constants';
import { KEY_CODE_SIZE_CSS, SEQUENCE_CONTAINER_SIZE_CSS } from './KeyCodeSequence.styles';

const SequenceContainer = styled.div<{ $size: KeyCodeSequenceSize }>`
  display: flex;
  align-items: center;

  ${SEQUENCE_CONTAINER_SIZE_CSS}
`;

const KeyCode = styled.div<{ $size: KeyCodeSequenceSize }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${themeNames.dark['--bg-overlay-primary']};
  box-sizing: border-box;

  ${KEY_CODE_SIZE_CSS};
`;

const KeyCodeSequence: React.FC<KeyCodeSequenceProps> = ({ shortcut, size = Size.LARGE }) => {
  const typographySize = TYPOGRAPHY_SIZE[size];

  // renders a single key code
  const renderSingleKeyCode = (keycode: string) => (
    <KeyCode $size={size}>
      <Typography color='secondary' forceTheme={ThemeMode.DARK} size={typographySize}>
        {keycode.length === 1 ? keycode.toUpperCase() : keycode}
      </Typography>
    </KeyCode>
  );

  // renders the whole key code sequence
  const renderSequence = () => {
    // handles key codes separated with a space, indicating that they should be pressed separately
    // these keys are rendered with a 'then' in-between them
    if (shortcut.includes(' ')) {
      const keycodes = shortcut.split(' ');
      return keycodes.map((keycode, i) => {
        const isLastKeyCode = i === keycodes.length - 1;
        return (
          <SequenceContainer $size={size} key={keycode}>
            {renderSingleKeyCode(keycode)}
            {!isLastKeyCode && (
              <Typography color='secondary' forceTheme={ThemeMode.DARK} size={typographySize}>
                THEN
              </Typography>
            )}
          </SequenceContainer>
        );
      });
    }
    // handles key codes separated with a +, indicating that they should be pressed simultaneously
    // these keys are rendered next to each other
    if (shortcut.includes('+')) {
      const keycodes = shortcut.split('+');
      return keycodes.map((keycode) => renderSingleKeyCode(keycode));
    }
    // handles rendering only one key code
    return renderSingleKeyCode(shortcut);
  };

  return <SequenceContainer $size={size}>{renderSequence()}</SequenceContainer>;
};

export default KeyCodeSequence;
