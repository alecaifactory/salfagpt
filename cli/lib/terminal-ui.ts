/**
 * Beautiful Terminal UI for Upload Progress
 * 
 * Features:
 * - Color-coded status indicators
 * - Progress bars with percentages
 * - Clean visual hierarchy
 * - Error highlighting
 * - Real-time updates
 */

// ANSI Color Codes
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Backgrounds
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Box Drawing Characters
export const box = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  verticalRight: '╠',
  verticalLeft: '╣',
  horizontalDown: '╦',
  horizontalUp: '╩',
  cross: '╬',
  
  // Light box
  lightTopLeft: '┌',
  lightTopRight: '┐',
  lightBottomLeft: '└',
  lightBottomRight: '┘',
  lightHorizontal: '─',
  lightVertical: '│',
  lightVerticalRight: '├',
  lightVerticalLeft: '┤',
  lightCross: '┼',
  
  // Tree
  treeRight: '├─',
  treeLast: '└─',
  treeVertical: '│ ',
  treeSpace: '  ',
};

// Icons
export const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  file: '📄',
  folder: '📁',
  upload: '📤',
  download: '📥',
  process: '⚙️',
  check: '✓',
  cross: '✗',
  clock: '⏱️',
  money: '💰',
  chart: '📊',
  test: '🧪',
  search: '🔍',
  brain: '🧠',
  link: '🔗',
  fire: '🔥',
  zap: '⚡',
  target: '🎯',
  sparkles: '✨',
};

/**
 * Create a progress bar
 */
export function progressBar(
  current: number,
  total: number,
  width: number = 40,
  options: {
    showPercentage?: boolean;
    showFraction?: boolean;
    color?: keyof typeof colors;
    char?: string;
  } = {}
): string {
  const {
    showPercentage = true,
    showFraction = true,
    color = 'green',
    char = '█',
  } = options;
  
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  const colorCode = colors[color] || colors.green;
  const filledBar = colorCode + char.repeat(filled) + colors.reset;
  const emptyBar = colors.dim + '░'.repeat(empty) + colors.reset;
  
  let bar = `[${filledBar}${emptyBar}]`;
  
  if (showPercentage) {
    bar += ` ${percentage.toFixed(1)}%`;
  }
  
  if (showFraction) {
    bar += ` (${current}/${total})`;
  }
  
  return bar;
}

/**
 * Create a box with title
 */
export function createBox(
  title: string,
  content: string[],
  width: number = 80,
  style: 'double' | 'single' = 'double'
): string {
  const chars = style === 'double' ? {
    tl: box.topLeft,
    tr: box.topRight,
    bl: box.bottomLeft,
    br: box.bottomRight,
    h: box.horizontal,
    v: box.vertical,
  } : {
    tl: box.lightTopLeft,
    tr: box.lightTopRight,
    bl: box.lightBottomLeft,
    br: box.lightBottomRight,
    h: box.lightHorizontal,
    v: box.lightVertical,
  };
  
  const lines: string[] = [];
  
  // Top border with title
  const titlePadding = Math.max(0, width - title.length - 4);
  const leftPad = Math.floor(titlePadding / 2);
  const rightPad = titlePadding - leftPad;
  
  lines.push(
    chars.tl +
    chars.h.repeat(leftPad) +
    ` ${colors.bright}${title}${colors.reset} ` +
    chars.h.repeat(rightPad) +
    chars.tr
  );
  
  // Content lines
  content.forEach(line => {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, ''); // Remove ANSI codes for length calc
    const padding = Math.max(0, width - stripped.length - 2);
    lines.push(`${chars.v} ${line}${' '.repeat(padding)}${chars.v}`);
  });
  
  // Bottom border
  lines.push(chars.bl + chars.h.repeat(width) + chars.br);
  
  return lines.join('\n');
}

/**
 * Format file size
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

/**
 * Create a status indicator
 */
export function status(
  type: 'success' | 'error' | 'warning' | 'info' | 'progress',
  message: string
): string {
  const indicators = {
    success: colors.green + icons.success,
    error: colors.red + icons.error,
    warning: colors.yellow + icons.warning,
    info: colors.cyan + icons.info,
    progress: colors.blue + icons.rocket,
  };
  
  return `${indicators[type]} ${message}${colors.reset}`;
}

/**
 * Create a tree view line
 */
