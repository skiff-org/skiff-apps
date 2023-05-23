import { InputRule } from 'prosemirror-inputrules';
import { MarkType, Schema } from 'prosemirror-model';
import { Selection, TextSelection } from 'prosemirror-state';
import isURL from 'validator/lib/isURL';

import findActiveMarks from '../findActiveMarks';
import { DOC_DESCRIPTION, DOC_TITLE } from '../NodeNames';
import sanitizeURL from '../sanitizeURL';
import uuid from '../ui/uuid';

/**
 * Determines if selection is in a node that is not allowed to have a link.
 * @param selection Editor selection.
 * @returns True or false if link allowed.
 */
export const isSelectionInNonLinkableNodes = (selection: Selection): boolean => {
  const { name: parentName } = selection.$from.parent.type;
  const inTitleNode = parentName === DOC_TITLE;
  const inDescriptionNode = parentName === DOC_DESCRIPTION;
  return inDescriptionNode || inTitleNode;
};

const AFTER_SPACE_TRIGGER = /\S+\s$/;
const ANGLED_BRACKETS_TRIGGER = /<\S+>/;

/**
 * Creating links by typing something like this: [This text will be the link](www.thisWillBeTheURL.com)
 * @param markType Type of the mark applied
 * @param schema ProseMirror Schema
 */
export function linkFromBrackets(markType: MarkType, schema: Schema): InputRule {
  const pattern = /\[(?<label>.+)\]\((?<link>.+)\)/i;
  return new InputRule(pattern, (state, match, start, end) => {
    if (isSelectionInNonLinkableNodes(state.selection)) return null;
    const { tr, doc } = state;
    const { label, link } = match[0].match(pattern)?.groups ?? {};
    const activeMarks = findActiveMarks(doc, start - 1, end, markType);
    if (activeMarks === null || activeMarks.length > 0) return null;

    if (label) {
      return tr
        .delete(tr.mapping.map(start - 1), tr.mapping.map(end))

        .insert(
          tr.mapping.map(start - 1),
          schema.text(label, [
            markType.create({
              href: sanitizeURL(link),
              id: uuid()
            })
          ])
        );
    }
    return null;
  });
}

/**
 * Creating links by typing them into angled brackets like this <www.skiff.org> supported link formats (NOT in order of the regex below): www.skiff.org, https://skiff.org, https://www.skiff.org, skiff.org
 * @param markType Type of the mark applied
 * @param schema ProseMirror Schema
 */
export function linkWithAngleBracketsRule(markType: MarkType, schema: Schema): InputRule {
  return new InputRule(ANGLED_BRACKETS_TRIGGER, (state, match, start, end) => {
    if (isSelectionInNonLinkableNodes(state.selection)) return null;
    // slicing off brackets
    const candidate = match[0].slice(1, match[0].length - 1);
    const candidateIsURL = isURL(candidate);
    const { tr, doc } = state;
    const activeMarks = findActiveMarks(doc, start, end, markType);

    if (activeMarks === null || activeMarks.length > 0) return null;

    if (candidateIsURL) {
      return tr
        .addMark(
          start + 1,
          end,
          markType.create({
            href: sanitizeURL(candidate),
            id: uuid()
          })
        )
        .delete(tr.mapping.map(start), tr.mapping.map(start + 1))
        .insert(tr.mapping.map(end), schema.text(' '))
        .setSelection(TextSelection.create(tr.doc, tr.mapping.map(end), tr.mapping.map(end)));
    }
    return null;
  });
}

/**
 * Creating links by typing them in the editor and pressing space after supported link formats
 * (NOT in order of the regex below): www.skiff.org, https://skiff.org, https://www.skiff.org, skiff.org
 * @param markType Type of the mark applied
 * @param schema ProseMirror Schema
 */

export function linkFormatRule(markType: MarkType, schema: Schema): InputRule {
  return new InputRule(AFTER_SPACE_TRIGGER, (state, match, start, end) => {
    if (isSelectionInNonLinkableNodes(state.selection)) return null;
    const { tr, doc } = state;
    // slice the whitespace at the end
    const candidate = match[0].slice(0, match[0].length - 1);
    const isUrl = isURL(candidate);
    const activeMarks = findActiveMarks(doc, start, end, markType);
    if (activeMarks === null || activeMarks.length > 0) return null;
    if (isUrl) {
      return tr
        .addMark(
          start,
          end,
          markType.create({
            href: sanitizeURL(candidate),
            id: uuid()
          })
        )
        .insert(tr.mapping.map(end), schema.text(' '))
        .setSelection(TextSelection.create(tr.doc, tr.mapping.map(end), tr.mapping.map(end)));
    }
    return null;
  });
}
