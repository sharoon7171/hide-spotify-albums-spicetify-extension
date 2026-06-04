const FONT =
  'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';

const SPOTIFY_ACTION_BAR_ITEM_GAP_PX = 22;
const HIDE_BUTTON_HEIGHT_PX = 36;

export const hideButtonShadowCss = `
:host {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-shrink: 0;
  flex-grow: 0;
  width: auto;
  min-width: 96px;
  height: ${HIDE_BUTTON_HEIGHT_PX}px;
  min-height: ${HIDE_BUTTON_HEIGHT_PX}px;
  max-height: ${HIDE_BUTTON_HEIGHT_PX}px;
  margin: 0;
  margin-inline-start: 0;
  margin-inline-end: ${SPOTIFY_ACTION_BAR_ITEM_GAP_PX}px;
  padding: 0;
  border: none;
  vertical-align: middle;
  box-sizing: border-box;
  contain: layout;
  font-family: ${FONT};
}

.ext-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.ext-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  height: ${HIDE_BUTTON_HEIGHT_PX}px;
  min-height: ${HIDE_BUTTON_HEIGHT_PX}px;
  max-height: ${HIDE_BUTTON_HEIGHT_PX}px;
  padding: 0 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.015em;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  border: 1px solid transparent;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease,
    opacity 0.12s ease,
    transform 0.08s ease;
  contain: layout;
}

.ext-btn__icon {
  flex-shrink: 0;
  display: inline-flex;
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.ext-btn__icon svg {
  display: block;
  width: 16px;
  height: 16px;
}

.ext-btn__label {
  pointer-events: none;
}

.ext-btn--hide {
  background: hsla(0, 0%, 100%, 0.1);
  border-color: hsla(0, 0%, 100%, 0.22);
  color: #fff;
}

.ext-btn--hide:hover:not(:disabled) {
  background: hsla(0, 0%, 100%, 0.16);
  border-color: hsla(0, 0%, 100%, 0.32);
}

.ext-btn--unhide {
  background: hsla(142, 71%, 45%, 0.22);
  border-color: hsla(142, 65%, 50%, 0.55);
  color: #86efac;
}

.ext-btn--unhide:hover:not(:disabled) {
  background: hsla(142, 71%, 45%, 0.32);
  border-color: hsla(142, 65%, 55%, 0.7);
  color: #bbf7d0;
}

.ext-btn:focus-visible {
  box-shadow: 0 0 0 2px hsla(0, 0%, 100%, 0.35);
}

.ext-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.ext-btn:disabled {
  opacity: 0.55;
  cursor: wait;
  pointer-events: none;
}
`.trim();

export const iconSvgEyeOff = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;

export const iconSvgEye = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
