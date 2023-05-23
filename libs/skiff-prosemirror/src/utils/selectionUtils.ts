/**
 * Dispatch a selectionchange event, forcing Prosemirror to update its selection
 * to match the DOM if it hasn't already.
 *
 * Generally, you should call this before calling Y.applyUpdate or manipulating
 * the state in some way that can confuse the browser's selection. Otherwise,
 * you might clobber a selection change before Prosemirror gets to see it,
 * if you happen to be scheduled in between the triggering key/mouse event
 * and the actual selectionchange event (they are queued separately).
 *
 * When there is not an actual selection change pending, this function is cheap,
 * since Prosemirror will notice that its selection is already up-to-date and bail out.
 * So it is okay to call this when you are unsures if there is an
 * actual selection change pending.
 */
export const dispatchSelectionChange = () => {
  document.dispatchEvent(new Event('selectionchange'));
};
