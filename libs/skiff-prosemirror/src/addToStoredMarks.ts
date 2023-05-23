import { Mark, MarkType } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

/**
 *  Used in case where addStoredMark() does not work
 *  @param storedMarks {EditorState} marks that we want to preserve
 *  @param markType {MarkType}
 *  @param tr {Transaction} the transaction that has been modified with applyMark and has missing stored marks
 *  @param attrs {{ [key: string]: any } | undefined}
 */
const addToStoredMarks = (
  storedMarks: Array<Mark>,
  markType: MarkType,
  tr: Transaction,
  attrs?: { [key: string]: any } | undefined
) => {
  const mark = markType.create(attrs);
  const newStoredMarks = mark.addToSet(storedMarks);
  tr.setStoredMarks(newStoredMarks);
};
export default addToStoredMarks;
