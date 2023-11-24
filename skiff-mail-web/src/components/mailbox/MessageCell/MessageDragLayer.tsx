import { Icon, IconText, TypographyWeight } from 'nightwatch-ui';
import { DragLayerMonitor, useDragLayer, XYCoord } from 'react-dnd';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { DNDItemTypes } from '../../../utils/dragAndDrop';

const Container = styled.div<{ offset: XYCoord | null }>`
  position: fixed;
  top: 0;
  left: 0;
  transform: ${(props) => `translate(${(props.offset?.x ?? 20) - 20}px, ${(props.offset?.y ?? 20) - 20}px)`};
  z-index: 999;

  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;

  height: 40px;
  background: var(--bg-emphasis);
  border-radius: 8px;
  box-shadow: var(--shadow-l2);
  backdrop-filter: blur(72px);
  box-sizing: border-box;

  padding: 0 16px;
`;

export const MessageDragLayer = () => {
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  const { isDragging, currentOffset, type } = useDragLayer((monitor: DragLayerMonitor) => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem(),
    currentOffset: monitor.getClientOffset(),
    type: monitor.getItemType()
  }));

  if (isDragging && type === DNDItemTypes.MESSAGE_CELL) {
    const numberOfThreadsLabel = new Set(selectedThreadIDs).size ? new Set(selectedThreadIDs).size.toString() : '1';
    const descriptionLabel = selectedThreadIDs.length > 1 ? 'Message threads' : 'Message thread';
    const label = numberOfThreadsLabel + ' ' + descriptionLabel;
    return (
      <Container offset={currentOffset}>
        <IconText color='white' label={label} startIcon={Icon.Envelope} weight={TypographyWeight.REGULAR} />
      </Container>
    );
  }
  return null;
};
