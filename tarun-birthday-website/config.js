/**
 * The Tarun Times — Configuration & Environment Loader
 * 
 * Supports:
 * 1. .env file (parsed automatically via fetch)
 * 2. window.__ENV__ (from env.js or CI/CD injected script)
 * 3. Direct overrides via window.BIRTHDAY_CONFIG
 */

window.BIRTHDAY_CONFIG = window.BIRTHDAY_CONFIG || {
  googleAppsScriptUrl: "",
  sharedSecret: "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET",
  isLoaded: false
};

window.loadEnvConfig = async function() {
  // 1. Check if window.__ENV__ was loaded from env.js
  if (window.__ENV__) {
    if (window.__ENV__.GOOGLE_APPS_SCRIPT_URL) {
      window.BIRTHDAY_CONFIG.googleAppsScriptUrl = window.__ENV__.GOOGLE_APPS_SCRIPT_URL.trim();
    }
    if (window.__ENV__.SHARED_SECRET) {
      window.BIRTHDAY_CONFIG.sharedSecret = window.__ENV__.SHARED_SECRET.trim();
    }
  }

  // 2. If googleAppsScriptUrl is not set via env.js, attempt to fetch .env file
  if (!window.BIRTHDAY_CONFIG.googleAppsScriptUrl) {
    try {
      const response = await fetch('.env');
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key === 'GOOGLE_APPS_SCRIPT_URL' && val) {
              window.BIRTHDAY_CONFIG.googleAppsScriptUrl = val;
            } else if (key === 'SHARED_SECRET' && val) {
              window.BIRTHDAY_CONFIG.sharedSecret = val;
            }
          }
        }
      }
    } catch (err) {
      // Quietly fall back if .env is not accessible
    }
  }

  window.BIRTHDAY_CONFIG.isLoaded = true;
  return window.BIRTHDAY_CONFIG;
};

// Start loading immediately so it's ready when the user submits
window.envPromise = window.loadEnvConfig();
