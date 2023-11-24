import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import {
  Icon,
  IconColor,
  Size,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import styled from 'styled-components';
import CircleBadge from '../CircleBadge';

const SKIFF_WHITEPAPER = 'https://skiff.com/security-model';

const TooltipContainer = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 0px;
`;

export enum EncryptionBadgeTypes {
  E2EE = 'e2ee',
  Pgp = 'pgp',
  External = 'external'
}

interface EncryptionBadgeProps {
  /** Determines whether the badge should have the E2EE Shield icon or the Lock icon */
  type?: EncryptionBadgeTypes;
  /** Tooltip subtext */
  tooltipSubtext?: string;
  hideTooltip?: boolean;
  isTrusted?: boolean;
}

const getTooltipTitle = (badgeType: EncryptionBadgeTypes) => {
  switch (badgeType) {
    case EncryptionBadgeTypes.E2EE:
      return 'End-to-end encrypted';
    case EncryptionBadgeTypes.Pgp:
      return 'PGP encrypted';
    case EncryptionBadgeTypes.External:
      return 'External email';
    default:
      return '';
  }
};

interface IconProps {
  icon: Icon;
  color: IconColor;
  size: Size;
}

const getIconProps = (badgeType: EncryptionBadgeTypes, isTrusted?: boolean): IconProps => {
  switch (badgeType) {
    case EncryptionBadgeTypes.E2EE:
      return {
        icon: Icon.ShieldEncrypt,
        color: 'source',
        size: Size.X_MEDIUM
      };
    case EncryptionBadgeTypes.Pgp:
      return {
        icon: Icon.Key,
        color: isTrusted ? 'green' : 'secondary',
        size: Size.SMALL
      };
    case EncryptionBadgeTypes.External:
      return {
        icon: Icon.Lock,
        color: isTrusted ? 'green' : 'secondary',
        size: Size.SMALL
      };
    default:
      return {
        icon: Icon.Lock,
        color: isTrusted ? 'green' : 'secondary',
        size: Size.SMALL
      };
  }
};

export default function EncryptionBadge({
  type = EncryptionBadgeTypes.External,
  tooltipSubtext,
  hideTooltip,
  isTrusted
}: EncryptionBadgeProps) {
  const tooltipTitle = getTooltipTitle(type);
  const { color, size, icon } = getIconProps(type, isTrusted);

  const iconCircle = (
    <CircleBadge
      onClick={() => window.open(SKIFF_WHITEPAPER, '_blank', 'noopener noreferrer')}
      icon={icon}
      color={color}
      size={size}
    />
  );

  return (
    <>
      {!hideTooltip && (
        <FloatingDelayGroup delay={{ open: 200, close: 200 }}>
          <Tooltip>
            <TooltipContent>
              <TooltipContainer>
                <Typography forceTheme={ThemeMode.DARK} size={TypographySize.SMALL}>
                  {tooltipTitle}
                </Typography>
                <Typography color='secondary' forceTheme={ThemeMode.DARK} size={TypographySize.SMALL} wrap>
                  {tooltipSubtext}
                </Typography>
              </TooltipContainer>
            </TooltipContent>
            <TooltipTrigger>{iconCircle}</TooltipTrigger>
          </Tooltip>
        </FloatingDelayGroup>
      )}
      {hideTooltip && iconCircle}
    </>
  );
}
