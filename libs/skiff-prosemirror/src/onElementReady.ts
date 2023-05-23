/**
 * waits for an html element to finish rendering before returning.
 * useful for situations where you need to style based on computed values,
 * i.e. size. this will only run once the element has rendered in the DOM
 * (typically by this point it has its final sizing)
 *
 * based on https://stackoverflow.com/a/44979019/11722138
 *
 * @param {HTMLElement} $element element to await
 */
const onElementReady = ($element: unknown) =>
  new Promise((resolve) => {
    const waitForElement = () => {
      if ($element) {
        resolve($element);
      } else {
        window.requestAnimationFrame(waitForElement);
      }
    };

    waitForElement();
  });

export default onElementReady;
