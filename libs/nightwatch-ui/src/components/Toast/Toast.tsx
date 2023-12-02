import { Link } from '@mui/material';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import React, { ForwardedRef, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { themeNames } from '../../theme';
import { Size, ThemeMode, Type } from '../../types';
import { Button } from '../Button';
import Icons, { Icon } from '../Icons';
import { TOAST_CLASSNAME } from '../Surface/Surface.constants';
import Typography from '../Typography';

import {
  TOAST_DEFAULT_DURATION,
  TOAST_DISMISS_OFFSET_THRESHOLD,
  TOAST_DISMISS_VELOCITY_FACTOR
} from './Toast.constants';
import { ToastWithKeyProps } from './Toast.types';

const ToastRoot = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  isolation: isolate;

  padding: 12px;
  box-sizing: border-box;

  width: ${isMobile ? '90%' : '360px'};
  margin: ${isMobile ? 'auto' : '0px'};
  border-radius: ${isMobile ? 12 : 8}px;

  box-shadow: var(--shadow-l3);
  background: var(--bg-emphasis);
  border: 1px solid var(--border-secondary);
`;

const CloseWrapper = styled.div`
  position: absolute;
  right: 8px;
  top: 8px;
`;

const ToastActions = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
`;

const ToastHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconContainer = styled.div`
  height: 42px;
  width: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0px 4px;

  background: ${themeNames.dark['--bg-cell-hover']};
  border-radius: 12px;
  box-shadow: inset 0px 1px 0px rgba(255, 255, 255, 0.08), inset 0px -1px 0px 1px rgba(255, 255, 255, 0.08);
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2px;
`;

const Title = styled.div`
  ${!isMobile && 'padding-right: 32px;'}
`;

const ButtonContainer = styled.div<{ $fullWidth: boolean }>`
  ${(props) => props.$fullWidth && 'width: 100%;'}
`;

/**
 * A custom toast component.
 * Leverages our color themes, typography, and icon library.
 * Rendered by notistack.
 * @param {ToastProps} props Fields to control toast behavior.
 * @param {ForwardedRef<HTMLDivElement>} ref Forwarded from notistack.
 */
const Toast = (
  {
    actions,
    body,
    dataTest,
    duration = TOAST_DEFAULT_DURATION,
    icon,
    content,
    persist,
    redirectTo,
    title,
    toastKey,
    hideCloseButton,
    closeToast,
    onClose
  }: ToastWithKeyProps,
  ref: ForwardedRef<HTMLDivElement>
) => {
  // Toast theme mode
  const forceTheme = ThemeMode.DARK;
  // Close button hover state
  const [closeHover, setCloseHover] = useState(false);
  const animationControls = useAnimation();

  const hideAnimation = useCallback(() => {
    void animationControls.start({
      opacity: 0,
      transition: {
        duration: 0.2
      }
    });
  }, [animationControls]);

  const showAnimation = useCallback(() => {
    void animationControls.start({
      opacity: 1,
      transition: {
        duration: 0.2
      }
    });
  }, [animationControls]);

  const forceClose = useCallback(() => {
    hideAnimation();
    closeToast();
    onClose?.();
  }, [closeToast, hideAnimation, onClose]);

  const onDragEnd = (_e: MouseEvent | TouchEvent, info: PanInfo) => {
    const draggedDistance = Math.abs(
      info.offset.x + info.offset.y + TOAST_DISMISS_VELOCITY_FACTOR * (info.velocity.x + info.velocity.y)
    );
    // if dragged amount exceeds threshold, close toast
    if (draggedDistance > TOAST_DISMISS_OFFSET_THRESHOLD) {
      forceClose();
    }
  };

  useEffect(() => {
    if (!persist) setTimeout(() => forceClose(), duration);
    showAnimation();
  }, [toastKey, duration, showAnimation, persist, forceClose]);

  const renderHeader = () => (
    <ToastHeader>
      {!isMobile && icon && (
        <IconContainer>
          <Icons color='secondary' size={Size.X_MEDIUM} forceTheme={forceTheme} icon={icon} />
        </IconContainer>
      )}
      <TextContainer>
        {!!title && (
          <Title>
            {typeof title === 'string' && (
              <Typography wrap forceTheme={forceTheme} selectable={false}>
                {title}
              </Typography>
            )}
            {typeof title !== 'string' && title}
          </Title>
        )}
        {!!body && (
          <Typography wrap color='secondary' forceTheme={forceTheme} selectable={false}>
            {body}
          </Typography>
        )}
      </TextContainer>
    </ToastHeader>
  );

  const renderActions = () =>
    actions && (
      <ToastActions>
        {actions.map(({ label, onClick }) => {
          const fullWidth = isMobile && actions.length > 1;
          return (
            <ButtonContainer key={`${toastKey}-${label}`} $fullWidth={fullWidth}>
              <Button
                fullWidth={fullWidth}
                onClick={() => onClick()}
                size={Size.SMALL}
                type={Type.SECONDARY}
                forceTheme={forceTheme}
              >
                {label}
              </Button>
            </ButtonContainer>
          );
        })}
      </ToastActions>
    );

  const renderToast = () => (
    <ToastRoot
      initial={{ opacity: 0 }}
      className={TOAST_CLASSNAME}
      animate={animationControls}
      data-test={dataTest || ''}
      drag={isMobile ? 'y' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      onDragEnd={onDragEnd}
      ref={ref}
    >
      {!isMobile && !hideCloseButton && (
        <CloseWrapper onMouseEnter={() => setCloseHover(true)} onMouseLeave={() => setCloseHover(false)}>
          <Icons
            color={closeHover ? 'secondary' : 'disabled'}
            icon={Icon.Close}
            forceTheme={forceTheme}
            onClick={forceClose}
          />
        </CloseWrapper>
      )}
      {(!!title || !!body) && renderHeader()}
      {renderActions()}
      {content}
    </ToastRoot>
  );

  return !!redirectTo ? <Link href={redirectTo}>{renderToast()}</Link> : renderToast();
};

export default React.forwardRef<HTMLDivElement, ToastWithKeyProps>(Toast);
