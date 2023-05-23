import { isEdgeChromium, isMacOs, isChrome, isChromium } from 'react-device-detect';

// Disable spellcheck on Mac+Chromium until a Chromium bug that makes it really slow is fixed.
// See https://linear.app/skiff/issue/ENG-3308/blocking-during-typing-in-large-doc-nothing-on-main-thread
const editorSpellcheckBool = !(isMacOs && (isChrome || isChromium || isEdgeChromium));
export const editorSpellcheck: 'true' | 'false' = editorSpellcheckBool ? 'true' : 'false';
