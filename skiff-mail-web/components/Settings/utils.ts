import { Icon } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';

/**
 * Checks if Icon should be displayed on the device. Returns the icon if check succeed.
 * @param icon Icon to display if check succeed
 * @returns Icon to display
 */
export const getIconAccordingToDevice = (icon: Icon): Icon | undefined => (isMobile ? undefined : icon);
