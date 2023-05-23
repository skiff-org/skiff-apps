type SelectionValue = {
  from: number;
  to: number;
};
type SelectionEntry = {
  target: Element;
  selection: SelectionValue;
};
type Callback = (entries: Array<SelectionEntry>, observer: SelectionObserver) => void;
const EMPTY_SELECTION_VALUE = Object.freeze({
  from: 0,
  to: 0
});

function resolveSelectionValue(el: Element): SelectionValue {
  if (!window.getSelection) {
    console.warn('window.getSelection() is not supported');
    return EMPTY_SELECTION_VALUE;
  }

  const selection = window.getSelection();

  if (!selection?.containsNode) {
    console.warn('selection.containsNode() is not supported');
    return EMPTY_SELECTION_VALUE;
  }

  if (!selection.rangeCount) {
    return EMPTY_SELECTION_VALUE;
  }

  const range = selection.getRangeAt(0);

  if (!range) {
    return EMPTY_SELECTION_VALUE;
  }

  const { startContainer, endContainer, startOffset, endOffset } = range;

  if (
    startContainer === el ||
    endContainer === el ||
    (startContainer && el.contains(startContainer)) ||
    (endContainer && el.contains(endContainer))
  ) {
    return {
      from: startOffset,
      to: endOffset
    };
  }

  return EMPTY_SELECTION_VALUE;
}

export default class SelectionObserver {
  _observables: { target: Element; selection: SelectionValue }[] = [];

  _callback: null | Callback = null;

  constructor(callback: Callback) {
    this._callback = callback;
  }

  disconnect(): void {
    this._observables.forEach((obj) => {
      const el: Element = obj.target;
      el.removeEventListener('click', this._check, false);
      el.removeEventListener('selectionchange', this._check, false);
    });

    this._observables = [];
  }

  observe(el: Element): void {
    if (!window.getSelection) {
      console.warn('window.getSelection() is not supported');
      return;
    }

    if (this._observables.some((obj) => obj.target === el)) {
      // Already observed.
      return;
    }

    const obj = {
      target: el,
      selection: resolveSelectionValue(el)
    };
    el.addEventListener('click', this._check, false);
    el.addEventListener('selectionchange', this._check, false);

    this._observables.push(obj);
  }

  takeRecords(): Array<SelectionEntry> {
    return this._observables.slice(0);
  }

  _onClick = (): void => {
    const callback = this._callback;
    this._observables = this._observables.map((obj) => {
      const { target } = obj;
      return {
        target,
        selection: resolveSelectionValue(target)
      };
    });
    callback?.(this.takeRecords(), this);
  };

  _check = (): void => {
    let changed = false;
    const callback = this._callback;
    this._observables = this._observables.map((obj) => {
      const { target, selection } = obj;
      const $selection = resolveSelectionValue(target);

      if (selection === $selection) {
        return obj;
      }

      if (selection.from === $selection.from && selection.to === $selection.to) {
        return obj;
      }

      changed = true;
      return {
        target,
        selection: $selection
      };
    });

    if (changed) {
      callback?.(this.takeRecords(), this);
    }
  };
}