export function tree(
  message: string,
  isLast: boolean = false,
  indent: number = 0,
  type: 'success' | 'error' | 'info' | 'progress' = 'info'
): string {
  const prefix = '  '.repeat(indent);
  const branch = isLast ? box.treeLast : box.treeRight;
  
  const colorMap = {
    success: colors.green,
    error: colors.red,
    info: colors.cyan,
    progress: colors.yellow,
  };
  
  const color = colorMap[type];
  
  return `${prefix}${color}${branch}${colors.reset} ${message}`;
}

/**
 * Clear screen and move cursor to top
 */
export function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Move cursor up N lines
 */
export function cursorUp(lines: number): void {
  process.stdout.write(`\x1b[${lines}A`);
}

/**
 * Create a header banner
 */
export function banner(title: string, subtitle?: string): string {
  const width = 80;
  const lines: string[] = [];
  
  lines.push(colors.bright + colors.cyan + '═'.repeat(width) + colors.reset);
  
  const titlePad = Math.floor((width - title.length) / 2);
  lines.push(
    colors.bright + colors.cyan +
    ' '.repeat(titlePad) + title + ' '.repeat(width - titlePad - title.length) +
    colors.reset
  );
  
  if (subtitle) {
    const subtitlePad = Math.floor((width - subtitle.length) / 2);
    lines.push(
      colors.dim +
      ' '.repeat(subtitlePad) + subtitle + ' '.repeat(width - subtitlePad - subtitle.length) +
      colors.reset
    );
  }
  
  lines.push(colors.bright + colors.cyan + '═'.repeat(width) + colors.reset);
  
  return lines.join('\n');
}

/**
 * Create a section header
 */
export function section(title: string, icon: string = icons.folder): string {
  return `\n${colors.bright}${colors.blue}${icon} ${title}${colors.reset}\n${colors.dim}${'─'.repeat(80)}${colors.reset}\n`;
}

/**
 * Format a metric
 */
export function metric(label: string, value: string | number, color: keyof typeof colors = 'white'): string {
  const colorCode = colors[color] || colors.white;
  return `${colors.dim}${label}:${colors.reset} ${colorCode}${colors.bright}${value}${colors.reset}`;
}

/**
 * Create a step indicator
 */
export function step(
  stepNum: number,
  total: number,
  name: string,
  status: 'pending' | 'progress' | 'done' | 'error' = 'pending'
): string {
  const statusIcons = {
    pending: colors.dim + '⏸️ ',
    progress: colors.yellow + '⏳',
    done: colors.green + '✅',
    error: colors.red + '❌',
  };
  
  const statusColor = {
    pending: colors.dim,
    progress: colors.yellow,
    done: colors.green,
    error: colors.red,
  };
  
  return `${statusIcons[status]} ${statusColor[status]}Step ${stepNum}/${total}: ${name}${colors.reset}`;
}

/**
 * Create a file processing header
 */
export function fileHeader(
  fileNum: number,
  total: number,
  fileName: string,
  size: string
): string {
  const lines: string[] = [];
  
  lines.push('\n' + colors.bright + colors.blue + '═'.repeat(80) + colors.reset);
  lines.push(colors.bright + `📄 FILE ${fileNum}/${total}` + colors.reset);
  lines.push(colors.bright + colors.blue + '═'.repeat(80) + colors.reset);
  lines.push(colors.cyan + '📁 ' + fileName + colors.reset);
  lines.push(colors.dim + '📊 Size: ' + size + colors.reset);
  lines.push(colors.bright + colors.blue + '─'.repeat(80) + colors.reset);
  
  return lines.join('\n');
}

/**
 * Create a batch summary table
 */
