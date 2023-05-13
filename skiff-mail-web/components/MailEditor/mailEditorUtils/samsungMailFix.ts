// NOTE: Duplicated in skiff-prosemirror

/** Prevents the `beforeinput` event, so that the `input` doesn't happen. */
const preventTheEvent = (event: InputEvent): void => {
  console.log('Prevented a buggy beforeinput event.');
  event.preventDefault();
};

/**
 * Prevents Samsung Keyboard bug which adds extra line breaks randomly, moves the caret, and removes custom
 * HTML formatting in the contenteditable. It affects e.g. mobile apps, Bing, Opera, Brave, Edge
 *
 * Video with minimal reproduction and details: https://loom.com/share/a380ebaa36104b57b5f7161332de03dc
 * Remove the fix when the issue no longer happens.
 */
export const hackFixSamsungKeyboardBug = (event: InputEvent): void => {
  const target = event.target as HTMLElement;
  const newText = event.data;

  const isPotentiallySamsungKeyboardBugEvent =
    target.isContentEditable && event.inputType === 'insertText' && !event.isComposing && newText;

  if (!isPotentiallySamsungKeyboardBugEvent) {
    return;
  }

  // Now checks that might be heavier due to DOM reading

  const selection = document.getSelection();
  // While the buggy event happens, there is a selection starting at the beginning of the text.
  // In case of other contenteditables this was not the case, but in case of ours with ProseMirror it is.
  // We want to narrow it down as much as possible to avoid preventing events that user actually meant.
  if (selection && selection.rangeCount === 1) {
    const range = selection.getRangeAt(0);
    const isNoTextSelected = range.collapsed;
    if (isNoTextSelected || range.startOffset !== 0) {
      return;
    }
  }

  // Samsung Keyboard bug changes the number of line breaks in the text, but
  // rest is the same as existing .innerText (not the same as .textContent!)
  const existingText = target.innerText;
  const isTextSameExceptForLineBreaks = existingText.replace(/\n/g, '') === newText.replace(/\n/g, '');
  if (existingText.length === 0 || !isTextSameExceptForLineBreaks) {
    return;
  }
  // In most of the cases when the issue happens, there's a line break at the end of the text.
  if (newText.endsWith('\n')) {
    preventTheEvent(event);
    return;
  }
  // Sometimes there is no line break at the end of new text,
  // but another thing specific for this issue is that the number of line breaks decreases.
  const existingLineBreaks = existingText.match(/\n/g);
  const newLineBreaks = newText.match(/\n/g);
  const numberOfLineBreaksDecreased =
    existingLineBreaks && newLineBreaks && existingLineBreaks.length > newLineBreaks.length;
  if (numberOfLineBreaksDecreased) {
    preventTheEvent(event);
  }
};
