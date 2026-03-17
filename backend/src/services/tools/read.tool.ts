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

export function readFile(args: { path: string }): string {
  const resolvedPath = validatePath(args.path);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: "${args.path}"`);
  }

  if (fs.statSync(resolvedPath).isDirectory()) {
    // List directory contents instead
    const entries = fs.readdirSync(resolvedPath);
    return `Directory listing for "${args.path}":\n${entries.join('\n')}`;
  }

  return fs.readFileSync(resolvedPath, 'utf-8');
}

export const readToolDeclaration = {
  name: 'read_file',
  description: 'Read the contents of a file or list the contents of a directory. Path is relative to the project root.',
  parameters: {
    type: 'OBJECT' as const,
    properties: {
      path: {
        type: 'STRING' as const,
        description: 'The file or directory path relative to the project root (e.g., "package.json" or "src/services")',
      },
    },
    required: ['path'],
  },
};
