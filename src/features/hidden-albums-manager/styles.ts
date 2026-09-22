export const managerPanelCss = `
:host {
  --ha-green: #1ed760;
  --ha-green-hover: #1fdf64;
  --ha-surface: rgba(var(--spice-rgb-text, 255, 255, 255), 0.06);
  --ha-surface-2: rgba(var(--spice-rgb-text, 255, 255, 255), 0.09);
  --ha-line: rgba(var(--spice-rgb-text, 255, 255, 255), 0.1);
  --ha-muted: var(--spice-subtext, #b3b3b3);
  --ha-text: var(--spice-text, #fff);
  display: block;
  width: 100%;
  min-width: 0;
  min-height: min(68vh, 640px);
  padding: 0;
  box-sizing: border-box;
  font-family: var(--font-family, CircularSp, CircularSp-Arab, CircularSp-Hebr, CircularSp-Cyrl, CircularSp-Grek, CircularSp-Deva, var(--fallback-fonts, sans-serif));
  color: var(--ha-text);
  -webkit-font-smoothing: antialiased;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
  max-width: min(680px, 100%);
  min-height: min(60vh, 560px);
  margin: 0 auto;
  padding: 16px 0 8px;
  box-sizing: border-box;
}

.prefs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prefs__card {
  padding: 16px 18px;
  box-sizing: border-box;
  border-radius: 12px;
  background: var(--ha-surface);
  border: 1px solid var(--ha-line);
}

.account__session,
.account__form {
  display: none;
}

.account[data-state="signed-in"] .account__session {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px 16px;
}

.account[data-state="signed-out"] .account__form,
.account[data-state="loading"] .account__form {
  display: grid;
  gap: 10px;
}

.account[data-state="loading"] .account__form .account__input,
.account[data-state="loading"] .account__form .account__actions {
  opacity: 0.45;
  pointer-events: none;
}

.account__session .btn {
  margin-top: 2px;
  min-width: 5.5rem;
}

.account__status {
  min-width: 0;
}

.account__title,
.account__email,
.settings__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--ha-text);
}

.account__email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account__hint,
.settings__hint {
  margin: 5px 0 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--ha-muted);
}

.account__input {
  width: 100%;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--ha-line);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.account__input:focus {
  outline: 2px solid rgba(30, 215, 96, 0.4);
  outline-offset: 1px;
  border-color: rgba(30, 215, 96, 0.55);
}

.account__actions {
  display: flex;
  gap: 8px;
}

.settings {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px 16px;
}

.settings[hidden] {
  display: none !important;
}

.settings__copy {
  min-width: 0;
}

.settings__control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 2px;
}

.switch {
  position: relative;
  width: 42px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(var(--spice-rgb-text, 255, 255, 255), 0.22);
  cursor: pointer;
  flex-shrink: 0;
}

.switch[data-on="true"] {
  background: var(--ha-green);
}

.switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}

.switch[data-on="true"] .switch__thumb {
  transform: translateX(18px);
}

.switch:disabled {
  opacity: 0.55;
  cursor: progress;
}

.library {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px 16px;
}

.header__copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1 1 12rem;
}

.header__meta {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--ha-muted);
}

.header__count {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--ha-text);
}

.toolbar {
  display: flex;
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
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ha-muted);
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
  opacity: 0.5;
}

.search__field {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  padding: 0 14px 0 40px;
  border-radius: 8px;
  border: 1px solid var(--ha-line);
  background: var(--ha-surface);
  color: var(--ha-text);
  font-size: 0.875rem;
  line-height: 1.2;
  outline: none;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.search__field::placeholder {
  color: rgba(var(--spice-rgb-text, 255, 255, 255), 0.4);
}

.search__field:focus {
  border-color: rgba(30, 215, 96, 0.45);
  background: var(--ha-surface-2);
}

.search__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--ha-muted);
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

.btn--primary {
  background: var(--ha-green);
  border-color: var(--ha-green);
  color: #000;
}

.btn--primary:hover:not(:disabled) {
  background: var(--ha-green-hover);
  border-color: var(--ha-green-hover);
}

.btn--ghost {
  background: transparent;
  border-color: var(--ha-line);
  color: var(--ha-text);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--ha-surface-2);
  border-color: rgba(var(--spice-rgb-text, 255, 255, 255), 0.2);
}

.btn--danger {
  background: transparent;
  border-color: rgba(233, 20, 41, 0.5);
  color: #ff8a9a;
}

.btn--danger:hover:not(:disabled) {
  background: rgba(233, 20, 41, 0.16);
}

.btn--compact {
  min-height: 32px;
  padding: 0 12px;
  font-size: 0.75rem;
}

.btn--row {
  min-height: 30px;
  padding: 0 12px;
  font-size: 0.75rem;
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
  padding: 14px;
  border-radius: 12px;
  background: var(--spice-card, #282828);
  border: 1px solid rgba(233, 20, 41, 0.45);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
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
  gap: 8px;
  justify-content: flex-end;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 260px;
  border-radius: 12px;
  border: 1px solid var(--ha-line);
  background: rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.list {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 220px;
  max-height: min(54vh, 480px);
  padding: 6px;
  overflow: auto;
  overscroll-behavior: contain;
}

.list::-webkit-scrollbar {
  width: 10px;
}

.list::-webkit-scrollbar-thumb {
  background: rgba(var(--spice-rgb-text, 255, 255, 255), 0.18);
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
  min-height: 220px;
  padding: 40px 24px;
  text-align: center;
}

.empty__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.empty__hint {
  margin: 0;
  max-width: 34ch;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--ha-muted);
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 14px;
  border-radius: 8px;
}

.row:hover {
  background: var(--ha-surface-2);
}

.row__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.row__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.row__id {
  margin: 0;
  font-size: 0.6875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.35;
  color: var(--ha-muted);
  overflow-wrap: anywhere;
  word-break: break-all;
}

.row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
`.trim();
