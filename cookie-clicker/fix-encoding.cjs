// Fix double-encoded UTF-8 (mojibake) in main.js
// The file was saved with UTF-8 bytes re-interpreted as Windows-1252 then re-saved as UTF-8
const fs = require('fs');
const file = 'src/main.js';

const buf = fs.readFileSync(file);
let text = buf.toString('utf8');

// Step 1: Convert back from UTF-8 string to the raw byte values
// by interpreting each char as Windows-1252 (Latin-1 superset)
function fixDoubleEncoding(str) {
  // Convert string chars back to their Windows-1252 byte values
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 256) {
      bytes.push(code);
    } else {
      // Map known Windows-1252 multi-byte chars back to single bytes
      // These are chars that Windows-1252 maps differently from Latin-1
      const win1252map = {
        0x2013: 0x96, // –
        0x2014: 0x97, // —
        0x2018: 0x91, // '
        0x2019: 0x92, // '
        0x201C: 0x93, // "
        0x201D: 0x94, // "
        0x2022: 0x95, // •
        0x2026: 0x85, // …
        0x0152: 0x8C, // Œ
        0x0153: 0x9C, // œ
        0x0160: 0x8A, // Š
        0x0161: 0x9A, // š
        0x0178: 0x9F, // Ÿ
        0x017D: 0x8E, // Ž
        0x017E: 0x9E, // ž
        0x0192: 0x83, // ƒ
        0x02C6: 0x88, // ˆ
        0x02DC: 0x98, // ˜
        0x2020: 0x86, // †
        0x2021: 0x87, // ‡
        0x2030: 0x89, // ‰
        0x2039: 0x8B, // ‹
        0x203A: 0x9B, // ›
        0x20AC: 0x80, // €
        0x2122: 0x99, // ™
      };
      if (win1252map[code] !== undefined) {
        bytes.push(win1252map[code]);
      } else {
        // Can't reverse-map this char; leave it as multi-byte UTF-8
        const encoded = Buffer.from(String.fromCodePoint(code), 'utf8');
        for (const b of encoded) bytes.push(b);
      }
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

const fixed = fixDoubleEncoding(text);

// Count how many chars changed
let changes = 0;
for (let i = 0; i < Math.max(text.length, fixed.length); i++) {
  if (text[i] !== fixed[i]) changes++;
}

fs.writeFileSync(file, fixed, 'utf8');
console.log(`Fixed encoding. Original: ${text.length} chars, Fixed: ${fixed.length} chars, ${changes} chars changed`);

// Verify by checking a known emoji
const check = fs.readFileSync(file, 'utf8');
const robotIdx = check.indexOf('Click Bot');
if (robotIdx > -1) {
  const snippet = check.substring(robotIdx - 10, robotIdx + 30);
  console.log('Sample around "Click Bot":', JSON.stringify(snippet));
}
