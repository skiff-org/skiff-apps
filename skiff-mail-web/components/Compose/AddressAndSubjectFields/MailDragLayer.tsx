import { Chip, Size } from 'nightwatch-ui';
import { DragLayerMonitor, useDragLayer, XYCoord } from 'react-dnd';
import { getAddrDisplayName } from 'skiff-front-utils';
import styled from 'styled-components';

import { getBadgeIcon } from '../../../utils/composeUtils';
import { DNDItemTypes } from '../../../utils/dragAndDrop';

import { ComposeAddressChipData } from './RecipientField';

interface DragContainerProps {
  offset: XYCoord | null;
}

const DragContainer = styled.div.attrs((props: DragContainerProps) => ({
  style: {
    transform: `translate(${(props.offset?.x ?? 20) - 20}px, ${(props.offset?.y ?? 20) - 20}px)`
  }
}))<DragContainerProps>`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  pointer-events: none;
  align-items: center;
  display: flex;
  justify-content: space-between;
  opacity: 0.8;
`;

export const MailDragLayer = () => {
  const { item, isDragging, currentOffset, type } = useDragLayer<{
    item: ComposeAddressChipData;
    isDragging: boolean;
    currentOffset: XYCoord | null;
    type: string | symbol | null;
  }>((monitor: DragLayerMonitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    type: monitor.getItemType()
  }));

  if (isDragging && type === DNDItemTypes.MAIL_CHIP) {
    const { formattedDisplayName: chipLabel } = getAddrDisplayName(item.addr);
    return (
      <DragContainer offset={currentOffset}>
        <Chip label={chipLabel} size={Size.MEDIUM} startIcon={getBadgeIcon(chipLabel, item.icon, false)} />
      </DragContainer>
    );
  }
  return null;
};
