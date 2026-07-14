const BRANCH_COLOR_SCALES = [
  ["#c98286", "#b9777c", "#aa6b72", "#9b6068"],
  ["#c99665", "#ba895c", "#aa7c54", "#9a704b"],
  ["#a5ab67", "#979f5f", "#899257", "#7b854f"],
  ["#65a892", "#5c9a88", "#538c7c", "#4b7e70"],
  ["#6d9fc0", "#6492b3", "#5b84a5", "#527796"],
  ["#858bc7", "#797fba", "#6e73ac", "#63689e"],
  ["#a37eb3", "#9673a7", "#89689a", "#7c5e8d"],
] as const;

export const ROOT_BRANCH_COLOR = "#c9c9d2";

export function getBranchColor(
  branchIndex: number | null,
  depth: number
): string {
  if (branchIndex === null || depth < 1) return ROOT_BRANCH_COLOR;

  const scale = BRANCH_COLOR_SCALES[branchIndex % BRANCH_COLOR_SCALES.length];
  const shadeIndex = Math.min(depth - 1, scale.length - 1);
  return scale[shadeIndex];
}

export function getBranchStrokeWidth(depth: number): number {
  if (depth <= 1) return 3;
  if (depth === 2) return 2;
  return 1.5;
}
