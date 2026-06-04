export const managerPanelCss = `
:host {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: min(68vh, 640px);
  box-sizing: border-box;
  font-family: var(--font-family, CircularSp, CircularSp-Arab, CircularSp-Hebr, CircularSp-Cyrl, CircularSp-Grek, CircularSp-Deva, var(--fallback-fonts, sans-serif));
  color: var(--spice-text, #fff);
  -webkit-font-smoothing: antialiased;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
  max-width: min(760px, 100%);
  min-height: min(64vh, 600px);
  margin: 0 auto;
  box-sizing: border-box;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
}

.header__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1 1 14rem;
}

.header__meta {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.68);
}

.header__count {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.35;
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.88);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  justify-content: flex-end;
  flex-shrink: 0;
}

.toolbar__delete {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.search {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.search__label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.55);
}

.search__field {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 0 14px 0 40px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--spice-rgb-text, 255 255 255), 0.14);
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.08);
  color: var(--spice-text, #fff);
  font-size: 0.875rem;
  line-height: 1.2;
  outline: none;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.search__field::placeholder {
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.45);
}

.search__field:focus {
  border-color: rgba(var(--spice-rgb-subtext, 255 255 255), 0.35);
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.1);
}

.search__wrap {
  position: relative;
  width: 100%;
}

.search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.55;
}

.search__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.5);
}

.btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 9999px;
  border: 1px solid transparent;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease, opacity 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.btn--ghost {
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.08);
  border-color: rgba(var(--spice-rgb-text, 255 255 255), 0.16);
  color: var(--spice-text, #fff);
}

.btn--ghost:hover:not(:disabled) {
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.14);
}

.btn--danger {
  background: rgba(var(--spice-rgb-negative, 233 20 41), 0.18);
  border-color: rgba(var(--spice-rgb-negative, 233 20 41), 0.45);
  color: #ff8a9a;
}

.btn--danger:hover:not(:disabled) {
  background: rgba(var(--spice-rgb-negative, 233 20 41), 0.28);
}

.confirm {
  display: none;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 4;
  width: max(280px, 100%);
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--spice-card, #282828);
  border: 1px solid rgba(var(--spice-rgb-negative, 233 20 41), 0.45);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.confirm[data-visible="true"] {
  display: flex;
}

.confirm__text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  text-align: left;
}

.confirm__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: flex-end;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 280px;
  border-radius: 12px;
  border: 1px solid rgba(var(--spice-rgb-text, 255 255 255), 0.1);
  background: rgba(var(--spice-rgb-shadow, 0 0 0), 0.22);
  overflow: hidden;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 240px;
  max-height: min(58vh, 520px);
  padding: 8px;
  overflow: auto;
  overscroll-behavior: contain;
}

.list::-webkit-scrollbar {
  width: 10px;
}

.list::-webkit-scrollbar-thumb {
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.18);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 240px;
  padding: 48px 24px;
  text-align: center;
}

.empty__title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
}

.empty__hint {
  margin: 0;
  max-width: 36ch;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.6);
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px 14px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(var(--spice-rgb-text, 255 255 255), 0.06);
}

.row:nth-child(odd) {
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.05);
}

.row:nth-child(even) {
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.11);
}

.row:hover {
  background: rgba(var(--spice-rgb-text, 255 255 255), 0.14);
}

.row__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 14rem;
  min-width: min(100%, 14rem);
}

.row__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
  overflow: visible;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.row__id {
  margin: 0;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.35;
  color: rgba(var(--spice-rgb-text, 255 255 255), 0.55);
  overflow-wrap: anywhere;
  word-break: break-all;
  white-space: normal;
}

.row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  flex: 0 0 auto;
  align-self: center;
}

.btn--row {
  min-height: 32px;
  padding: 0 12px;
  font-size: 0.75rem;
}
`.trim();
