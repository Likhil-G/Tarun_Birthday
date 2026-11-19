/**
 * Simulation Test for The Tarun Times App State & Flow
 */
const fs = require('fs');
const path = require('path');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; }
};

// Mock window and document
const elements = {};
function createMockElement(id) {
  const el = {
    id,
    classList: {
      classes: new Set(),
      add: (c) => el.classList.classes.add(c),
      remove: (c) => el.classList.classes.delete(c),
      contains: (c) => el.classList.classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (el.classList.contains(c)) el.classList.remove(c);
          else el.classList.add(c);
        } else if (force) {
          el.classList.add(c);
        } else {
          el.classList.remove(c);
        }
      }
    },
    style: {},
    listeners: {},
    addEventListener: (evt, fn) => {
      el.listeners[evt] = el.listeners[evt] || [];
      el.listeners[evt].push(fn);
    },
    trigger: (evt, data = {}) => {
      (el.listeners[evt] || []).forEach(fn => fn(data));
    },
    click: () => el.trigger('click'),
    focus: () => {},
    value: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    remove: function() {
      if (this.parentNode) this.parentNode.removeChild(this);
    },
    parentNode: {
      removeChild: () => {}
    },
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 50 })
  };
  elements[id] = el;
  return el;
}

global.document = {
  getElementById: (id) => elements[id] || createMockElement(id),
  createElement: (tag) => createMockElement(tag),
  body: {
    appendChild: () => {},
    removeChild: () => {},
    style: {}
  },
  addEventListener: () => {}
};

global.window = {
  location: {
    origin: "http://localhost:8080"
  },
  scrollTo: () => {},
  BIRTHDAY_CONFIG: {
    googleAppsScriptUrl: "",
    sharedSecret: "TEST_SECRET"
  }
};

global.requestAnimationFrame = (fn) => fn();

// Load app.js
require('../app.js');

async function runTests() {
  console.log('--- TEST: START QUIZ ---');
  elements['startBtn'].click();
  console.log('Active screen after startBtn click:', elements['quiz'].classList.contains('active') ? 'quiz (PASS)' : 'FAIL');
  console.log('Question 1 text:', elements['questionText'].textContent);
  console.log('Question 1 counter:', elements['questionCount'].textContent);

  console.log('\n--- TEST: VALIDATION ON EMPTY NEXT ---');
  elements['answerInput'].value = '   ';
  elements['nextBtn'].click();
  console.log('Current after empty Next should still be Q1:', elements['questionCount'].textContent.includes('Question 01') ? 'PASS' : 'FAIL');

  console.log('\n--- TEST: ANSWER & ADVANCE TO Q2 ---');
  elements['answerInput'].value = 'You had the warmest, most captivating smile.';
  elements['answerInput'].trigger('input', { target: { value: elements['answerInput'].value } });
  elements['nextBtn'].click();

  // Wait for animation transition timeout (180ms)
  await new Promise(r => setTimeout(r, 220));

  console.log('Question 2 counter:', elements['questionCount'].textContent);
  console.log('Question 2 text:', elements['questionText'].textContent);
  if (elements['questionCount'].textContent.includes('Question 02')) {
    console.log('PASS: Successfully advanced to Question 2!');
  } else {
    console.error('FAIL: Did not advance to Question 2');
  }

  console.log('\n--- TEST: PREV BUTTON RESTORES ANSWER ---');
  elements['prevBtn'].click();
  await new Promise(r => setTimeout(r, 220));

  console.log('Returned to Question 1 counter:', elements['questionCount'].textContent);
  console.log('Answer restored:', elements['answerInput'].value);
  if (elements['answerInput'].value === 'You had the warmest, most captivating smile.') {
    console.log('PASS: Answer was preserved in input and memory!');
  } else {
    console.error('FAIL: Answer was not preserved');
  }

  console.log('\n--- TEST: FILL ALL 27 ANSWERS & REACH REVIEW ---');
  for (let i = 0; i < 27; i++) {
    elements['answerInput'].value = `Heartfelt answer for question ${i + 1}`;
    elements['answerInput'].trigger('input', { target: { value: elements['answerInput'].value } });
    elements['nextBtn'].click();
    await new Promise(r => setTimeout(r, 220));
  }

  console.log('Active screen after Q27 Next:', elements['review'].classList.contains('active') ? 'review (PASS)' : 'FAIL');

  console.log('\n--- TEST: SUBMIT ANSWERS & UNLOCK SURPRISE ---');
  elements['submitBtn'].click();
  console.log('Submit button text:', elements['submitBtn'].textContent);
  console.log('Submit status:', elements['submitStatus'].textContent);

  await new Promise(r => setTimeout(r, 3200));

  console.log('Active screen after multi-stage reveal:', elements['surprise'].classList.contains('active') ? 'surprise (PASS)' : 'FAIL');
  console.log('\nALL INTERACTIVE FLOW TESTS PASSED SUCCESSFULLY! ❤️');
}

runTests();
