import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const MAX_LINE_WINDOW = 500; // Maximum lines per read call

// Multimodal marker prefix: when tool.service sees this, it uploads the file via File API
export const MULTIMODAL_PREFIX = '__MULTIMODAL__:';

const MULTIMODAL_EXTENSIONS = new Set([
  '.pdf',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg',
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a',
  '.mp4', '.avi', '.mov', '.webm', '.mkv',
]);

function validatePath(filePath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Access denied: path "${filePath}" is outside the project root.`);
  }
  return resolved;
}

export function readFile(args: { path: string; startLine?: number; endLine?: number }): string {
  const resolvedPath = validatePath(args.path);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: "${args.path}"`);
  }

  const stats = fs.statSync(resolvedPath);
  if (stats.isDirectory()) {
    const entries = fs.readdirSync(resolvedPath);
    return `Directory listing for "${args.path}":\n${entries.join('\n')}`;
  }

  // Check if this is a multimodal-supported file type
  const ext = path.extname(resolvedPath).toLowerCase();
  if (MULTIMODAL_EXTENSIONS.has(ext)) {
    // Return special marker — tool.service will intercept this and upload via File API
    return `${MULTIMODAL_PREFIX}${resolvedPath}`;
  }

  // Read text file content
  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const allLines = content.split('\n');
  const totalLines = allLines.length;

  const start = (args.startLine || 1) - 1;
  let end = args.endLine || totalLines;

  // Enforce max window
  if (end - start > MAX_LINE_WINDOW) {
    const cappedEnd = start + MAX_LINE_WINDOW;
    const sliced = allLines.slice(start, cappedEnd);
    return `[Showing lines ${start + 1} to ${cappedEnd} of ${totalLines} total lines (max ${MAX_LINE_WINDOW} lines per call)]\n${sliced.join('\n')}\n\n[To read more, call read_file with startLine=${cappedEnd + 1}]`;
  }

  const sliced = allLines.slice(start, end);
  return `[Showing lines ${start + 1} to ${Math.min(end, totalLines)} of ${totalLines}]\n${sliced.join('\n')}`;
}

export const readToolDeclaration = {
  name: 'read_file',
  description: 'Read the contents of a file or list a directory. Maximum 500 lines are returned per call. If the file has more than 500 lines and no startLine is given, the first 500 lines are returned automatically with instructions to read the next segment using startLine.',
  parameters: {
    type: 'OBJECT' as const,
    properties: {
      path: {
        type: 'STRING' as const,
        description: 'The file or directory path relative to the project root',
      },
      startLine: {
        type: 'NUMBER' as const,
        description: 'The line number to start reading from (1-indexed). Use this to paginate through large files.',
      },
      endLine: {
        type: 'NUMBER' as const,
        description: 'The line number to end reading (inclusive). Max 500 lines from startLine.',
      },
    },
    required: ['path'],
  },
};
