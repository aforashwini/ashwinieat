// lib/sprites.ts
// Hand-authored pixel matrices drawn with fillRect. Authentically blocky,
// dependency-free. '#' = dark, '+' = mid, '.' = transparent.

export const PALETTE = {
  bg: "#9bbc0f",
  light: "#8bac0f",
  mid: "#306230",
  dark: "#0f380f",
} as const;

export type Matrix = string[];

// ---- The friendly pixel girl (16 wide) -----------------------------------
// Triangular hair, smiling face, little dress, legs.
export const GIRL: Matrix = [
  ".......##.......",
  "......####......",
  ".....######.....",
  "....########....",
  "...##########...",
  "..############..",
  ".##############.",
  "..##........##..",
  "..##.#....#.##..",
  "..##........##..",
  "..##.#....#.##..",
  "..##..####..##..",
  "...##......##...",
  "....########....",
  "..############..",
  "...##########...",
  ".##############.",
  "....##....##....",
  "....##....##....",
  "...###....###...",
];

// Small girl-head used as the snake's head on the board (8 wide).
export const GIRL_HEAD: Matrix = [
  ".######.",
  "########",
  "#......#",
  "#.#..#.#",
  "#......#",
  "#.####.#",
  ".######.",
  "..####..",
];

// ---- Food icons (8x8) keyed by TargetDef.icon ----------------------------
export const ICONS: Record<string, Matrix> = {
  bean: [
    "........",
    "..####..",
    ".##..##.",
    "##....#.",
    "##...##.",
    ".##.###.",
    "..####..",
    "........",
  ],
  leaf: [
    "....#...",
    "...##...",
    "..####..",
    ".#####..",
    "######..",
    ".####.#.",
    "...#.##.",
    "...#....",
  ],
  broccoli: [
    "..#..#..",
    ".######.",
    "########",
    ".######.",
    "...##...",
    "...##...",
    "..####..",
    "........",
  ],
  carrot: [
    "....##..",
    "...#.#..",
    "..####..",
    "..####..",
    "...##...",
    "...##...",
    "....#...",
    "....#...",
  ],
  berry: [
    "...##...",
    "..####..",
    ".######.",
    "#######.",
    "#######.",
    ".######.",
    "..####..",
    "........",
  ],
  apple: [
    "....#...",
    "...#....",
    ".######.",
    "########",
    "########",
    "########",
    ".######.",
    "..#..#..",
  ],
  grain: [
    "...#....",
    "..###...",
    ".#.#.#..",
    "..###...",
    ".#.#.#..",
    "..###...",
    ".#.#.#..",
    "...#....",
  ],
  nut: [
    "...#....",
    "..###...",
    ".#####..",
    "######..",
    "######..",
    ".#####..",
    "..###...",
    "...#....",
  ],
  flax: [
    "........",
    "...##...",
    "..####..",
    ".######.",
    "..####..",
    "...##...",
    "........",
    "........",
  ],
  brazil: [
    "...#....",
    "..##....",
    "..###...",
    ".####...",
    ".#####..",
    "######..",
    "######..",
    ".#####..",
  ],
  spice: [
    "....#...",
    "...#.#..",
    "..#.#.#.",
    "...#.#..",
    "....#...",
    "...#.#..",
    "....#...",
    "....#...",
  ],
  water: [
    "...#....",
    "...#....",
    "..###...",
    ".#####..",
    "#######.",
    "#######.",
    ".#####..",
    "..###...",
  ],
  // onion (alliums)
  onion: [
    "...##...",
    "..#..#..",
    ".#....#.",
    "#......#",
    "#......#",
    "#......#",
    ".#....#.",
    "..####..",
  ],
  // potato (starchy & roots)
  potato: [
    "........",
    "..####..",
    ".######.",
    "########",
    "########",
    "########",
    ".######.",
    "..####..",
  ],
  // tofu block (soy)
  tofu: [
    "........",
    ".######.",
    ".#....#.",
    ".#....#.",
    ".#....#.",
    ".#....#.",
    ".######.",
    "........",
  ],
  // seeds (small scattered)
  seed: [
    "........",
    "..#..#..",
    ".#..#...",
    "...#..#.",
    "..#...#.",
    ".#..#...",
    "...#..#.",
    "........",
  ],
  // citrus wedge
  citrus: [
    "..####..",
    ".#####.#",
    "##.###.#",
    "###.##.#",
    "###.##.#",
    "##.###.#",
    ".#####.#",
    "..####..",
  ],
  // fermenting jar
  jar: [
    ".######.",
    ".#....#.",
    "#......#",
    "#.####.#",
    "#.####.#",
    "#.####.#",
    "#.####.#",
    ".######.",
  ],
  // cup / mug (other plant: tea/coffee)
  cup: [
    "........",
    ".#####..",
    ".#...#.#",
    ".#...#.#",
    ".#...#.#",
    ".#####..",
    "........",
    "..###...",
  ],
};

// ---- Drawing helpers ------------------------------------------------------

function colorFor(ch: string): string | null {
  switch (ch) {
    case "#":
      return PALETTE.dark;
    case "+":
      return PALETTE.mid;
    case "*":
      return PALETTE.light;
    default:
      return null;
  }
}

// Draw a filled matrix at (x,y) with each cell `scale` px.
export function drawMatrix(
  ctx: CanvasRenderingContext2D,
  m: Matrix,
  x: number,
  y: number,
  scale: number,
  override?: string
): void {
  for (let r = 0; r < m.length; r++) {
    const row = m[r];
    for (let c = 0; c < row.length; c++) {
      const col = override ?? colorFor(row[c]);
      if (!col || row[c] === ".") continue;
      ctx.fillStyle = override ?? (colorFor(row[c]) as string);
      ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
    }
  }
}

function isOn(m: Matrix, r: number, c: number): boolean {
  if (r < 0 || r >= m.length) return false;
  if (c < 0 || c >= m[r].length) return false;
  return m[r][c] !== ".";
}

// Draw only the outline (edge cells) of a matrix — used for "missed" icons.
export function drawOutline(
  ctx: CanvasRenderingContext2D,
  m: Matrix,
  x: number,
  y: number,
  scale: number,
  color: string
): void {
  ctx.fillStyle = color;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!isOn(m, r, c)) continue;
      const edge =
        !isOn(m, r - 1, c) ||
        !isOn(m, r + 1, c) ||
        !isOn(m, r, c - 1) ||
        !isOn(m, r, c + 1);
      if (edge) ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
    }
  }
}

export function matrixWidth(m: Matrix): number {
  return m.reduce((w, row) => Math.max(w, row.length), 0);
}
export function matrixHeight(m: Matrix): number {
  return m.length;
}
