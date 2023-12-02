import React from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { Alignment, Layout, Size } from '../../types';
import ButtonGroup from '../ButtonGroup';
import { ButtonGroupItemComponent } from '../ButtonGroupItem';
import CircularProgress, { AbsolutelyCentered } from '../CircularProgress';
import { Icon } from '../Icons';
import IconText from '../IconText';
import Surface from '../Surface';
import Typography, { TypographySize, TypographyWeight } from '../Typography';

import { DIALOG_TYPE_STYLES, MOBILE_CONFIRM_MODAL_MAX_WIDTH, MOBILE_CONFIRM_MODAL_MIN_WIDTH } from './Dialog.constants';
import { DIALOG_TYPE_CSS } from './Dialog.styles';
import { DialogProps, DialogType } from './Dialog.types';

const StyledSurface = styled(Surface)<{ $layout: Layout; $type: DialogType }>`
  display: flex;
  flex-direction: column;

  ${({ $layout }) =>
    $layout === Layout.STACKED &&
    isMobile &&
    `
      text-align: center;
      align-items: center;
    `}

  ${DIALOG_TYPE_CSS}
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
`;

const TitleDescription = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const CloseButtonContainer = styled.div`
  margin-left: auto;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 2%;
  padding-bottom: 8px;
`;

const ProgressBarIndicator = styled.div<{ active: boolean }>`
  height: 4px;
  background: ${({ active }) => (active ? 'var(--text-link)' : 'var(--bg-overlay-secondary)')};
  border-radius: 10px;
  width: 100%;
`;

export default function Dialog({
  children,
  open,
  onClose,
  classesToIgnore,
  className = '',
  closeBtnDataTest,
  customContent,
  dataTest,
  description,
  disableOffClick,
  disableTextSelect = false,
  forceTheme,
  height,
  hideCloseButton = false,
  inputField,
  loading,
  noPadding = false,
  progress,
  size: customSize,
  style,
  title,
  type = DialogType.DEFAULT,
  width,
  zIndex
}: DialogProps) {
  const {
    className: typeClassName = '',
    size,
    showCloseButton: typeShowsCloseButton,
    layout = isMobile ? Layout.STACKED : Layout.INLINE,
    fullWidth,
    titleSize = TypographySize.H4
  } = DIALOG_TYPE_STYLES[type];

  const typographyAlign = isMobile && layout === Layout.STACKED ? Alignment.CENTER : undefined;
  // If the modal has a progress bar, do not show the close button
  const showCloseButton = !loading && typeShowsCloseButton && !hideCloseButton && !progress;

  const renderCloseButton = () => (
    <CloseButtonContainer>
      <IconText dataTest={closeBtnDataTest} startIcon={Icon.Close} onClick={onClose} forceTheme={forceTheme} />
    </CloseButtonContainer>
  );

  const renderSpinner = () => (
    <AbsolutelyCentered>
      <CircularProgress forceTheme={forceTheme} size={Size.X_MEDIUM} spinner />
    </AbsolutelyCentered>
  );

  return (
    <StyledSurface
      className={`${className} ${typeClassName}`}
      height={height}
      dataTest={dataTest}
      open={open}
      modal
      level='l3'
      scrim
      size={customSize ?? size}
      onClose={() => void onClose()}
      style={style}
      padding={!noPadding}
      forceTheme={forceTheme}
      classesToIgnore={classesToIgnore}
      disableOffClick={disableOffClick}
      disableTextSelect={disableTextSelect}
      width={width}
      minWidth={isMobile ? MOBILE_CONFIRM_MODAL_MIN_WIDTH : undefined}
      maxWidth={isMobile ? MOBILE_CONFIRM_MODAL_MAX_WIDTH : undefined}
      $layout={layout}
      $type={type}
      zIndex={zIndex}
    >
      {progress && (
        <ProgressBarContainer>
          {Array.from(Array(progress.totalNumSteps)).map((_, index) => (
            <ProgressBarIndicator key={index} active={index <= progress.currStep} />
          ))}
        </ProgressBarContainer>
      )}
      {(title || showCloseButton) && (
        <Header>
          {title && (
            <TitleDescription>
              <Typography
                weight={TypographyWeight.MEDIUM}
                size={titleSize}
                wrap
                forceTheme={forceTheme}
                align={typographyAlign}
              >
                {title}
              </Typography>
              {description && (
                <Typography color='secondary' wrap forceTheme={forceTheme} align={typographyAlign}>
                  {description}
                </Typography>
              )}
            </TitleDescription>
          )}
          {showCloseButton && renderCloseButton()}
        </Header>
      )}
      {loading ? (
        renderSpinner()
      ) : (
        <>
          {inputField}
          {customContent && children}
        </>
      )}
      {!customContent && (
        <ButtonGroup forceTheme={forceTheme} fullWidth={fullWidth} layout={layout}>
          {children as ButtonGroupItemComponent[]}
        </ButtonGroup>
      )}
    </StyledSurface>
  );
}
