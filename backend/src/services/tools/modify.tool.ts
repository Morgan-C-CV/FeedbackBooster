import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export interface DiffChunk {
  /** The line number where the change starts (1-indexed) */
  startLine: number;
  /** The original content to find and replace */
  oldContent: string;
  /** The new content to replace with */
  newContent: string;
}

function validatePath(filePath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Access denied: path "${filePath}" is outside the project root.`);
  }
  return resolved;
}

export function modifyFile(args: { path: string; diffs: DiffChunk[] }): string {
  const resolvedPath = validatePath(args.path);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: "${args.path}". Use the write_file tool to create new files.`);
  }

  if (fs.statSync(resolvedPath).isDirectory()) {
    throw new Error(`"${args.path}" is a directory, not a file.`);
  }

  let content = fs.readFileSync(resolvedPath, 'utf-8');
  const appliedDiffs: string[] = [];

  // Sort diffs by startLine descending so earlier replacements don't shift line numbers
  const sortedDiffs = [...args.diffs].sort((a, b) => b.startLine - a.startLine);

  for (const diff of sortedDiffs) {
    if (!content.includes(diff.oldContent)) {
      appliedDiffs.push(`⚠ Line ~${diff.startLine}: old content not found, skipped.`);
      continue;
    }
    content = content.replace(diff.oldContent, diff.newContent);
    appliedDiffs.push(`✔ Line ~${diff.startLine}: replaced "${diff.oldContent.substring(0, 50)}..." → "${diff.newContent.substring(0, 50)}..."`);
  }

  fs.writeFileSync(resolvedPath, content, 'utf-8');

  return `File modified: "${args.path}"\n${appliedDiffs.reverse().join('\n')}`;
}

export const modifyToolDeclaration = {
  name: 'modify_file',
  description: 'Modify an existing file by applying one or more diff chunks. Each diff specifies the approximate start line, the old content to find, and the new content to replace it with. Path is relative to the project root.',
  parameters: {
    type: 'OBJECT' as const,
    properties: {
      path: {
        type: 'STRING' as const,
        description: 'The file path relative to the project root (e.g., "src/config/app.config.ts")',
      },
      diffs: {
        type: 'ARRAY' as const,
        description: 'An array of diff chunks to apply to the file',
        items: {
          type: 'OBJECT' as const,
          properties: {
            startLine: {
              type: 'NUMBER' as const,
              description: 'The approximate line number (1-indexed) where this change should be applied',
            },
            oldContent: {
              type: 'STRING' as const,
              description: 'The exact original content to find in the file',
            },
            newContent: {
              type: 'STRING' as const,
              description: 'The new content to replace the old content with',
            },
          },
          required: ['startLine', 'oldContent', 'newContent'],
        },
      },
    },
    required: ['path', 'diffs'],
  },
};
