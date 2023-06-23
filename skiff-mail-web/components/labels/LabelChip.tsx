import {
  ACCENT_COLOR_VALUES,
  AccentColor,
  Avatar,
  Chip,
  ChipProps,
  Icon,
  Icons,
  Size,
  getAvatarIconOrLabel
} from '@skiff-org/skiff-ui';
import { getWalletIcon, splitEmailToAliasAndDomain } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import { isWalletOrNameServiceAddress } from 'skiff-utils';

import { useThreadActions } from '../../hooks/useThreadActions';
import { UserLabelAlias, UserLabelPlain, getLabelDisplayName } from '../../utils/label';

interface LabelChipProps {
  userLabel: UserLabelPlain | UserLabelAlias;
  onClick?: (e: React.MouseEvent) => void;
  size?: ChipProps['size'];
  customLabelName?: string;
  deletable?: boolean;
}

export const LabelChip: React.FC<LabelChipProps> = ({
  userLabel,
  deletable,
  onClick,
  size,
  customLabelName
}: LabelChipProps) => {
  const { name, variant, color, value } = userLabel;
  const { removeUserLabel, activeThreadID } = useThreadActions();

  const containerColor = color && Object.keys(ACCENT_COLOR_VALUES).includes(color) ? (color as AccentColor) : undefined;

  const getStartIcon = () => {
    if (variant === UserLabelVariant.Alias) {
      const { alias } = splitEmailToAliasAndDomain(name);
      const aliasLabelIcon = isWalletOrNameServiceAddress(alias) ? getWalletIcon(alias) : undefined;
      const labelOrIcon = getAvatarIconOrLabel(name, aliasLabelIcon);
      return <Avatar {...labelOrIcon} rounded size={Size.X_SMALL} />;
    }
    return <Icons color={color} icon={Icon.Dot} size={Size.X_SMALL} />;
  };

  const labelName = getLabelDisplayName(name);

  return (
    <Chip
      key={value}
      containerColor={containerColor}
      label={customLabelName ?? labelName}
      onClick={onClick}
      size={size}
      transparent
      onDelete={
        deletable
          ? async (e) => {
              e?.stopPropagation();
              if (!!activeThreadID) {
                await removeUserLabel([activeThreadID], [userLabel as UserLabelPlain]);
              }
            }
          : undefined
      }
      startIcon={getStartIcon()}
    />
  );
};
