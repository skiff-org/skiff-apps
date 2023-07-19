import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import isNumber from 'lodash/isNumber';
import * as React from 'react';
import styled from 'styled-components';

import {
  Divider,
  DRAWER_CLASSNAME,
  FilledVariant,
  getThemedColor,
  Icon,
  IconButton,
  IconText,
  Size,
  ThemeMode,
  Typography,
  TypographySize
} from '@skiff-org/skiff-ui';

import { ANCHOR, DrawerProps, DRAWER_PADDING_LEFT_RIGHT } from './Drawer.constants';
import { DRAWER_PAPER_CSS, TITLE_CSS } from './Drawer.styles';
import { upperCaseFirstLetter } from './Drawer.utils';

const StyledMuiDrawer = styled(MuiDrawer)<{
  $forceTheme: ThemeMode;
  $verticalScroll: boolean;
  $borderRadius?: string | number;
  $maxHeight?: string | number;
}>`
  max-height: ${(props) => {
    if (!props.$maxHeight) return '100%';
    return isNumber(props.$maxHeight) ? `${props.$maxHeight}px` : props.$maxHeight;
  }};
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
  stickHandleOnTop = false
}) => {
  const renderTitle = (formattedTitle: string) => {
    const iconAndTypographyColor = 'disabled';
    return titleIcon ? (
      <IconTitle>
        <IconText
          label={formattedTitle}
          color={iconAndTypographyColor}
          size={Size.SMALL}
          startIcon={titleIcon}
          forceTheme={forceTheme}
          wrap={wrapTitle}
          mono
        />
      </IconTitle>
    ) : (
      <Typography
        mono
        uppercase
        wrap={wrapTitle}
        size={TypographySize.SMALL}
        selectable={selectable}
        color={iconAndTypographyColor}
        forceTheme={forceTheme}
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
          <IconButton icon={Icon.Close} onClick={hideDrawer} forceTheme={forceTheme} variant={FilledVariant.UNFILLED} />
        )}
      </Header>
    );
  };

  const renderContent = () => (
    <>
      <DrawerHandleContainer $selectable={!!selectable} $stickHandle={stickHandleOnTop}>
        <Divider forceTheme={forceTheme} height='4px' width='18%' />
      </DrawerHandleContainer>
      <StyledBox id={scrollBoxId} $extraSpacer={!!extraSpacer} $borderRadius={borderRadius}>
        {renderHeader()}
        {children}
      </StyledBox>
    </>
  );

  return (
    <React.Fragment key={ANCHOR}>
      {scrollable && (
        <StyledMuiDrawer
          PaperProps={{
            id: paperId
          }}
          anchor={ANCHOR}
          className={DRAWER_CLASSNAME}
          onClose={hideDrawer}
          open={show}
          $forceTheme={forceTheme}
          $verticalScroll={verticalScroll}
          $maxHeight={maxHeight}
          $borderRadius={borderRadius}
        >
          {renderContent()}
        </StyledMuiDrawer>
      )}
      {!scrollable && (
        <StyledSwipeableDrawer
          PaperProps={{
            id: paperId
          }}
          anchor={ANCHOR}
          disableDiscovery
          className={DRAWER_CLASSNAME}
          disableSwipeToOpen
          onClose={hideDrawer}
          onOpen={() => {}}
          open={show}
          $forceTheme={forceTheme}
          $verticalScroll={verticalScroll}
          $maxHeight={maxHeight}
          $borderRadius={borderRadius}
        >
          {renderContent()}
        </StyledSwipeableDrawer>
      )}
    </React.Fragment>
  );
};

export default Drawer;
