import * as fs from 'fs';

const filePath = 'src/pages/ChatPage.tsx';
const sourceText = fs.readFileSync(filePath, 'utf-8');
const lines = sourceText.split('\n');

interface Delimiter {
  char: string;
  line: number;
  col: number;
  context: string;
  type: 'open' | 'close';
}

const delimiters: Delimiter[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    const next = line[j + 1];
    const prev = line[j - 1];
    
    // Skip inside strings/template literals (basic heuristic)
    // Just track all for now
    if (ch === '{') delimiters.push({ char: '{', line: i + 1, col: j + 1, context: line.trim().slice(0, 80), type: 'open' });
    if (ch === '}') delimiters.push({ char: '}', line: i + 1, col: j + 1, context: line.trim().slice(0, 80), type: 'close' });
    if (ch === '(' && prev !== '.') delimiters.push({ char: '(', line: i + 1, col: j + 1, context: line.trim().slice(0, 80), type: 'open' });
    if (ch === ')' && next !== '.') delimiters.push({ char: ')', line: i + 1, col: j + 1, context: line.trim().slice(0, 80), type: 'close' });
    if (ch === '[') delimiters.push({ char: '[', line: i + 1, col: j + 1, context: line.trim().slice(0, 80), type: 'open' });
    if (ch === ']') delimiters.push({ char: ']', line: i + 1, col: j + 1, context: line.trim().slice(0, 80), type: 'close' });
  }
}

function checkBalance(name: string, open: string, close: string) {
  const opens = delimiters.filter(d => d.char === open && d.type === 'open');
  const closes = delimiters.filter(d => d.char === close && d.type === 'close');
  
  console.log(`\n=== ${name} ===`);
  console.log(`Open ${open}: ${opens.length}`);
  console.log(`Close ${close}: ${closes.length}`);
  console.log(`Balance: ${opens.length - closes.length}`);
  
  // Stack-based matching
  const stack: Delimiter[] = [];
  const all = [...opens, ...closes].sort((a, b) => a.line !== b.line ? a.line - b.line : a.col - b.col);
  
  for (const d of all) {
    if (d.type === 'open') {
      stack.push(d);
    } else {
      if (stack.length > 0) {
        stack.pop();
      } else {
        console.log(`  UNMATCHED CLOSE at L${d.line}:${d.col} - ${d.context}`);
      }
    }
  }
  
  if (stack.length > 0) {
    console.log(`  ${stack.length} UNMATCHED OPENS:`);
    stack.slice(-10).forEach(d => console.log(`    L${d.line}:${d.col} - ${d.context}`));
  }
}

checkBalance('BRACES', '{', '}');
checkBalance('PARENS', '(', ')');
checkBalance('BRACKETS', '[', ']');

// Also show last 20 delimiters
console.log('\n=== LAST 30 DELIMITERS ===');
const allDelims = [...delimiters].sort((a, b) => a.line !== b.line ? a.line - b.line : a.col - b.col);
allDelims.slice(-30).forEach(d => {
  const marker = d.type === 'open' ? '▶' : '◀';
  console.log(`  ${marker} L${d.line}:${d.col} ${d.char} - ${d.context.slice(0, 60)}`);
});