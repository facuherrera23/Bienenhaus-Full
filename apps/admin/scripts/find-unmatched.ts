import * as ts from 'typescript';
import * as fs from 'fs';

const filePath = 'src/pages/ChatPage.tsx';
const sourceText = fs.readFileSync(filePath, 'utf-8');

const sourceFile = ts.createSourceFile(
  filePath,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

interface NodeInfo {
  kind: string;
  start: number;
  end: number;
  line: number;
  character: number;
  text: string;
}

const openers = new Map<string, NodeInfo[]>();
const closers = new Map<string, NodeInfo[]>();

function visit(node: ts.Node) {
  const start = node.getStart(sourceFile);
  const end = node.getEnd();
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
  const text = sourceText.slice(start, end);

  // Track braces, brackets, parens
  if (node.kind === ts.SyntaxKind.OpenBraceToken) {
    openers.set('{', [...(openers.get('{') || []), { kind: '{', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.CloseBraceToken) {
    closers.set('}', [...(closers.get('}') || []), { kind: '}', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.OpenParenToken) {
    openers.set('(', [...(openers.get('(') || []), { kind: '(', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.CloseParenToken) {
    closers.set(')', [...(closers.get(')') || []), { kind: ')', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.OpenBracketToken) {
    openers.set('[', [...(openers.get('[') || []), { kind: '[', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.CloseBracketToken) {
    closers.set(']', [...(closers.get(']') || []), { kind: ']', start, end, line, character, text }]);
  }
  // JSX
  if (node.kind === ts.SyntaxKind.JsxOpeningElement) {
    openers.set('<', [...(openers.get('<') || []), { kind: '<', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.JsxClosingElement) {
    closers.set('>', [...(closers.get('>') || []), { kind: '>', start, end, line, character, text }]);
  }
  if (node.kind === ts.SyntaxKind.JsxSelfClosingElement) {
    // self-closing, balanced
  }

  ts.forEachChild(node, visit);
}

visit(sourceFile);

console.log('=== BRACES ===');
console.log('Open {:', openers.get('{')?.length || 0);
console.log('Close }:', closers.get('}')?.length || 0);

console.log('\n=== PARENS ===');
console.log('Open (:', openers.get('(')?.length || 0);
console.log('Close ):', closers.get(')')?.length || 0);

console.log('\n=== BRACKETS ===');
console.log('Open [:', openers.get('[')?.length || 0);
console.log('Close ]:', closers.get(']')?.length || 0);

console.log('\n=== JSX ===');
console.log('Open <:', openers.get('<')?.length || 0);
console.log('Close >:', closers.get('>')?.length || 0);

// Show last few of each
for (const [key, arr] of openers) {
  if (arr.length > 0) {
    console.log(`\nLast 5 open ${key}:`);
    arr.slice(-5).forEach(n => console.log(`  L${n.line+1}:${n.character+1} ${n.text.slice(0,50)}`));
  }
}
for (const [key, arr] of closers) {
  if (arr.length > 0) {
    console.log(`\nLast 5 close ${key}:`);
    arr.slice(-5).forEach(n => console.log(`  L${n.line+1}:${n.character+1} ${n.text.slice(0,50)}`));
  }
}

// Check for unmatched by position
function findUnmatched(open: NodeInfo[], close: NodeInfo[]) {
  const stack: NodeInfo[] = [];
  const all = [...open, ...close].sort((a, b) => a.start - b.start);
  for (const n of all) {
    if (open.includes(n)) stack.push(n);
    else if (stack.length > 0) stack.pop();
    else console.log(`  UNMATCHED CLOSE at L${n.line+1}:${n.character+1}`);
  }
  stack.forEach(n => console.log(`  UNMATCHED OPEN at L${n.line+1}:${n.character+1} - ${n.text.slice(0,60)}`));
}

console.log('\n=== UNMATCHED BRACES ===');
findUnmatched(openers.get('{') || [], closers.get('}') || []);

console.log('\n=== UNMATCHED PARENS ===');
findUnmatched(openers.get('(') || [], closers.get(')') || []);

console.log('\n=== UNMATCHED BRACKETS ===');
findUnmatched(openers.get('[') || [], closers.get(']') || []);