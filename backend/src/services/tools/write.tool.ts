import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

function validatePath(filePath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`Access denied: path "${filePath}" is outside the project root.`);
  }
  return resolved;
}

export function writeFile(args: { path: string; content: string }): string {
  const resolvedPath = validatePath(args.path);

  if (fs.existsSync(resolvedPath)) {
    throw new Error(`File already exists: "${args.path}". Use the modify_file tool to edit existing files.`);
  }

  // Create parent directories if they don't exist
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, args.content, 'utf-8');
  return `File created successfully: "${args.path}" (${args.content.length} bytes)`;
}

export const writeToolDeclaration = {
  name: 'write_file',
  description: 'Create a new file with the given content. Cannot overwrite existing files. Path is relative to the project root.',
  parameters: {
    type: 'OBJECT' as const,
    properties: {
      path: {
        type: 'STRING' as const,
        description: 'The file path relative to the project root (e.g., "src/output/result.txt")',
      },
      content: {
        type: 'STRING' as const,
        description: 'The content to write to the new file',
      },
    },
    required: ['path', 'content'],
  },
};
