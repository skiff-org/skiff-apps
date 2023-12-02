import { Avatar, Chip, ChipSize, FilledVariant, Icon, Icons, Size, getAvatarIconOrLabel } from 'nightwatch-ui';
import { WalletAliasWithName, getWalletIcon, splitEmailToAliasAndDomain } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import { isWalletOrNameServiceAddress } from 'skiff-utils';

import { useThreadActions } from '../../hooks/useThreadActions';
import { UserLabelAlias, UserLabelPlain, UserLabelQuickAlias, getLabelDisplayName } from '../../utils/label';

interface LabelChipProps {
  userLabel: UserLabelPlain | UserLabelAlias | UserLabelQuickAlias;
  walletAliasesWithName: WalletAliasWithName[];
  onClick?: (e: React.MouseEvent) => void;
  size?: ChipSize;
  customLabelName?: string;
  deletable?: boolean;
}

export const LabelChip: React.FC<LabelChipProps> = ({
  userLabel,
  walletAliasesWithName,
  deletable,
  onClick,
  size,
  customLabelName
}: LabelChipProps) => {
  const { name, variant, color, value } = userLabel;
  const { removeUserLabel, activeThreadID } = useThreadActions();
  const isCompact = size === Size.X_SMALL;
  const getAvatar = () => {
    const { alias } = splitEmailToAliasAndDomain(name);
    const aliasLabelIcon = isWalletOrNameServiceAddress(alias) ? getWalletIcon(alias) : undefined;
    const labelOrIcon = getAvatarIconOrLabel(name, aliasLabelIcon);
    return <Avatar rounded={isCompact} size={isCompact ? Size.X_SMALL : undefined} {...labelOrIcon} />;
  };

  const labelName = getLabelDisplayName(name, walletAliasesWithName);
  const isAliasOrQuickAlias = variant === UserLabelVariant.Alias || variant === UserLabelVariant.QuickAlias;

  return (
    <Chip
      avatar={isAliasOrQuickAlias ? getAvatar() : undefined}
      icon={isAliasOrQuickAlias ? undefined : <Icons color={color} icon={Icon.Dot} />}
      key={value}
      label={customLabelName ?? labelName}
      onClick={onClick}
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
      size={size}
      variant={FilledVariant.UNFILLED}
    />
  );
};
