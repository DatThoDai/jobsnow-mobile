/** Layering — overlay header actions must stay above scroll content and collapsing heroes. */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  /** Back / save / share buttons floating over parallax headers */
  overlayHeader: 1000,
  bottomBar: 900,
  modal: 2000,
} as const;
