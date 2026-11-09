import type { ResolvedTheme } from "@/lib/theme";

// Seven branch families; index 0 is the first-level shade, deeper levels soften.
const LIGHT_BRANCH_SCALES = [
  ["#e35d73", "#e06f82", "#d98292", "#d094a1"],
  ["#ef8a3a", "#ee9752", "#eaa56c", "#e4b388"],
  ["#c9a21c", "#c7aa3d", "#c4b05c", "#bfb67c"],
  ["#2fa37a", "#45ab88", "#5db397", "#78bba7"],
  ["#2f8fd6", "#4a9bda", "#66a8de", "#84b6e2"],
  ["#6d6ae0", "#7d7ae3", "#8f8ce6", "#a2a0ea"],
  ["#b35fc7", "#bb72cd", "#c386d3", "#cb9bd9"],
] as const;

const DARK_BRANCH_SCALES = [
  ["#e07a8c", "#cf7484", "#bd6d7c", "#ab6674"],
  ["#e2a062", "#d1955c", "#bf8a57", "#ad7f52"],
  ["#bcc06a", "#acb062", "#9ca05a", "#8d9153"],
  ["#67bea2", "#5fae95", "#579e88", "#4f8e7b"],
  ["#6fb0d8", "#67a2c7", "#5f93b6", "#5785a5"],
  ["#9196dd", "#858ace", "#7a7ebf", "#6e73b0"],
  ["#b98ac8", "#aa7eb8", "#9b73a9", "#8c689a"],
] as const;

export interface MapPalette {
  canvas: string;
  rootFill: string;
  rootStroke: string;
  rootText: string;
  firstLevelText: string;
  topicText: string;
  boldText: string;
  linkText: string;
  badgeFill: string;
  badgeText: string;
  rootBranch: string;
}

export const MAP_PALETTES: Record<ResolvedTheme, MapPalette> = {
  light: {
    canvas: "#f6f7fb",
    rootFill: "#1f2535",
    rootStroke: "#1f2535",
    rootText: "#ffffff",
    firstLevelText: "#ffffff",
    topicText: "#262b38",
    boldText: "#111521",
    linkText: "#5b5ed6",
    badgeFill: "#ffffff",
    badgeText: "#3b4256",
    rootBranch: "#8a90a6",
  },
  dark: {
    canvas: "#15171e",
    rootFill: "#e6e7ef",
    rootStroke: "#e6e7ef",
    rootText: "#171922",
    firstLevelText: "#14151c",
    topicText: "#dedee6",
    boldText: "#f6f6fa",
    linkText: "#aeb0e6",
    badgeFill: "#22242e",
    badgeText: "#dcdde6",
    rootBranch: "#8f93a8",
  },
};

export const ROOT_BRANCH_COLOR = MAP_PALETTES.light.rootBranch;

export function getBranchColor(
  branchIndex: number | null,
  depth: number,
  theme: ResolvedTheme = "light"
): string {
  if (branchIndex === null || depth < 1) return MAP_PALETTES[theme].rootBranch;

  const scales = theme === "dark" ? DARK_BRANCH_SCALES : LIGHT_BRANCH_SCALES;
  const scale = scales[branchIndex % scales.length];
  const shadeIndex = Math.min(depth - 1, scale.length - 1);
  return scale[shadeIndex];
}

export function getBranchStrokeWidth(depth: number): number {
  if (depth <= 1) return 3;
  if (depth === 2) return 2;
  return 1.5;
}

/** First-level topics are filled pills, so the connector meets them mid-height. */
export function isFilledTopic(depth: number): boolean {
  return depth <= 1;
}
