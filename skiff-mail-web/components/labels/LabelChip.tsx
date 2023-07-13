import { Avatar, Chip, ChipSize, FilledVariant, Icon, Icons, getAvatarIconOrLabel } from '@skiff-org/skiff-ui';
import { getWalletIcon, splitEmailToAliasAndDomain } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import { isWalletOrNameServiceAddress } from 'skiff-utils';

import { useThreadActions } from '../../hooks/useThreadActions';
import { UserLabelAlias, UserLabelPlain, getLabelDisplayName } from '../../utils/label';

interface LabelChipProps {
  userLabel: UserLabelPlain | UserLabelAlias;
  onClick?: (e: React.MouseEvent) => void;
  size?: ChipSize;
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

  const getAvatar = () => {
    const { alias } = splitEmailToAliasAndDomain(name);
    const aliasLabelIcon = isWalletOrNameServiceAddress(alias) ? getWalletIcon(alias) : undefined;
    const labelOrIcon = getAvatarIconOrLabel(name, aliasLabelIcon);
    return <Avatar {...labelOrIcon} />;
  };

  const labelName = getLabelDisplayName(name);

  return (
    <Chip
      avatar={variant === UserLabelVariant.Alias ? getAvatar() : undefined}
      icon={variant === UserLabelVariant.Alias ? undefined : <Icons color={color} icon={Icon.Dot} />}
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