export function batchSummary(data: {
  batchNum: number;
  totalBatches: number;
  succeeded: number;
  failed: number;
  totalFiles: number;
  chunks: number;
  cost: number;
  duration: number;
}): string {
  const lines: string[] = [];
  
  lines.push('\n' + colors.bright + colors.green + '┌' + '─'.repeat(78) + '┐' + colors.reset);
  lines.push(colors.bright + colors.green + '│' + colors.reset + 
    ` ${colors.bright}BATCH ${data.batchNum}/${data.totalBatches} COMPLETE${colors.reset}` +
    ' '.repeat(78 - ` BATCH ${data.batchNum}/${data.totalBatches} COMPLETE`.length - 1) +
    colors.bright + colors.green + '│' + colors.reset
  );
  lines.push(colors.bright + colors.green + '├' + '─'.repeat(78) + '┤' + colors.reset);
  
  const successRate = ((data.succeeded / data.totalFiles) * 100).toFixed(1);
  const successColor = data.failed === 0 ? colors.green : colors.yellow;
  
  lines.push(colors.bright + colors.green + '│' + colors.reset +
    ` ${icons.success} Succeeded: ${successColor}${colors.bright}${data.succeeded}/${data.totalFiles}${colors.reset}` +
    ' '.repeat(78 - ` ${icons.success} Succeeded: ${data.succeeded}/${data.totalFiles}`.length - 1) +
    colors.bright + colors.green + '│' + colors.reset
  );
  
  if (data.failed > 0) {
    lines.push(colors.bright + colors.green + '│' + colors.reset +
      ` ${icons.error} Failed: ${colors.red}${colors.bright}${data.failed}${colors.reset}` +
      ' '.repeat(78 - ` ${icons.error} Failed: ${data.failed}`.length - 1) +
      colors.bright + colors.green + '│' + colors.reset
    );
  }
  
  lines.push(colors.bright + colors.green + '│' + colors.reset +
    ` ${icons.chart} Chunks created: ${colors.cyan}${data.chunks.toLocaleString()}${colors.reset}` +
    ' '.repeat(78 - ` ${icons.chart} Chunks created: ${data.chunks.toLocaleString()}`.length - 1) +
    colors.bright + colors.green + '│' + colors.reset
  );
  
  lines.push(colors.bright + colors.green + '│' + colors.reset +
    ` ${icons.money} Cost: ${colors.magenta}$${data.cost.toFixed(4)}${colors.reset}` +
    ' '.repeat(78 - ` ${icons.money} Cost: $${data.cost.toFixed(4)}`.length - 1) +
    colors.bright + colors.green + '│' + colors.reset
  );
  
  lines.push(colors.bright + colors.green + '│' + colors.reset +
    ` ${icons.clock} Duration: ${colors.yellow}${formatDuration(data.duration)}${colors.reset}` +
    ' '.repeat(78 - ` ${icons.clock} Duration: ${formatDuration(data.duration)}`.length - 1) +
    colors.bright + colors.green + '│' + colors.reset
  );
  
  lines.push(colors.bright + colors.green + '└' + '─'.repeat(78) + '┘' + colors.reset);
  
  return lines.join('\n');
}

/**
 * Create cumulative progress display
 */
