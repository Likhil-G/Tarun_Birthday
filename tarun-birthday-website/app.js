/**
 * THE TARUN TIMES — A ROMANTIC BIRTHDAY EXPERIENCE
 * "A Love Letter Disguised as a Birthday Newspaper"
 * 
 * Interactive logic for:
 * - 27 Questions birthday interview
 * - Local storage answer autosaving
 * - Smooth animated navigation & micro-interactions
 * - Google Sheets keepsake submission
 * - Multi-stage surprise reveal animation
 * - Poster downloads and fullscreen lightbox
 * - Ambient floating hearts and celebration confetti
 */

// ==========================================================================
// 1. ALL 27 QUESTIONS (PRESERVED EXACTLY AS ORIGINALLY WRITTEN)
// ==========================================================================
const QUESTIONS = [
  "What was your very first impression of me?",
  "When did you realise that I was becoming someone special in your life?",
  "What is your favourite memory of us so far?",
  "Since I came into your life, which birthday has been the most special to you, and what made it memorable?",
  "What is one little thing I do that always makes you smile?",
  "If you could relive one moment with me, which moment would it be?",
  "What song reminds you of us, and why?",
  "What is something about our relationship that you are genuinely grateful for?",
  "What do you think we do really well as a couple?",
  "What is one thing you wish I understood better about you?",
  "When you are having a difficult day, what do you really need from me?",
  "What is one thing about me that you don't like or wish I would change?",
  "Is there anything you think we should work on together as a couple?",
  "When do you feel the most loved by me?",
  "Who fell in love first, and who fell harder?",
  "What is one habit of mine that secretly annoys you?",
  "If our love story were a movie, what would you name it?",
  "What is the most ridiculous thing we have ever argued about?",
  "What is something about me that still gives you butterflies?",
  "If we could disappear for two days together, where would you want us to go?",
  "What is something you are proud of yourself for but rarely talk about?",
  "What is one dream you really want to fulfil in the next few years?",
  "What is something you wish people understood about you without you having to explain it?",
  "What do you think love should feel like on ordinary, everyday days?",
  "What is one thing you hope we never lose in our relationship?",
  "What is one wish you have for yourself as you turn 28?",
  "If you could tell me one thing from your heart right now, without overthinking it, what would it be?"
];

// Romantic custom placeholders tailored to each question
const PLACEHOLDERS = [
  "Tell me what was going through your mind... ❤️",
  "Take me back to that moment... ❤️",
  "Describe that day or night with us... ❤️",
  "Tell me which birthday felt extra special and why... ❤️",
  "Tell me about that little moment... ❤️",
  "If time stopped and we could go back to that one memory... ❤️",
  "Which melody plays in your heart when you think of us? ❤️",
  "Write whatever comes straight from your heart... ❤️",
  "What makes our team so wonderful? ❤️",
  "I'm listening closely, tell me everything... ❤️",
  "Tell me how I can best be there for you... ❤️",
  "Be completely honest with me, birthday boy... ❤️",
  "How can we grow and love each other even better? ❤️",
  "What makes you feel deeply cherished by me? ❤️",
  "Give me your honest verdict... ❤️",
  "Spill the secret, I promise not to tease! ❤️",
  "What would our romantic cinema title be? ❤️",
  "Remind me of that silly argument... ❤️",
  "What still gives you that sweet feeling? ❤️",
  "Where would our little secret getaway be? ❤️",
  "I want to celebrate you today, tell me... ❤️",
  "Tell me your biggest dream for our future... ❤️",
  "Speak freely from your soul... ❤️",
  "Describe what our everyday comfort feels like... ❤️",
  "What is the purest spark we must always keep? ❤️",
  "Make a wish as you step into your 28th golden year... ❤️",
  "Just between you and me, tell me right now... ❤️"
];

// ==========================================================================
// 2. STATE & CONFIGURATION
// ==========================================================================
const STORAGE_KEY = "tarun-birthday-answers-v1";
const $ = id => document.getElementById(id);

let answers = {};
try {
  answers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
} catch (e) {
  answers = {};
}

let current = 0;
const screens = ["welcome", "quiz", "review", "surprise"];

