import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

const results = [];
const commentRegex = /^\s*(\/\/|\/\*|\*)/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (commentRegex.test(line)) {
    continue;
  }
  // Check if line contains Korean characters (Range: AC00-D7A3)
  if (/[\uac00-\ud7a3]/.test(line)) {
    results.push({ lineNum: i + 1, text: line.trim() });
  }
}

console.log(JSON.stringify(results, null, 2));