export function cumulativeProgress(data: {
  completed: number;
  total: number;
  succeeded: number;
  failed: number;
  chars: number;
  chunks: number;
  cost: number;
  elapsed: number;
  eta: number;
}): string {
  const lines: string[] = [];
  
  lines.push('\n' + colors.bright + colors.magenta + '╔' + '═'.repeat(78) + '╗' + colors.reset);
  lines.push(colors.bright + colors.magenta + '║' + colors.reset +
    ` ${colors.bright + colors.white}CUMULATIVE PROGRESS${colors.reset}` +
    ' '.repeat(78 - ' CUMULATIVE PROGRESS'.length - 1) +
    colors.bright + colors.magenta + '║' + colors.reset
  );
  lines.push(colors.bright + colors.magenta + '╠' + '═'.repeat(78) + '╣' + colors.reset);
  
  // Progress bar
  const progressBarStr = progressBar(data.completed, data.total, 50, { color: 'cyan' });
  lines.push(colors.bright + colors.magenta + '║' + colors.reset +
    ` ${progressBarStr}` +
    ' '.repeat(78 - progressBarStr.replace(/\x1b\[[0-9;]*m/g, '').length - 1) +
    colors.bright + colors.magenta + '║' + colors.reset
  );
  
  lines.push(colors.bright + colors.magenta + '╠' + '─'.repeat(78) + '╣' + colors.reset);
  
  // Metrics
  const successRate = ((data.succeeded / data.completed) * 100).toFixed(1);
  const successColor = data.failed === 0 ? colors.green : colors.yellow;
  
  lines.push(colors.bright + colors.magenta + '║' + colors.reset +
    ` ${metric('Completed', `${data.completed}/${data.total}`, 'cyan')}  ` +
    `${metric('Success rate', `${successColor}${successRate}%${colors.reset}`, 'green')}` +
    ' '.repeat(78 - ` Completed: ${data.completed}/${data.total}  Success rate: ${successRate}%`.length - 1) +
    colors.bright + colors.magenta + '║' + colors.reset
  );
  
  lines.push(colors.bright + colors.magenta + '║' + colors.reset +
    ` ${metric('Characters', data.chars.toLocaleString(), 'yellow')}  ` +
    `${metric('Chunks', data.chunks.toLocaleString(), 'cyan')}` +
    ' '.repeat(78 - ` Characters: ${data.chars.toLocaleString()}  Chunks: ${data.chunks.toLocaleString()}`.length - 1) +
    colors.bright + colors.magenta + '║' + colors.reset
  );
  
  lines.push(colors.bright + colors.magenta + '║' + colors.reset +
    ` ${metric('Cost', `$${data.cost.toFixed(4)}`, 'magenta')}  ` +
    `${metric('Elapsed', formatDuration(data.elapsed), 'yellow')}  ` +
    `${metric('ETA', formatDuration(data.eta), 'green')}` +
    ' '.repeat(78 - ` Cost: $${data.cost.toFixed(4)}  Elapsed: ${formatDuration(data.elapsed)}  ETA: ${formatDuration(data.eta)}`.length - 1) +
    colors.bright + colors.magenta + '║' + colors.reset
  );
  
  lines.push(colors.bright + colors.magenta + '╚' + '═'.repeat(78) + '╝' + colors.reset);
  
  return lines.join('\n');
}

/**
 * Log file processing step
 */
export function logStep(
  fileNum: number,
  total: number,
  stepName: string,
  status: 'start' | 'done' | 'error',
  details?: string,
  duration?: number
): void {
  const fileNumStr = `[${fileNum}/${total}]`;
  const statusIcon = {
    start: colors.yellow + '⏳',
    done: colors.green + '✅',
    error: colors.red + '❌',
  }[status];
  
  let message = `${colors.dim}${fileNumStr}${colors.reset} ${statusIcon} ${colors.cyan}${stepName}${colors.reset}`;
  
  if (details) {
    message += ` ${colors.dim}${details}${colors.reset}`;
  }
  
  if (duration !== undefined) {
    message += ` ${colors.yellow}(${formatDuration(duration)})${colors.reset}`;
  }
  
  console.log(message);
}

/**
 * Log test result
 */
export function logTest(
  fileNum: number,
  total: number,
  testName: string,
  passed: boolean,
  details?: string
): void {
  const fileNumStr = `[${fileNum}/${total}]`;
  const icon = passed ? colors.green + icons.success : colors.red + icons.error;
  const status = passed ? colors.green + 'PASS' : colors.red + 'FAIL';
  
  let message = `${colors.dim}${fileNumStr}${colors.reset} ${icon} ${colors.bright}Test: ${testName}${colors.reset} - ${status}${colors.reset}`;
  
  if (details) {
    message += `\n      ${colors.dim}${details}${colors.reset}`;
  }
  
  console.log(message);
}

/**
 * Create a summary table
 */
export function summaryTable(rows: Array<{
  label: string;
  value: string;
  color?: keyof typeof colors;
}>): string {
  const lines: string[] = [];
  
  const maxLabelLength = Math.max(...rows.map(r => r.label.length));
  
  rows.forEach(row => {
    const padding = ' '.repeat(maxLabelLength - row.label.length);
    const valueColor = colors[row.color || 'white'] || colors.white;
    
    lines.push(
      `${colors.dim}${row.label}:${colors.reset}${padding} ` +
      `${valueColor}${colors.bright}${row.value}${colors.reset}`
    );
  });
  
  return lines.join('\n');
}

/**
 * Show parallel batch header
 */
export function parallelBatchHeader(
  batchNum: number,
  totalBatches: number,
  filesInBatch: number,
  startIndex: number,
  endIndex: number
): void {
  console.log('\n' + colors.bright + colors.blue + '╔' + '═'.repeat(78) + '╗' + colors.reset);
  console.log(colors.bright + colors.blue + '║' + colors.reset +
    ` ${colors.bright}🔄 BATCH ${batchNum}/${totalBatches}${colors.reset}: Processing ${colors.cyan}${filesInBatch} files${colors.reset} in parallel` +
    ' '.repeat(78 - ` 🔄 BATCH ${batchNum}/${totalBatches}: Processing ${filesInBatch} files in parallel`.length - 1) +
    colors.bright + colors.blue + '║' + colors.reset
  );
  console.log(colors.bright + colors.blue + '║' + colors.reset +
    ` ${colors.dim}Files ${startIndex + 1}-${endIndex}${colors.reset}` +
    ' '.repeat(78 - ` Files ${startIndex + 1}-${endIndex}`.length - 1) +
    colors.bright + colors.blue + '║' + colors.reset
  );
  console.log(colors.bright + colors.blue + '╚' + '═'.repeat(78) + '╝' + colors.reset);
  console.log('');
}

export default {
  colors,
  box,
  icons,
  progressBar,
  createBox,
  formatBytes,
  formatDuration,
  status,
  tree,
  clearScreen,
  cursorUp,
  banner,
  section,
  metric,
  step,
  logStep,
  logTest,
  summaryTable,
  parallelBatchHeader,
};


