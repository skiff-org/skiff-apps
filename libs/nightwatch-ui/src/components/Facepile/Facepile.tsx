import * as React from 'react';
import styled, { css } from 'styled-components';

import { Alignment, Layout, Size, ThemeMode } from '../../types';
import { getThemedColor } from '../../utils/colorUtils';
import { AvatarComponent } from '../Avatar';
import { SIZE_STYLES as AVATAR_SIZE_STYLES } from '../Avatar/Avatar.constants';
import Tooltip, { TooltipContent, TooltipTrigger } from '../Tooltip';
import Typography, { TypographyWeight } from '../Typography';

import { FacepileProps, FacepileSize, MAX_STACKED_AVATARS } from './Facepile.constants';
import { AVATAR_WRAPPER_CSS, FACEPILE_WRAPPER_LAYOUT_CSS } from './Facepile.styles';
import { compareInlineAvatars, compareStackedAvatars } from './Facepile.utils';

const FacepileWrapper = styled.div<{
  $avatarsOverflow: boolean;
  $layout: Layout;
  $numOfAvatars: number;
  $size: FacepileSize;
}>`
  ${FACEPILE_WRAPPER_LAYOUT_CSS}
`;

const InlineAvatars = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const AvatarWrapper = styled.div<{
  $index: number;
  $numOfAvatars: number;
  $size: FacepileSize;
  $layout: Layout;
  $avatarsOverflow: boolean;
  $background?: string;
  $forceTheme?: ThemeMode;
}>`
  background: ${(props) => {
    const color = props.$background ?? 'var(--bg-l1-solid)';
    return getThemedColor(color, props.$forceTheme);
  }};
  ${AVATAR_WRAPPER_CSS}
`;

const StackedMoreLabel = styled.div<{
  $size: FacepileSize;
}>`
  ${(props) => {
    const labelContainerSize = AVATAR_SIZE_STYLES[props.$size].avatarSize;
    return css`
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: ${labelContainerSize}px;
      height: ${labelContainerSize}px;
    `;
  }}
`;

/**
 * Component that renders a collection of avatars. Handles logic for hiding
 * Avatars if a max number to display is set.
 */
const Facepile: React.FC<FacepileProps> = ({
  children,
  background,
  forceTheme,
  layout = Layout.INLINE,
  maxDisplayed = 4,
  size = Size.LARGE,
  onMoreClick
}) => {
  const { typographySize } = AVATAR_SIZE_STYLES[size];
  // Maximum number of avatars that can be displayed
  // Important for avatar sizing and mobile layout style
  const maxAvatarsToDisplay = layout === Layout.STACKED ? MAX_STACKED_AVATARS : maxDisplayed;
  // Whether the current number of avatars exceed the maximum number that can be displayed
  const avatarsOverflow = children.length > maxAvatarsToDisplay;
  // Number of visible avatars
  const numOfVisibleAvatars = avatarsOverflow ? maxAvatarsToDisplay : children.length;
  // Online user avatars should always come before offline users
  const sortedAvatars = children.sort(layout === Layout.INLINE ? compareInlineAvatars : compareStackedAvatars);
  const visibleAvatars = sortedAvatars.slice(0, numOfVisibleAvatars);

  const renderMoreLabel = () => {
    // Number of hidden avatars
    const numOfHiddenAvatars = children.length - numOfVisibleAvatars;
    const numLabel = layout === Layout.STACKED && numOfHiddenAvatars > 99 ? '+' : numOfHiddenAvatars;
    return (
      <Typography
        align={Alignment.CENTER}
        color='disabled'
        size={typographySize}
        onClick={onMoreClick}
        selectable={!onMoreClick}
        forceTheme={forceTheme}
        weight={layout === Layout.STACKED ? TypographyWeight.BOLD : TypographyWeight.REGULAR}
      >{`+${numLabel}`}</Typography>
    );
  };

  const renderVisibleAvatars = () =>
    visibleAvatars.map((avatarItem: AvatarComponent, index) => (
      <AvatarWrapper
        key={`${avatarItem.props.label ?? ''}_${index}`}
        $index={index}
        $numOfAvatars={visibleAvatars.length}
        $background={background}
        $forceTheme={forceTheme}
        $size={size}
        $layout={layout}
        $avatarsOverflow={avatarsOverflow}
      >
        <Tooltip>
          <TooltipContent>{avatarItem.props.label}</TooltipContent>
          <TooltipTrigger>
            {/* Enforce same background, size and theme on all Avatars */}
            {React.cloneElement(avatarItem, { background, size, forceTheme })}
          </TooltipTrigger>
        </Tooltip>
      </AvatarWrapper>
    ));

  return (
    <FacepileWrapper
      $avatarsOverflow={avatarsOverflow}
      $layout={layout}
      $numOfAvatars={visibleAvatars.length}
      $size={size}
    >
      {layout === Layout.INLINE && <InlineAvatars>{renderVisibleAvatars()}</InlineAvatars>}
      {layout === Layout.STACKED && renderVisibleAvatars()}
      {avatarsOverflow &&
        (layout === Layout.INLINE ? (
          renderMoreLabel()
        ) : (
          // In a stacked layout, the More label is positioned like an Avatar item
          <AvatarWrapper
            $index={MAX_STACKED_AVATARS}
            $numOfAvatars={visibleAvatars.length}
            $background={background}
            $forceTheme={forceTheme}
            $size={size}
            $layout={layout}
            $avatarsOverflow
          >
            <StackedMoreLabel $size={size}>{renderMoreLabel()}</StackedMoreLabel>
          </AvatarWrapper>
        ))}
    </FacepileWrapper>
  );
};

export default Facepile;
