import Slide from '@mui/material/Slide';
import { Toast, ToastProps, TOAST_DEFAULT_DURATION } from '@skiff-org/skiff-ui';
import { SnackbarKey, useSnackbar } from 'notistack';
import { useCallback, useRef } from 'react';

/**
 * Wrapper hook for notistack's useSnackbar.
 * Allows for any component to easily summon toasts without needing to incorporate them into the component's JSX.
 * @returns
 */
const useToast = () => {
  /**
   * Cached key to identify the most-recently summoned toast.
   * One key is cached per component that uses this hook.
   * Allows for easy closing of most recent toast.
   */
  const toastKey = useRef<SnackbarKey>();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  /**
   * Wrapper function to call notistack's enqueueSnackbar.
   */
  const slide = (props: any) => (
    <Slide
      {...props}
      direction='up'
      easing={{
        enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
        exit: 'linear'
      }}
      timeout={{
        enter: 200,
        exit: 200
      }}
    />
  );
  const enqueueToast: (toastProps: ToastProps) => SnackbarKey = useCallback(
    (customToastProps: ToastProps) => {
      // extract props for notistack configs
      const { duration = TOAST_DEFAULT_DURATION, actions, persist, onClose } = customToastProps;
      const defaultDuration = !!actions ? duration + 500 * actions.length : duration;
      toastKey.current = enqueueSnackbar(null, {
        // this is safe since our interface enumerates all members of props
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        content: (key: SnackbarKey) => (
          <Toast
            {...customToastProps}
            closeToast={() => {
              if (onClose) {
                onClose();
              }
              closeSnackbar(key);
            }}
            duration={defaultDuration}
            toastKey={key}
          />
        ),
        autoHideDuration: persist ? undefined : defaultDuration,
        persist: persist,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
        TransitionComponent: slide
      });
      return toastKey.current;
    },
    [closeSnackbar, enqueueSnackbar]
  );
  /**
   * Wrapper function to call notistack's closeSnackbar.
   * If a toast key is provided, it will close that one.
   * If not, it will close the most-recently summoned toast within that component.
   */
  const closeToast: (providedToastKey?: SnackbarKey) => void = useCallback(
    (providedToastKey?: SnackbarKey) => closeSnackbar(providedToastKey || toastKey.current),
    [closeSnackbar]
  );
  return { enqueueToast, closeToast };
};

export default useToast;
