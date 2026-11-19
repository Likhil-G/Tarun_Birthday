const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(basePath, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(basePath, 'app.js'), 'utf8');
const questions = JSON.parse(fs.readFileSync(path.join(basePath, 'questions.json'), 'utf8'));

console.log('--- 1. QUESTIONS CHECK ---');
console.log('questions.json count:', questions.length);
if (questions.length !== 27) {
  console.error('FAIL: Expected 27 questions in questions.json');
} else {
  console.log('PASS: Exactly 27 questions in questions.json');
}

// Extract questions array in app.js
const regex = /const QUESTIONS = \[([\s\S]*?)\];/;
const match = js.match(regex);
if (!match) {
  console.error('FAIL: Could not extract QUESTIONS array from app.js');
} else {
  const jsQuestions = eval('[' + match[1] + ']');
  console.log('app.js questions count:', jsQuestions.length);
  let allMatch = true;
  for (let i = 0; i < 27; i++) {
    if (jsQuestions[i] !== questions[i]) {
      console.error(`Mismatch at Q${i + 1}:`, { app: jsQuestions[i], json: questions[i] });
      allMatch = false;
    }
  }
  if (allMatch && jsQuestions.length === 27) {
    console.log('PASS: All 27 questions in app.js match questions.json identically!');
  } else {
    console.error('FAIL: Questions mismatch');
  }
}

console.log('\n--- 2. DOM ID VALIDATION ---');
// Match all $("someId")
const idRegex = /\$\(["']([^"']+)["']\)/g;
const ids = new Set();
let m;
while ((m = idRegex.exec(js)) !== null) {
  ids.add(m[1]);
}

console.log('Checking', ids.size, 'element IDs referenced in app.js...');
let missing = [];
for (const id of ids) {
  const needle = `id="${id}"`;
  if (!html.includes(needle)) {
    missing.push(id);
  }
}

if (missing.length === 0) {
  console.log('PASS: Every single element ID queried in app.js exists in index.html!');
} else {
  console.error('FAIL: Missing element IDs:', missing);
}

console.log('\n--- 3. REQUIRED PROMPT CONTENT CHECK ---');
const requiredPhrases = [
  "27 Questions for My Favourite Person",
  "27 little questions, countless memories, and one surprise waiting just for you.",
  "Made with love, especially for you",
  "Take your time, birthday boy. Every answer means something to me.",
  "A LITTLE QUESTION FROM YOUR GIRL ❤️",
  "Tell me what was going through your mind... ❤️",
  "You made it through all 27 questions! ❤️",
  "Thank you for letting me peek into your heart, your memories, your dreams and all the little things that make you who you are.",
  "There are no right or wrong answers here. I simply wanted to know you a little more, relive our memories and make your birthday a little more special.",
  "And now, birthday boy, your actual surprise awaits...",
  "Unlock Your Birthday Surprise ❤️",
  "A little surprise for you...",
  "Happy 28th Birthday, Tarun ❤️",
  "You are my favourite story, my happiest chapter and the person I want to celebrate every year.",
  "The man I love forever."
];

let allPhrasesFound = true;
for (const phrase of requiredPhrases) {
  const inHtml = html.includes(phrase);
  const inJs = js.includes(phrase);
  if (!inHtml && !inJs) {
    console.error('FAIL: Missing required phrase:', phrase);
    allPhrasesFound = false;
  }
}

if (allPhrasesFound) {
  console.log('PASS: All required emotional messages and headings are present in the code!');
}

console.log('\n--- 4. ASSETS CHECK ---');
const assets = [
  path.join(basePath, 'assets', 'tarun-times-poster.png'),
  path.join(basePath, 'assets', 'The Tarun Times.pdf'),
  path.join(basePath, 'assets', 'The-Tarun-Times-original.pdf')
];

for (const a of assets) {
  if (fs.existsSync(a)) {
    console.log('PASS: Asset exists:', path.basename(a), `(${fs.statSync(a).size} bytes)`);
  } else {
    console.error('FAIL: Asset missing:', a);
  }
}

console.log('\n--- ALL AUTOMATED CHECKS FINISHED ---');
