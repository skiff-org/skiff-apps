/** DUPLICATED FROM EDITOR-MVP */
import { Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import { SnackbarKey } from 'notistack';
import React, { ForwardedRef } from 'react';

/**
 * Fields to control snackbar behavior.
 */
export interface CustomSnackbarProps {
  /**
   * Optional icon.
   */
  icon?: Icon;
  /**
   * For two-lined snackbars, the title is a bolded header above the body text.
   */
  title?: string;
  /**
   * Main text for snackbar.
   */
  body: string;
  /**
   * Makes snackbar stay.
   * @default false
   */
  persist?: boolean;
  /**
   * Anchor position of the snackbar.
   * @default bottom left
   */
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  /**
   * test selector
   */
  dataTest?: string;
  /**
   * number of ms to wait before closing snackbar (if persist is false)
   */
  duration?: number;
  /**
   * CTAs
   */
  actions?: Array<{ label: string; onClick: (snackbarKey?: SnackbarKey) => void }>;
}

/**
 * Internal-only, for accessing the snackbar key within onClicks
 */
interface CustomSnackbarWithKeyProps extends CustomSnackbarProps {
  snackbarKey: SnackbarKey;
}

/**
 * A custom snackbar component.
 * Leverages our color themes, typography, and icon library.
 * Rendered by notistack.
 * @param {CustomSnackbarProps} props Fields to control snackbar behavior.
 * @param {ForwardedRef<HTMLDivElement>} ref Forwarded from notistack.
 * @returns
 */
const CustomSnackbar = (props: CustomSnackbarWithKeyProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { icon, title, body, dataTest, actions, snackbarKey } = props;
  return (
    <div className='snackbarRoot' data-test={dataTest || ''} ref={ref}>
      {icon && <Icons color='white' icon={icon} />}
      <div className='snackbarText'>
        {title && <Typography color='white'>{title}</Typography>}
        <Typography color='white' level={3} type='paragraph' wrap>
          {body}
        </Typography>
      </div>
      <div className='snackbarActions'>
        {actions?.length &&
          actions.map(({ label, onClick }) => (
            <Typography
              color='white'
              key={`${snackbarKey}-${label}`}
              level={3}
              onClick={() => onClick(snackbarKey)}
              type='label'
            >
              {label}
            </Typography>
          ))}
      </div>
    </div>
  );
};

export default React.forwardRef<HTMLDivElement, CustomSnackbarWithKeyProps>(CustomSnackbar);
