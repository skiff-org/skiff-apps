import * as React from 'react';
import styled from 'styled-components';

import { FilledVariant, Layout, Size } from '../../types';
import { Button, IconButton } from '../Button';
import { ButtonGroupItemComponent } from '../ButtonGroupItem';
import { Icon } from '../Icons';

import { BUTTON_GROUP_SIZE_CSS } from './ButtonGroup.styles';
import { ButtonGroupProps, ButtonGroupSize } from './ButtonGroup.types';
import { getButtonType } from './ButtonGroup.utils';

const ButtonGroupContainer = styled.div<{ $isInline: boolean; $size: ButtonGroupSize }>`
  display: flex;
  justify-content: ${(props) => props.$isInline && 'flex-start'};
  flex-direction: ${(props) => (props.$isInline ? 'row-reverse' : 'column')};
  align-items: center;
  width: 100%;
  ${BUTTON_GROUP_SIZE_CSS}
`;

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  forceTheme,
  fullWidth = false,
  size = Size.MEDIUM,
  layout = Layout.INLINE,
  iconOnly
}) => {
  const isInline = layout === Layout.INLINE;
  const visibleChildren = (React.Children.toArray(children) as ButtonGroupItemComponent[]).filter(
    (child: ButtonGroupItemComponent) => !child.props.hidden
  );

  return (
    <ButtonGroupContainer $isInline={isInline} $size={size}>
      {visibleChildren.map((buttonGroupItem: ButtonGroupItemComponent, index) => {
        const { className, dataTest, disabled, icon, id, label, loading, style, type, onClick, ref } =
          buttonGroupItem.props;
        const buttonType = type ?? getButtonType(index);
        const showIconOnly = iconOnly && index > 0;
        const key = `button_${index}_${label}`;
        return (
          <>
            {showIconOnly && (
              <IconButton
                ref={ref}
                key={key}
                className={className}
                disabled={disabled}
                dataTest={dataTest}
                icon={icon || Icon.Plus}
                id={id}
                style={style}
                onClick={onClick}
                forceTheme={forceTheme}
                tooltip={label}
                size={size}
                variant={FilledVariant.UNFILLED}
              />
            )}
            {!showIconOnly && (
              <Button
                ref={ref}
                key={key}
                className={className}
                loading={loading}
                disabled={disabled}
                dataTest={dataTest}
                icon={icon}
                id={id}
                style={style}
                fullWidth={fullWidth}
                onClick={onClick}
                size={size}
                forceTheme={forceTheme}
                type={buttonType}
              >
                {label}
              </Button>
            )}
          </>
        );
      })}
    </ButtonGroupContainer>
  );
};

export default ButtonGroup;