// ==========================================================================
// 3. SCREEN MANAGEMENT
// ==========================================================================
function showScreen(id) {
  screens.forEach(s => {
    const el = $(s);
    if (!el) return;
    if (s === id) {
      el.classList.add("active");
      el.style.display = "block";
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 30);
    } else {
      el.classList.remove("active");
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      setTimeout(() => {
        if (!el.classList.contains("active")) {
          el.style.display = "none";
        }
      }, 350);
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveAnswers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (err) {
    console.warn("Could not save to localStorage", err);
  }
}

// ==========================================================================
// 4. QUESTION RENDERING & TRANSITIONS
// ==========================================================================
function renderQuestion(animate = true) {
  const card = $("questionCard");
  const questionNumStr = String(current + 1).padStart(2, "0");
  const percentComplete = Math.round(((current + 1) / QUESTIONS.length) * 100);

  const updateContent = () => {
    $("questionText").textContent = QUESTIONS[current];
    $("bigNumber").textContent = questionNumStr;
    $("questionCount").textContent = `Question ${questionNumStr} of 27`;
    
    // Progress Bar
    const progressFill = $("progressFill");
    if (progressFill) {
      progressFill.style.width = `${percentComplete}%`;
    }
    $("progressPercent").textContent = `${percentComplete}% Complete`;

    // Input & Placeholder
    const input = $("answerInput");
    input.value = answers[current] || "";
    input.placeholder = PLACEHOLDERS[current] || "Tell me what was going through your mind... ❤️";

    // Nav Buttons
    const prevBtn = $("prevBtn");
    prevBtn.disabled = current === 0;
    
    const nextBtn = $("nextBtn");
    if (current === QUESTIONS.length - 1) {
      nextBtn.innerHTML = 'Review answers & unlock surprise <span class="nav-arrow">❤️ →</span>';
    } else {
      nextBtn.innerHTML = 'Next question <span class="nav-arrow">→</span>';
    }

    // Word count / Hint
    updateWordCountHint();
  };

  if (animate && card) {
    card.classList.add("animating-out");
    setTimeout(() => {
      updateContent();
      card.classList.remove("animating-out");
      card.classList.add("animating-in");
      setTimeout(() => {
        card.classList.remove("animating-in");
      }, 250);
    }, 180);
  } else {
    updateContent();
  }
}

function updateWordCountHint() {
  const text = ($("answerInput").value || "").trim();
  const hint = $("charCountHint");
  if (!hint) return;

  if (text.length === 0) {
    hint.textContent = "No rush, take your time ♡";
  } else {
    const words = text.split(/\s+/).filter(Boolean).length;
    hint.textContent = `${words} ${words === 1 ? 'word' : 'words'} written with love ♡`;
  }
}

// ==========================================================================
// 5. EVENT LISTENERS
// ==========================================================================

// Welcome -> Start Quiz
$("startBtn").addEventListener("click", () => {
  // If user previously started, resume from their first unanswered or current question
  const firstUnanswered = QUESTIONS.findIndex((q, i) => !(answers[i] || "").trim());
  if (firstUnanswered !== -1 && Object.keys(answers).length > 0) {
    current = firstUnanswered;
  } else if (current >= QUESTIONS.length) {
    current = 0;
  }
  showScreen("quiz");
  renderQuestion(false);
});

// Real-time autosave as user types
$("answerInput").addEventListener("input", e => {
  answers[current] = e.target.value;
  saveAnswers();
  updateWordCountHint();

  const statusText = $("saveStatusText");
  if (statusText) {
    statusText.textContent = "Saving your words…";
    clearTimeout(window._saveTimer);
    window._saveTimer = setTimeout(() => {
      statusText.textContent = "Saved automatically on this device ♡";
    }, 600);
  }
});

// Keyboard shortcut: Ctrl+Enter / Cmd+Enter to advance
$("answerInput").addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    $("nextBtn").click();
  }
});

// Navigation: Previous Button
$("prevBtn").addEventListener("click", () => {
  if (current > 0) {
    // Save current before leaving
    answers[current] = $("answerInput").value;
    saveAnswers();
    current--;
    renderQuestion(true);
  }
});

