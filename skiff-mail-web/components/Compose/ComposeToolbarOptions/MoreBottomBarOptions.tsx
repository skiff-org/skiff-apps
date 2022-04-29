import { IconButtonProps } from '@mui/material';
import { Icon, IconButton } from '@skiff-org/skiff-ui';

export interface MoreBottomBarOption {
  icon: Icon;
  size: string;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface MoreBottomBarOptionsProps {
  moreBottomBarOptions: { [key: string]: MoreBottomBarOption };
}

export default function MoreBottomBarOptions({ moreBottomBarOptions }: MoreBottomBarOptionsProps) {
  return (
    <>
      {Object.keys(moreBottomBarOptions).map((key) => {
        const options = moreBottomBarOptions[key];
        return (
          <IconButton
            active={options.active}
            disabled={options.disabled}
            icon={options.icon}
            key={key}
            onClick={options.onClick}
            size={options.size as IconButtonProps['size']}
            tooltip={options.tooltip}
          />
        );
      })}
    </>
  );
}
