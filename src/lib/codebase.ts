import { readFile } from 'fs/promises';
import { Glob } from 'glob';
import { join, relative } from 'path';

export interface FileAnalysis {
  path: string;
  content: string;
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
}

export async function analyzeCodebase(pattern = '**/*.{ts,js,tsx,jsx}', maxFiles = 10): Promise<string> {
  try {
    const glob = new Glob(pattern, { ignore: ['node_modules/**', 'dist/**', '**/*.test.*', '**/*.spec.*'] });
    const files = Array.from(glob.walkSync()).slice(0, maxFiles);
    
    const analyses: FileAnalysis[] = [];
    
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const analysis = analyzeFile(file, content);
        analyses.push(analysis);
      } catch (error) {
        console.warn(`Failed to analyze ${file}:`, error);
      }
    }
    
    return generateCodebaseReport(analyses);
  } catch (error) {
    return `Error analyzing codebase: ${error}`;
  }
}

export async function readFileWithContext(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const analysis = analyzeFile(filePath, content);
    
    return `File: ${filePath}
Size: ${content.length} characters
Imports: ${analysis.imports.join(', ') || 'none'}
Exports: ${analysis.exports.join(', ') || 'none'}
Functions: ${analysis.functions.join(', ') || 'none'}
Classes: ${analysis.classes.join(', ') || 'none'}

Content:
${content}`;
  } catch (error) {
    return `Error reading ${filePath}: ${error}`;
  }
}

function analyzeFile(filePath: string, content: string): FileAnalysis {
  const imports = extractImports(content);
  const exports = extractExports(content);
  const functions = extractFunctions(content);
  const classes = extractClasses(content);
  
  return {
    path: filePath,
    content,
    imports,
    exports,
    functions,
    classes
  };
}

function extractImports(content: string): string[] {
  const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function extractExports(content: string): string[] {
  const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g;
  const exports: string[] = [];
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return exports;
}

function extractFunctions(content: string): string[] {
  const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|function))/g;
  const functions: string[] = [];
  let match;
  
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1] || match[2]);
  }
  
  return functions;
}

function extractClasses(content: string): string[] {
  const classRegex = /class\s+(\w+)/g;
  const classes: string[] = [];
  let match;
  
  while ((match = classRegex.exec(content)) !== null) {
    classes.push(match[1]);
  }
  
  return classes;
}

function generateCodebaseReport(analyses: FileAnalysis[]): string {
  if (analyses.length === 0) {
    return 'No files found to analyze';
  }
  
  const report = [
    `Codebase Analysis (${analyses.length} files):`,
    '',
    ...analyses.map(analysis => 
      `${analysis.path}:
  - Imports: ${analysis.imports.join(', ') || 'none'}
  - Exports: ${analysis.exports.join(', ') || 'none'}  
  - Functions: ${analysis.functions.join(', ') || 'none'}
  - Classes: ${analysis.classes.join(', ') || 'none'}`
    ),
    '',
    'Key Dependencies:',
    ...Array.from(new Set(analyses.flatMap(a => a.imports)))
      .filter(imp => !imp.startsWith('.'))
      .map(dep => `  - ${dep}`)
  ];
  
  return report.join('\n');
}