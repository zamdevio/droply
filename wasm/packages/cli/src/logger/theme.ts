import { bold, dim, cyan, blue, magenta, yellow, red, green, gray } from 'colorette';

export const symbols = {
  info: 'ℹ',
  success: '✔',
  warn: '⚠',
  error: '✖',
  section: '▸',   // for headings
  item: '•',      // list bullets
  verbose: '»',
};

export const colors = {
  primary: cyan,          // section titles, primary highlights
  subtle: gray,           // low-importance text
  success: green,
  warn: yellow,
  error: red,
  accent: magenta,
  file: blue,             // file paths
};

export const styles = {
  key: (s: string) => bold(s),
  dim: (s: string) => dim(s),
  strong: (s: string) => bold(s),
};
