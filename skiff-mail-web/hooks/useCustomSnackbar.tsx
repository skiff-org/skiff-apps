/** DUPLICATED FROM EDITOR-MVP */
import { SnackbarKey, useSnackbar } from 'notistack';
import React, { useCallback, useRef } from 'react';

import CustomSnackbar, { CustomSnackbarProps } from '../components/shared/CustomSnackbar';

/**
 * Wrapper hook for notistack's useSnackbar.
 * Allows for any component to easily summon snackbars without needing to incorporate them into the component's JSX.
 * @returns
 */
function useCustomSnackbar() {
  /**
   * Cached key to identify the most-recently summoed snackbar.
   * One key is cached per component that uses this hook.
   * Allows for easy closing of most recent snackbar.
   */
  const snackbarKey = useRef<SnackbarKey>();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  /**
   * Wrapper function to call notistack's enqueueSnackbar.
   */
  const enqueueCustomSnackbar = useCallback(
    (customSnackbarProps: CustomSnackbarProps) => {
      // extract props for notistack configs
      const { persist, position: anchorOrigin, duration } = customSnackbarProps;
      snackbarKey.current = enqueueSnackbar(null, {
        // this is safe since our interface enumerates all members of props
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        content: (key) => <CustomSnackbar {...customSnackbarProps} snackbarKey={key} />,
        persist,
        anchorOrigin,
        autoHideDuration: duration
      });
      return snackbarKey.current;
    },
    [snackbarKey.current]
  );
  /**
   * Wrapper function to call notistack's closeSnackbar.
   * If a snackbar key is provided, it will close that one.
   * If not, it will close the most-recently summoned snackbar within that component.
   */
  const closeCustomSnackbar = useCallback(
    (providedSnackbarKey?: SnackbarKey) => closeSnackbar(providedSnackbarKey || snackbarKey.current),
    [snackbarKey.current]
  );
  return { enqueueCustomSnackbar, closeCustomSnackbar };
}

export default useCustomSnackbar;
