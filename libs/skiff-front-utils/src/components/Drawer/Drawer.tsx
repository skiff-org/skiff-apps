import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import isNumber from 'lodash/isNumber';
import {
  DRAWER_CLASSNAME,
  Divider,
  FilledVariant,
  Icon,
  IconButton,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  getThemedColor
} from 'nightwatch-ui';
import * as React from 'react';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { ANCHOR, DRAWER_PADDING_LEFT_RIGHT } from './Drawer.constants';
import { DRAWER_PAPER_CSS, TITLE_CSS } from './Drawer.styles';
import { DrawerProps } from './Drawer.types';
export { DrawerProps } from './Drawer.types';

const KEYBOARD_POS_CSS = (keyboardHeight: number) => css`
  transform: translateY(-${keyboardHeight}px) !important;
  transition: transform 0.25s cubic-bezier(0.17, 0.59, 0.4, 0.77) !important;
`;

const StyledMuiDrawer = styled(MuiDrawer)<{
  $forceTheme: ThemeMode;
  $verticalScroll: boolean;
  $borderRadius?: string | number;
  $maxHeight?: string | number;
  $keyboardHeight?: number;
}>`
  max-height: ${(props) => {
    if (!props.$maxHeight) return '100%';
    return isNumber(props.$maxHeight) ? `${props.$maxHeight}px` : props.$maxHeight;
  }};

  .MuiPaper-root {
    ${(props) => props.$keyboardHeight && KEYBOARD_POS_CSS(props.$keyboardHeight)}
  }

  .MuiDrawer-paper {
    ${DRAWER_PAPER_CSS}
  }
`;

const StyledSwipeableDrawer = styled(SwipeableDrawer)<{
  $forceTheme: ThemeMode;
  $verticalScroll: boolean;
  $borderRadius?: string | number;
  $maxHeight?: string | number;
}>`
  .MuiDrawer-paper {
    max-height: ${(props) => {
      if (!props.$maxHeight) return '100%';
      return isNumber(props.$maxHeight) ? `${props.$maxHeight}px` : props.$maxHeight;
    }};
    ${DRAWER_PAPER_CSS}
  }
`;

const StyledBox = styled(Box)<{ $extraSpacer: boolean; $borderRadius?: string | number }>`
  width: 100%;
  padding: 0px ${DRAWER_PADDING_LEFT_RIGHT}px;
  box-sizing: border-box;
  overflow: auto;
  ${(props) => props.$extraSpacer && 'margin-bottom: 48px;'};
`;

const DrawerHandleContainer = styled.div<{ $selectable: boolean; $stickHandle: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0px 12px 0px;
  box-sizing: border-box;
  ${(props) =>
    props.$stickHandle &&
    `position: sticky;
     top: 0;
     z-index: 2;`}

  user-select: ${(props) => (props.$selectable ? 'auto' : 'none')};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Title = styled.div`
  ${TITLE_CSS}
`;

const IconTitle = styled.div`
  box-sizing: border-box;
  ${TITLE_CSS}
`;

export const DrawerGroup = styled.div`
  flex-direction: column;
  display: flex;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: ${getThemedColor('var(--bg-overlay-tertiary)', ThemeMode.DARK)};
`;

// Sometimes the keyboard height hook throws false values, so we need to set a minimum height
const MIN_REGISTERED_KEYBOARD_HEIGHT = 250;

const Drawer: React.FC<DrawerProps> = ({
  show,
  hideDrawer,
  children,
  title,
  scrollable = false,
  titleIcon,
  extraSpacer = true,
  paperId,
  scrollBoxId,
  showClose = false,
  selectable = true,
  verticalScroll = true,
  forceTheme = ThemeMode.DARK,
  formatTitle = true,
  maxHeight,
  wrapTitle,
  borderRadius,
  stickHandleOnTop = false,
  keyboardHeight = 0
}) => {
  const renderTitle = (formattedTitle: string) => {
    const iconAndTypographyColor = 'disabled';
    return titleIcon ? (
      <IconTitle>
        <IconText
          color={iconAndTypographyColor}
          forceTheme={forceTheme}
          label={formattedTitle}
          mono
          size={Size.SMALL}
          startIcon={titleIcon}
          wrap={wrapTitle}
        />
      </IconTitle>
    ) : (
      <Typography
        color={iconAndTypographyColor}
        forceTheme={forceTheme}
        mono
        selectable={selectable}
        size={TypographySize.SMALL}
        wrap={wrapTitle}
      >
        <Title>{formattedTitle}</Title>
      </Typography>
    );
  };

  const renderHeader = () => {
    if (!title) return null;
    const formattedTitle = formatTitle ? upperCaseFirstLetter(title) : title;
    return (
      <Header>
        {renderTitle(formattedTitle)}
        {showClose && (
          <IconButton forceTheme={forceTheme} icon={Icon.Close} onClick={hideDrawer} variant={FilledVariant.UNFILLED} />
        )}
      </Header>
    );
  };

  const renderContent = () => (
    <>
      <DrawerHandleContainer $selectable={!!selectable} $stickHandle={stickHandleOnTop}>
        <Divider forceTheme={forceTheme} height='4px' width='18%' />
      </DrawerHandleContainer>
      <StyledBox $borderRadius={borderRadius} $extraSpacer={!!extraSpacer} id={scrollBoxId}>
        {renderHeader()}
        {children}
      </StyledBox>
    </>
  );
  return (
    <React.Fragment key={ANCHOR}>
      {scrollable && (
        <StyledMuiDrawer
          $borderRadius={borderRadius}
          $forceTheme={forceTheme}
          $keyboardHeight={keyboardHeight > MIN_REGISTERED_KEYBOARD_HEIGHT ? keyboardHeight : 0}
          $maxHeight={maxHeight}
          $verticalScroll={verticalScroll}
          PaperProps={{
            id: paperId
          }}
          anchor={ANCHOR}
          className={DRAWER_CLASSNAME}
          onClose={hideDrawer}
          open={show}
        >
          {renderContent()}
        </StyledMuiDrawer>
      )}
      {!scrollable && (
        <StyledSwipeableDrawer
          $borderRadius={borderRadius}
          $forceTheme={forceTheme}
          $maxHeight={maxHeight}
          $verticalScroll={verticalScroll}
          PaperProps={{
            id: paperId
          }}
          anchor={ANCHOR}
          className={DRAWER_CLASSNAME}
          disableDiscovery
          disableSwipeToOpen
          onClose={hideDrawer}
          onOpen={() => {}}
          open={show}
        >
          {renderContent()}
        </StyledSwipeableDrawer>
      )}
    </React.Fragment>
  );
};

export default Drawer;