// Navigation: Next Button
$("nextBtn").addEventListener("click", () => {
  const currentVal = ($("answerInput").value || "").trim();
  answers[current] = $("answerInput").value;
  saveAnswers();

  if (!currentVal) {
    const input = $("answerInput");
    input.focus();
    input.placeholder = "Please share a little thought before moving on... ❤️";
    input.style.borderColor = "var(--primary-wine)";
    setTimeout(() => {
      input.style.borderColor = "";
    }, 1200);
    return;
  }

  // Create subtle heart particle on Next
  spawnClickHeart($("nextBtn"));

  if (current < QUESTIONS.length - 1) {
    current++;
    renderQuestion(true);
  } else {
    // Finished all 27 questions -> Go to Review Screen
    showScreen("review");
  }
});

// Review Screen: Back to Last Question to edit
$("backToLast").addEventListener("click", () => {
  current = QUESTIONS.length - 1;
  showScreen("quiz");
  renderQuestion(false);
});

// Review Screen: Submit to Google Sheets and Unlock Surprise
$("submitBtn").addEventListener("click", async () => {
  // Validate that all 27 questions have answers
  const missingIndex = QUESTIONS.findIndex((q, i) => !(answers[i] || "").trim());
  if (missingIndex !== -1) {
    current = missingIndex;
    showScreen("quiz");
    renderQuestion(false);
    const input = $("answerInput");
    input.focus();
    input.placeholder = "Please add your answer here before unlocking your surprise... ❤️";
    input.style.borderColor = "var(--primary-wine)";
    return;
  }

  const btn = $("submitBtn");
  const status = $("submitStatus");
  btn.disabled = true;
  btn.classList.remove("pulse-button");
  btn.innerHTML = '<span class="btn-text">Sending your answers with love… ♡</span>';
  status.className = "submit-status-banner";
  status.textContent = "Connecting to our private keepsake sheet…";

  const cfg = (window.envPromise ? await window.envPromise : window.BIRTHDAY_CONFIG) || {};

  // Check if Google Apps Script URL is configured
  if (!cfg.googleAppsScriptUrl || cfg.googleAppsScriptUrl.trim() === "") {
    // If not configured, explain in status and trigger preview reveal
    status.className = "submit-status-banner";
    status.textContent = "Note: Google Sheets URL is not connected yet in config.js. Unlocking your surprise in preview mode…";
    setTimeout(() => {
      triggerMultiStageReveal();
    }, 900);
    return;
  }

  // Build payload for Google Apps Script receiver
  const payload = {
    token: cfg.sharedSecret || "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET",
    respondent: "Tarun Chandra",
    submittedAt: new Date().toISOString(),
    questions: QUESTIONS,
    answers: QUESTIONS.map((q, i) => (answers[i] || "").trim())
  };

  try {
    // Google Apps Script requires no-cors mode for cross-origin web app execution
    await fetch(cfg.googleAppsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    status.className = "submit-status-banner success";
    status.textContent = "Answers saved forever to the keepsake sheet! Preparing your surprise… ❤️";
    
    // Trigger multi-stage reveal animation
    setTimeout(() => {
      triggerMultiStageReveal();
    }, 800);

  } catch (err) {
    console.error("Submission error:", err);
    status.className = "submit-status-banner error";
    status.textContent = "We couldn't reach the keepsake sheet. Your answers remain safely saved on this device. Please check your connection and try again.";
    btn.disabled = false;
    btn.classList.add("pulse-button");
    btn.innerHTML = '<span class="btn-text">Try Again &amp; Unlock Surprise ❤️</span>';
  }
});

// ==========================================================================
// 6. MULTI-STAGE SURPRISE REVEAL ANIMATION
// ==========================================================================
function triggerMultiStageReveal() {
  const overlay = $("transitionOverlay");
  
  // Step 1: Smoothly display the intermediate transition screen
  if (overlay) {
    overlay.style.display = "flex";
    setTimeout(() => {
      overlay.classList.add("visible");
    }, 20);
  }

  // Step 2: After 1.8 seconds of buildup, reveal the final surprise screen
  setTimeout(() => {
    showScreen("surprise");
    const surpriseSection = $("surprise");
    if (surpriseSection) {
      surpriseSection.classList.add("surprise-reveal");
    }

    if (overlay) {
      overlay.classList.remove("visible");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 500);
    }

    // Step 3: Trigger celebratory confetti shower & floating hearts
    launchCelebrationConfetti();
  }, 1800);
}

