import crelt from 'crelt';
import { sanitize } from 'dompurify';
import first from 'lodash/first';
import { IconProps, Icons, KeyCodeSequence, Size, ThemeMode } from 'nightwatch-ui';
import { EditorState } from 'prosemirror-state';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PARAGRAPH } from '../../NodeNames';

interface CreateElementWithClassAndIconParams {
  type: string;
  iconName: IconProps['icon'];
  dataTest?: string;
  defaultColor?: boolean;
  label?: string;
  tooltip?: string;
  tooltipCmd?: string;
  defaultTheme?: boolean;
  id?: string;
}
export const checkIfNodeIsParagraph = (state: EditorState) =>
  state.selection.ranges.every((range) => range.$from.parent.type.name === PARAGRAPH);

export const getSelectedImageDOM = () =>
  document.querySelector('.imagePluginRoot.ProseMirror-selectednode')?.querySelector('.imageResizeBoxCenter');

export const getSelectedCellsDOM = () =>
  document.querySelector('.imagePluginRoot.ProseMirror-selectednode')?.querySelector('.imageResizeBoxCenter');

export const addDeleteHoverClass = (e: MouseEvent) => {
  const tableWrapper = first(Array.from(document.getElementsByClassName('tableFocus')));
  if (!tableWrapper) return;
  tableWrapper.classList.add('mark-delete-cells');
};

export const removeDeleteHoverClass = (e: MouseEvent) => {
  // remove class from all tables in the document' in case that the focus removed before the delete button was clicked
  const tableWrappers = document.getElementsByClassName('tableScrollWrapper');
  if (!tableWrappers.length) return;
  Array.from(tableWrappers).forEach((table) => table.classList.remove('mark-delete-cells'));
};

export const createElementWithClassAndIcon = ({
  type,
  iconName,
  dataTest,
  defaultColor,
  label,
  tooltip,
  tooltipCmd,
  defaultTheme,
  id
}: CreateElementWithClassAndIconParams) => {
  const icon = (
    <Icons
      color={defaultColor ? 'primary' : 'secondary'}
      forceTheme={defaultTheme ? undefined : ThemeMode.DARK}
      icon={iconName}
    />
  );
  const output = document.createElement('div');
  const staticIconEl = renderToStaticMarkup(icon);

  // eslint-disable-next-line no-unsanitized/property
  output.innerHTML = !!label
    ? sanitize(`<div class='icon-text-pairing'>${staticIconEl}<span class='icon-text-label'>${label}</span></div>`)
    : sanitize(`<div>${staticIconEl}</div>`);

  const tooltipCmdSeq = tooltipCmd && <KeyCodeSequence shortcut={tooltipCmd} size={Size.SMALL} />;
  const tooltipCmdEl = document.createElement('div');
  if (tooltipCmdSeq) {
    const staticTooltipCmdSeq = renderToStaticMarkup(tooltipCmdSeq);
    // eslint-disable-next-line no-unsanitized/property
    tooltipCmdEl.innerHTML = sanitize(staticTooltipCmdSeq);
  }

  // TODO: We should probably refactor this HTML tooltip we have move away from material ui and build our own
  const tooltipEl = tooltip && crelt('span', { class: 'menu-tooltip' }, tooltip, tooltipCmdEl);

  const el = crelt(
    type,
    { class: label ? 'menu-dropdown-item' : 'menu-item', 'data-test': dataTest, id: id },
    output,
    tooltipEl
  );

  return el;
};
