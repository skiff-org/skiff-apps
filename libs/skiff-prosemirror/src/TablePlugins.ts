import '@skiff-org/prosemirror-tables/style/tables.css';
import '@skiff-org/prosemirror-tables/style/table-popup.css';
import '@skiff-org/prosemirror-tables/style/table-headers.css'; // Tables
import {
  columnHandles,
  columnResizing,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  selectionShadowPlugin,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  TableDateMenu,
  tableEditing,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  TableFiltersMenu,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  tableHeadersMenu,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  TableLabelMenu,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  typesEnforcer
} from '@skiff-org/prosemirror-tables';
import { Plugin } from 'prosemirror-state';
import { isAndroid } from 'react-device-detect';

import { UserSettings } from './Types';
// https://github.com/ProseMirror/prosemirror-tables/blob/master/demo.js

export default (userSettings?: UserSettings, readOnly = false, isTemplate = false): Plugin[] => {
  const tableEditingPlugin = tableEditing({
    allowTableNodeSelection: false
  });

  // disable date cells in android - causing an infinite updates and paragraphs inserts
  // see:
  // https://github.com/skiff-org/skiff-world/pull/6389
  // and https://github.com/skiff-org/skiff-world/pull/6383
  if (isAndroid) {
    delete tableEditingPlugin.props.nodeViews?.date;
  }

  return [
    ...(isTemplate
      ? []
      : [(TableDateMenu as (format: string) => Plugin)(userSettings ? userSettings.dateFormat : 'MM/DD/YYYY')]),
    (typesEnforcer as () => Plugin)(),
    columnResizing({}),
    ...(isTemplate ? [] : [(TableLabelMenu as () => Plugin)()]),
    ...(isTemplate ? [] : [(TableFiltersMenu as () => Plugin)()]),
    ...(readOnly ? [] : [(columnHandles as () => Plugin)()]),
    tableEditingPlugin,
    ...(readOnly ? [] : [(selectionShadowPlugin as () => Plugin)()]),
    ...(isTemplate ? [] : [(tableHeadersMenu as () => Plugin)()])
  ];
};
