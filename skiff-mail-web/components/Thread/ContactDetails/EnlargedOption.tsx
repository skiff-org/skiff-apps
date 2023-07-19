import {
  Alignment,
  Icons,
  Size,
  ThemeMode,
  themeNames,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import styled from 'styled-components';

import { ThreadBlockOptions } from '../Thread.types';
const EnlargedOptionContainer = styled.div<{ destructive?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid
    ${(props) => (!props.destructive ? themeNames.dark['--border-primary'] : themeNames.dark['--border-destructive'])};
  border-radius: 11px;
  gap: 8px;
  height: 50px;
  width: 100%;
`;

export const EnlargedOption = ({
  option,
  destructive,
  hideDrawer
}: {
  option: ThreadBlockOptions;
  destructive?: boolean;
  hideDrawer?: () => void;
}) => {
  return (
    <EnlargedOptionContainer
      destructive={destructive}
      onClick={() => {
        if (hideDrawer) {
          hideDrawer();
        }
        if (option.onClick) {
          option.onClick();
        }
      }}
    >
      {option.icon && (
        <Icons
          color={destructive ? 'destructive' : 'primary'}
          forceTheme={ThemeMode.DARK}
          icon={option.icon}
          size={Size.X_MEDIUM}
        />
      )}
      <Typography
        mono
        uppercase
        align={Alignment.CENTER}
        color={destructive ? 'destructive' : 'primary'}
        forceTheme={ThemeMode.DARK}
        selectable={false}
        size={TypographySize.CAPTION}
        weight={TypographyWeight.MEDIUM}
        wrap
      >
        {option.label.toUpperCase()}
      </Typography>
    </EnlargedOptionContainer>
  );
};
