// TODO change to data-scroll instead

// scroll containers
export enum ScrollSelctors {
  CommentsPopup = 'div.comments-popup-container',
  CommentsThread = 'div.comments-scroll',
  EditorBodyScroll = 'div.skiff-editor-frame-body-scroll',
  EditorBody = 'div.skiff-editor-frame-body',
  CommentsSidepanel = 'div.comments-sidepanel-scroll'
}

/**
 * disable scroll in all elements that match the selector
 * @param selector
 * @returns a callback that enables the scroll in the elements
 */
export const freezeOne = (selector: ScrollSelctors) => {
  const eventListenersRemovers: (() => void)[] = [];

  document.querySelectorAll(selector).forEach((element) => {
    // Get the current page scroll position
    const scrollTop = element.scrollTop || document.documentElement.scrollTop;
    const scrollLeft = element.scrollLeft || document.documentElement.scrollLeft;
    const noScroll = (e: Event) => {
      element.scrollTo(scrollLeft, scrollTop);
      e.preventDefault();
      e.stopPropagation();
    };
    element.addEventListener('scroll', noScroll);
    eventListenersRemovers.push(() => element.removeEventListener('scroll', noScroll));
  });

  return () => eventListenersRemovers.forEach((remover) => remover());
};

/**
 * disable scroll in all elements that matches the selectors in `ScrollSelctors`
 * @param selector
 * @returns a callback that enables the scroll in the elements
 */
export const freezeAll = () => {
  const eventsRemovers: (() => void)[] = [];
  for (const selector in ScrollSelctors) {
    const removeEvents = freezeOne(ScrollSelctors[selector]);
    eventsRemovers.push(removeEvents);
  }

  return () => eventsRemovers.forEach((remover) => remover());
};

export const scrollToBottomOfElement = (element: HTMLElement | null) => {
  if (!element) return;
  element.scrollTop = element.scrollHeight;
};
