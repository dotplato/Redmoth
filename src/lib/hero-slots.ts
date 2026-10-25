/**
 * Tile positions for the home hero network, on its isometric grid (hub is [0, 0]), and which axis each
 * wire leaves the hub on. Inner ring first; the rest extend the scene to the left and right.
 * Shared by the animation and the admin hero editor so slot numbers always mean the same place.
 */
export const HERO_SLOTS: { cell: [number, number]; route: "x" | "y"; ring: "inner" | "left" | "right" }[] = [
  { cell: [-2, -2], route: "y", ring: "inner" },
  { cell: [1, -3], route: "y", ring: "inner" },
  { cell: [-3, 1], route: "x", ring: "inner" },
  { cell: [3, -1], route: "x", ring: "inner" },
  { cell: [2, 2], route: "y", ring: "inner" },
  { cell: [-1, 3], route: "y", ring: "inner" },
  { cell: [2, -5], route: "y", ring: "right" },
  { cell: [5, -2], route: "x", ring: "right" },
  { cell: [4, -5], route: "y", ring: "right" },
  { cell: [6, -3], route: "x", ring: "right" },
  { cell: [-5, 2], route: "x", ring: "left" },
  { cell: [-2, 5], route: "y", ring: "left" },
  { cell: [-5, 4], route: "x", ring: "left" },
  { cell: [-3, 6], route: "y", ring: "left" },
];

export const HERO_SLOT_COUNT = HERO_SLOTS.length;

/** Screen position of a slot (same projection as the animation), handy for drawing a slot map. */
export function heroSlotPoint(index: number) {
  const [gx, gy] = HERO_SLOTS[index].cell;
  return { x: (gx - gy) * 55, y: (gx + gy) * 27.5 };
}
