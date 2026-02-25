export type AnchorPreviewStatus = {
  state: "preview";
  details: string;
};

export const ANCHOR_PREVIEW_STATUS: AnchorPreviewStatus = {
  state: "preview",
  details: "Not yet anchored on-chain",
};
