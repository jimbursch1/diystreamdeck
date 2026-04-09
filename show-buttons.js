#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const buttons = JSON.parse(fs.readFileSync(path.join(__dirname, 'buttons.json'), 'utf8'));

// Button methods:
//   key     — presses a single key (F1–F24)
//   text    — opens Marlin-CLI (F5), types command, presses Enter
//   console — opens RPH console (F4), types command, presses Enter, closes (F4)

function describe(btn) {
  if (btn.method === 'key')     return btn.key.toUpperCase();
  if (btn.method === 'text')    return `F5 → "${btn.command}" → Enter`;
  if (btn.method === 'console') return `F4 → "${btn.command}" → Enter → F4`;
  return '?';
}

for (const page of buttons) {
  console.log(`\n── ${page.page} ${'─'.repeat(50 - page.page.length)}`);

  const col1 = Math.max(...page.buttons.map(b => b.label.length), 5);
  console.log(`  ${'Label'.padEnd(col1)}  Keystrokes`);
  console.log(`  ${'─'.repeat(col1)}  ${'─'.repeat(40)}`);

  for (const btn of page.buttons) {
    console.log(`  ${btn.label.padEnd(col1)}  ${describe(btn)}`);
  }
}
console.log();
