import {
  ACCENT_COLOR_VALUES,
  DropdownItem,
  Icon,
  IconText,
  Icons,
  Size,
  ThemeMode,
  getThemedColor
} from 'nightwatch-ui';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import { SystemLabel, UserLabelFolder, UserLabelPlain } from '../../utils/label';

import LabelOptionsDropdown from './LabelOptionsDropdown';

const EndElements = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconColorContainer = styled.div<{ $color: string }>`
  background: ${(props) => getThemedColor(props.$color, ThemeMode.DARK)};
  width: 16px;
  min-width: 16px;
  height: 16px;
  min-height: 16px;

  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface PlainLabelDropdownItemProps {
  label: UserLabelPlain;
  active: boolean;
  onClick: () => Promise<void>;
  highlight?: boolean;
  onDeleteLabel?: (label: UserLabelPlain | UserLabelFolder) => void;
  onHover?: () => void;
}

const renderOptionsButton = (
  ref: React.RefObject<HTMLDivElement>,
  setShowSubDropdown: Dispatch<SetStateAction<boolean>>
) => (
  <IconText
    color='secondary'
    forceTheme={ThemeMode.DARK}
    onClick={(e) => {
      e?.stopPropagation();
      setShowSubDropdown((prev) => !prev);
    }}
    ref={ref}
    startIcon={Icon.OverflowH}
  />
);

export const PlainLabelDropdownItem: FC<PlainLabelDropdownItemProps> = ({
  label,
  active,
  onClick,
  highlight,
  onDeleteLabel,
  onHover
}: PlainLabelDropdownItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showSubDropdown, setShowSubDropdown] = useState<boolean>(false);

  const handleOnClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await onClick();
  };

  return (
    <>
      <DropdownItem
        active={active && isMobile}
        endElement={
          <EndElements>
            <IconColorContainer
              $color={
                label.color
                  ? (ACCENT_COLOR_VALUES[label.color] as Array<string>)?.[1] || 'var(--bg-overlay-tertiary)'
                  : 'var(--bg-overlay-tertiary)'
              }
            >
              <Icons color={label.color} forceTheme={ThemeMode.DARK} icon={Icon.Dot} size={Size.X_SMALL} />
            </IconColorContainer>
            {renderOptionsButton(ref, setShowSubDropdown)}
          </EndElements>
        }
        highlight={highlight}
        key={label.value}
        label={label.name}
        onClick={handleOnClick}
        onHover={onHover}
        // Mobile colored dots and filled checkboxes are passed as start elements so they'd be displayed at full opacity
        startElement={
          isMobile ? (
            <Icons color={label.color} forceTheme={ThemeMode.DARK} icon={Icon.Dot} />
          ) : active ? (
            <Icons color='link' forceTheme={ThemeMode.DARK} icon={Icon.CheckboxFilled} onClick={handleOnClick} />
          ) : (
            <Icons color='secondary' forceTheme={ThemeMode.DARK} icon={Icon.CheckboxEmpty} onClick={handleOnClick} />
          )
        }
      />
      <LabelOptionsDropdown
        buttonRef={ref}
        isSubmenu
        label={label}
        onDeleteLabel={onDeleteLabel}
        setShowDropdown={(value) => setShowSubDropdown(value)}
        showDropdown={showSubDropdown}
      />
    </>
  );
};

interface FolderLabelDropdownItemProps {
  label: UserLabelFolder;
  active: boolean;
  onClick: () => Promise<void> | void;
  highlight?: boolean;
  onDeleteLabel?: (label: UserLabelPlain | UserLabelFolder) => void;
  onHover?: () => void;
}

export const FolderLabelDropdownItem: FC<FolderLabelDropdownItemProps> = ({
  label,
  active,
  onClick,
  highlight,
  onDeleteLabel,
  onHover
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showSubDropdown, setShowSubDropdown] = useState<boolean>(false);

  return (
    <>
      <DropdownItem
        active={active}
        endElement={renderOptionsButton(ref, setShowSubDropdown)}
        highlight={highlight}
        key={label.value}
        label={label.name}
        onClick={() => {
          // We pass a no-op instead of undefined to an active dropdown item
          // so it could still get highlighted with keyboard navigation
          if (active) return;
          void onClick();
        }}
        onHover={onHover}
        startElement={<Icons color={label.color} forceTheme={ThemeMode.DARK} icon={Icon.FolderSolid} />}
      />
      <LabelOptionsDropdown
        buttonRef={ref}
        isSubmenu
        label={label}
        onDeleteLabel={onDeleteLabel}
        setShowDropdown={(value) => {
          setShowSubDropdown(value);
        }}
        showDropdown={showSubDropdown}
      />
    </>
  );
};

interface SystemLabelDropdownItemProps {
  label: SystemLabel;
  active: boolean;
  highlight?: boolean;
  onClick: () => Promise<void> | void;
  onHover?: () => void;
}

export const SystemLabelDropdownItem: FC<SystemLabelDropdownItemProps> = ({
  label,
  active,
  onClick,
  highlight,
  onHover
}) => (
  <DropdownItem
    active={active}
    highlight={highlight}
    key={label.value}
    label={label.name}
    onClick={() => {
      // We pass a no-op instead of undefined to an active dropdown item
      // so it could still get highlighted with keyboard navigation
      if (active) return;
      void onClick();
    }}
    onHover={onHover}
    startElement={<Icons forceTheme={ThemeMode.DARK} icon={label.icon} />}
  />
);
