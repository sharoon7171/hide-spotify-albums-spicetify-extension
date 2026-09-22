import { installDiscographyActionBarJsxPatch } from "@/webpack/discography-action-bar/patch";

export function initDiscographyHideToggle(sp: typeof Spicetify): () => void {
  return installDiscographyActionBarJsxPatch(sp);
}
