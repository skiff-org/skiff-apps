import { HTML5Backend } from 'react-dnd-html5-backend';

export enum DNDItemTypes {
  MESSAGE_CELL = 'MESSAGE_CELL',
  MAIL_CHIP = 'MAIL_CHIP'
}

export type MessageCellDragObject = {
  threadIDs: string[];
  currRouteLabel: string;
};

function shouldIgnoreDragTarget(domNode) {
  return domNode.closest('.ProseMirror');
}

/**
 * return the HTML5Backend, ignores all drag events in .ProseMirror
 */
export const CustomHTML5Backend = (manager, globalContext?: any, configuration?: any) => {
  const html5Backend = HTML5Backend(manager, globalContext, configuration);

  const listeners = [
    'handleTopDragStart',
    'handleTopDragStartCapture',
    'handleTopDragEndCapture',
    'handleTopDragEnter',
    'handleTopDragEnterCapture',
    'handleTopDragLeaveCapture',
    'handleTopDragOver',
    'handleTopDragOverCapture',
    'handleTopDrop',
    'handleTopDropCapture'
  ];

  listeners.forEach((name) => {
    const originalMethod = html5Backend[name];
    html5Backend[name] = (e, ...extraArgs) => {
      if (!shouldIgnoreDragTarget(e.target)) {
        originalMethod(e, ...extraArgs);
      }
    };
  });

  return html5Backend;
};