// ==========================================================================
// 7. POSTER DOWNLOADS & LIGHTBOX
// ==========================================================================
// Save Poster Image PNG
$("downloadPoster").addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = "assets/tarun-times-poster.png";
  link.download = "The-Tarun-Times-Tarun-Chandra.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Fullscreen Lightbox logic
function openLightbox() {
  const modal = $("posterLightbox");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => {
      modal.classList.add("active");
    }, 20);
    document.body.style.overflow = "hidden";
  }
}

function closeLightbox() {
  const modal = $("posterLightbox");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 350);
    document.body.style.overflow = "";
  }
}

const posterWrapper = $("posterCardWrapper");
if (posterWrapper) {
  posterWrapper.addEventListener("click", openLightbox);
}

const openLightboxBtn = $("openLightboxBtn");
if (openLightboxBtn) {
  openLightboxBtn.addEventListener("click", openLightbox);
}

const closeLightboxBtn = $("closeLightbox");
if (closeLightboxBtn) {
  closeLightboxBtn.addEventListener("click", closeLightbox);
}

const lightboxBackdrop = $("lightboxBackdrop");
if (lightboxBackdrop) {
  lightboxBackdrop.addEventListener("click", closeLightbox);
}

// ESC key closes lightbox
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeLightbox();
  }
});

// ==========================================================================
// 8. ROMANTIC MICRO-INTERACTIONS: HEARTS & CONFETTI
// ==========================================================================

// Ambient background floating hearts
function initAmbientHearts() {
  const container = $("heartsContainer");
  if (!container) return;

  const heartSymbols = ["♥", "♡", "❤", "❦"];
  const count = 16;

  for (let i = 0; i < count; i++) {
    createAmbientHeart(container, heartSymbols);
  }
}

function createAmbientHeart(container, symbols) {
  const heart = document.createElement("div");
  heart.className = "ambient-heart";
  heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  
  const size = Math.random() * 14 + 10; // 10px to 24px
  const startLeft = Math.random() * 96; // 0% to 96%
  const duration = Math.random() * 12 + 10; // 10s to 22s
  const delay = Math.random() * 15; // 0s to 15s

  heart.style.fontSize = `${size}px`;
  heart.style.left = `${startLeft}%`;
  heart.style.animationDuration = `${duration}s`;
  heart.style.animationDelay = `${delay}s`;
  
  container.appendChild(heart);
}

// Subtle heart particle on button click
function spawnClickHeart(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const heart = document.createElement("div");
  heart.textContent = "♥";
  heart.style.position = "fixed";
  heart.style.left = `${rect.left + rect.width / 2}px`;
  heart.style.top = `${rect.top}px`;
  heart.style.color = "var(--primary-wine)";
  heart.style.fontSize = "20px";
  heart.style.pointerEvents = "none";
  heart.style.zIndex = "999";
  heart.style.transition = "transform 0.8s ease-out, opacity 0.8s ease-out";
  document.body.appendChild(heart);

  requestAnimationFrame(() => {
    heart.style.transform = `translate(${Math.random() * 40 - 20}px, -45px) scale(1.4)`;
    heart.style.opacity = "0";
  });

  setTimeout(() => {
    if (heart.remove) {
      heart.remove();
    } else if (heart.parentNode) {
      heart.parentNode.removeChild(heart);
    }
  }, 850);
}

// Celebratory shower on surprise unlock
function launchCelebrationConfetti() {
  const colors = ["#873B4B", "#C98591", "#C5A16C", "#E2CA9D", "#F6E5E5"];
  const symbols = ["♥", "♡", "✦", "★", "•"];
  const total = 45;

  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.className = "confetti-heart-particle";
      particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      
      const left = Math.random() * 100;
      const size = Math.random() * 16 + 12;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const duration = Math.random() * 2 + 2.5;

      particle.style.left = `${left}vw`;
      particle.style.top = `-20px`;
      particle.style.fontSize = `${size}px`;
      particle.style.color = color;
      particle.style.animationDuration = `${duration}s`;

      document.body.appendChild(particle);

      setTimeout(() => {
        if (particle.remove) {
          particle.remove();
        } else if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, duration * 1000 + 200);
    }, i * 45);
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initAmbientHearts();
});
