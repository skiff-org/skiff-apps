export default function lookUpElement(el: Node | null, predict: (el: Node) => boolean) {
  while (el?.nodeName) {
    if (predict(el)) {
      return el;
    }

    el = el.parentElement;
  }

  return null;
}
