import { isMobile } from 'react-device-detect';
import { css } from 'styled-components';

import { DialogType } from './Dialog.types';

const INPUT_CSS = css`
  gap: 16px !important;
  padding: 16px !important;
  border-radius: 8px !important;
`;

export const DIALOG_TYPE_CSS = ({ $type }: { $type: DialogType }) =>
  $type === DialogType.INPUT
    ? INPUT_CSS
    : css`
        gap: ${isMobile ? 8 : 16}px !important;
        padding: ${isMobile ? 16 : 20}px !important;
      `;
