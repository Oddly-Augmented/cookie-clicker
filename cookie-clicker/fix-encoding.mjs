import { readFileSync, writeFileSync } from 'fs';

const file = 'src/main.js';
const buf = readFileSync(file);

// The file was double-encoded: emoji → UTF-8 bytes → interpreted as Latin-1 → re-saved as UTF-8
// Fix: read as UTF-8, convert each char to its Latin-1 byte value, then decode those bytes as UTF-8
let content = buf.toString('utf8');

// Build a mapping of all known corrupted sequences
const replacements = [
  // UPGRADES emojis
  ['ðŸ¤–', '🤖'], ['ðŸ\u0092œ', '💜'], ['ðŸ\u0094', '🔁'], ['ðŸ\u0094µ', '🔵'],
  ['ðŸ\u0093±', '📱'], ['ðŸ§\u00A0', '🧠'], ['â›\u008Fï¸\u008F', '⛏️'], ['ðŸ\u0090¸', '🐸'],
  ['ðŸ\u008F¦', '🏦'], ['ðŸ\u009F£', '🟣'], ['ðŸ\u0096¥ï¸\u008F', '🖥️'], ['ðŸŒŒ', '🌌'],
  ['âš\u009Bï¸\u008F', '⚛️'], ['ðŸ\u009B\u008Fï¸\u008F', '🛏️'], ['ðŸŒ\u0090', '🌐'], ['âœ¨', '✨'],
  // PRESTIGE REPEATABLE emojis  
  ['ðŸ\u0091†', '👆'], ['ðŸ\u0093ˆ', '📈'], ['ðŸ\u008D€', '🍀'], ['ðŸŽ\u0081', '🎁'],
  ['ðŸ\u0098´', '😴'], ['ðŸ\u0092¸', '💸'], ['âš¡', '⚡'], ['ðŸ\u0092°', '💰'],
  ['ðŸš\u0080', '🚀'],
  // PRESTIGE ONETIME emojis
  ['ðŸ§±', '🧱'], ['ðŸŽ¯', '🎯'], ['ðŸ\u0092Ž', '💎'], ['ðŸŒ\u0099', '🌙'],
  ['ðŸ\u0090\u008B', '🐋'], ['ðŸ\u009B\u0092', '🛒'], ['ðŸ\u0093Œ', '📌'], ['ðŸ\u0091\u0091', '👑'],
  ['ðŸ\u008F†', '🏆'],
  // ACHIEVEMENT emojis
  ['ðŸ\u008Dª', '🍪'], ['ðŸ¥\u00A0', '🥠'], ['ðŸŽ\u0089', '🎉'], ['ðŸŒŸ', '🌟'],
  ['ðŸ\u0092«', '💫'], ['ðŸŒ\u0095', '🌕'], ['âœ\u008B', '✋'], ['ðŸ\u0092ª', '💪'],
  ['ðŸ\u0093\u009D', '📝'], ['ðŸ\u008F\u0097ï¸\u008F', '🏗️'], ['ðŸ\u008F¢', '🏢'],
  ['ðŸ\u008F\u0099ï¸\u008F', '🏙️'], ['ðŸŒ†', '🌆'], ['â¬\u0086ï¸\u008F', '⬆️'],
  ['ðŸ\u0094§', '🔧'], ['âš\u0099ï¸\u008F', '⚙️'], ['ðŸ\u0094\u009D', '🔝'],
  ['â™¾ï¸\u008F', '♾️'], ['ðŸŒ\u00A0', '🌠'], ['ðŸ\u0093º', '📺'],
  ['ðŸ\u0094\u0092', '🔒'],
  // UI emojis
  ['â­\u0090', '⭐'], ['â°\u008F', '⏰'], ['â³\u008C', '⏳'], ['âš\u00A0ï¸\u008F', '⚠️'],
  ['âœ\u0085', '✅'], ['âŒ\u009D', '❌'], ['ðŸ\u0093\u008B', '📋'],
  // Leaderboard emojis
  ['ðŸ¥\u0087', '🥇'], ['ðŸ¥\u0088', '🥈'], ['ðŸ¥\u0089', '🥉'],
  ['ðŸ\u008F\u0085', '🏅'],
  // Unicode text characters
  ['Ã\u0097', '×'], ['â\u0080\u0094', '—'], ['â\u0080\u0099', '''],
  ['Â\u00B7', '·'], ['â\u0086\u0092', '→'], ['â\u0088\u0092', '−'],
  ['â\u0080¢', '•'], ['â\u0080\u009C', '"'], ['â\u0080\u009D', '"'],
  // Prestige point emoji
  ['ðŸ\u0092\u00A0', '💠'],
  ['ðŸ\u0093Š', '📊'],
];

let fixCount = 0;
for (const [bad, good] of replacements) {
  while (content.includes(bad)) {
    content = content.split(bad).join(good);
    fixCount++;
  }
}

// Also try a general approach: find remaining multi-byte mojibake sequences
// Pattern: sequences of Ã, Â, ð, Ÿ etc that look like double-encoded UTF-8
const remaining = content.match(/[ðñòóôõö][\x80-\xBF][\x80-\x9F\xA0-\xBF][\x80-\xBF]?/g);
if (remaining && remaining.length > 0) {
  console.log(`Warning: ${remaining.length} potentially corrupted sequences remain:`);
  const unique = [...new Set(remaining)];
  unique.slice(0, 20).forEach(s => {
    const codes = [...s].map(c => 'U+' + c.codePointAt(0).toString(16).padStart(4, '0'));
    console.log(`  "${s}" -> [${codes.join(', ')}]`);
  });
}

writeFileSync(file, content, 'utf8');
console.log(`Fixed ${fixCount} corrupted emoji sequences in ${file}`);
