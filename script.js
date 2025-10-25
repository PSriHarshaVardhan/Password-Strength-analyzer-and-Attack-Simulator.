// ---------- Elements ----------
const password = document.getElementById("password");
const confirmEl = document.getElementById("confirm");
const strengthFill = document.getElementById("strength-fill");
const strengthText = document.getElementById("strength-text");
const entropyText = document.getElementById("entropy-text");

const letter = document.getElementById("letter");
const capital = document.getElementById("capital");
const number = document.getElementById("number");
const special = document.getElementById("special");
const lengthEl = document.getElementById("length");
const match = document.getElementById("match");

const simulateBtn = document.getElementById("simulate");
const attackResult = document.getElementById("attack-result");
const attackTime = document.getElementById("attack-time");
const attackFill = document.getElementById("attack-fill");

const toggleVisibility = document.getElementById("toggle-visibility");
const copyPassword = document.getElementById("copy-password");
const suggestBtn = document.getElementById("suggest");

// Simple dictionary for demo
const dictionary = [
  "password", "123456", "qwerty", "letmein", "welcome", "admin", "iloveyou", "12345678"
];

// Guesses per second for simulation
const guessesPerSecond = 2_000_000_000; // 2 billion guesses/s

// ---------- Helpers ----------
function setValid(el, valid, text) {
  if (valid) {
    el.classList.remove("invalid");
    el.classList.add("valid");
    if (text) el.textContent = `✓ ${text}`;
  } else {
    el.classList.remove("valid");
    el.classList.add("invalid");
    if (text) el.textContent = `✗ ${text}`;
  }
}

function calcCharsetSize(pwd) {
  let size = 0;
  if (/[a-z]/.test(pwd)) size += 26;
  if (/[A-Z]/.test(pwd)) size += 26;
  if (/[0-9]/.test(pwd)) size += 10;
  if (/[^A-Za-z0-9]/.test(pwd)) size += 32; // approximate special chars
  return size;
}

function estimateEntropy(pwd) {
  if (!pwd || pwd.length === 0) return 0;
  const set = calcCharsetSize(pwd);
  if (set <= 1) return 0;
  return +(pwd.length * Math.log2(set)).toFixed(2);
}

function humanTime(seconds) {
  if (!isFinite(seconds)) return "∞";
  if (seconds < 60) return `${seconds.toFixed(2)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)} hours`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)} days`;
  return `${(seconds / 31536000).toFixed(2)} years`;
}

function entropyToPercent(bits) {
  const max = 80;
  const val = Math.max(0, Math.min(bits, max));
  return Math.round((val / max) * 100);
}

function strengthLabel(bits) {
  if (bits < 28) return "Very Weak";
  if (bits < 36) return "Weak";
  if (bits < 60) return "Fair";
  if (bits < 80) return "Strong";
  return "Very Strong";
}

// ---------- Password Validation ----------
function validatePassword(value) {
  setValid(letter, /[a-z]/.test(value), "Lowercase letter");
  setValid(capital, /[A-Z]/.test(value), "Uppercase letter");
  setValid(number, /[0-9]/.test(value), "Number");
  setValid(special, /[^A-Za-z0-9]/.test(value), "Special character (@, #, $, etc.)");
  setValid(lengthEl, value.length >= 8, "At least 8 characters");

  const bits = estimateEntropy(value);
  entropyText.textContent = `· ${bits} bits`;
  const pct = entropyToPercent(bits);
  strengthFill.style.width = pct + "%";

  const label = value.length === 0 ? "Type a password" : strengthLabel(bits);
  strengthText.textContent = label;
}

// ---------- Confirm Match ----------
function checkMatch() {
  if (confirmEl.value.length > 0 && confirmEl.value === password.value) {
    match.classList.remove("invalid"); match.classList.add("valid");
    match.textContent = "✓ Passwords match";
  } else {
    match.classList.remove("valid"); match.classList.add("invalid");
    match.textContent = "✗ Passwords do not match";
  }
}

// ---------- Visibility Toggle & Copy ----------
toggleVisibility.addEventListener("click", () => {
  const showing = password.type === "text";
  password.type = showing ? "password" : "text";
  confirmEl.type = showing ? "password" : "text";
  toggleVisibility.setAttribute("aria-pressed", String(!showing));
  toggleVisibility.textContent = showing ? "👁️" : "🙈";
});

copyPassword.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(password.value);
    copyPassword.textContent = "✅";
    setTimeout(() => (copyPassword.textContent = "📋"), 1200);
  } catch {
    copyPassword.textContent = "❌";
    setTimeout(() => (copyPassword.textContent = "📋"), 1200);
  }
});

// ---------- Attack Simulation ----------
function totalGuesses(charsetSize, length) {
  const log10Total = length * Math.log10(charsetSize);
  if (log10Total > 308) return Infinity;
  return Math.pow(charsetSize, length);
}

function simulateAttackUI(totalSeconds) {
  const demoMaxMs = 2500;
  const scaled = Math.min(demoMaxMs, 400 + Math.log10(totalSeconds + 1) * 600);
  attackFill.style.transition = `width ${scaled}ms linear`;
  attackFill.style.width = "0%";

  requestAnimationFrame(() => {
    attackFill.style.width = "100%";
  });

  setTimeout(() => {
    attackFill.style.transition = `width 800ms ease-out`;
    attackFill.style.width = "100%";
  }, scaled + 50);
}

simulateBtn.addEventListener("click", () => {
  const pwd = password.value;
  if (!pwd) {
    attackResult.textContent = "Enter a password to simulate attack!";
    attackTime.textContent = "";
    attackFill.style.width = "0%";
    return;
  }

  if (dictionary.includes(pwd.toLowerCase())) {
    attackResult.textContent = "Dictionary Attack: Very common password!";
    attackTime.textContent = "Estimated time: < 1 second";
    attackFill.style.width = "100%";
    return;
  }

  const charset = calcCharsetSize(pwd);
  if (charset === 0) {
    attackResult.textContent = "Password must contain printable characters.";
    attackTime.textContent = "";
    attackFill.style.width = "0%";
    return;
  }

  const log10Total = pwd.length * Math.log10(charset);
  let total = totalGuesses(charset, pwd.length);
  let seconds = Infinity;
  if (isFinite(total)) seconds = total / guessesPerSecond;
  else {
    const log10Seconds = log10Total - Math.log10(guessesPerSecond);
    seconds = log10Seconds > 308 ? Infinity : Math.pow(10, log10Seconds);
  }

  attackResult.textContent = "Brute-Force Attack estimate:";
  attackTime.textContent = `Estimated time to crack: ${humanTime(seconds)}`;
  simulateAttackUI(seconds);
});

// ---------- Password Suggestion ----------
function generatePassword(options = {length: 14}) {
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const specials = "!@#$%&*?_-+=";
  const all = lowers + uppers + numbers + specials;
  const arr = [];
  arr.push(lowers[Math.floor(Math.random() * lowers.length)]);
  arr.push(uppers[Math.floor(Math.random() * uppers.length)]);
  arr.push(numbers[Math.floor(Math.random() * numbers.length)]);
  arr.push(specials[Math.floor(Math.random() * specials.length)]);
  for (let i = arr.length; i < options.length; i++) {
    arr.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

suggestBtn.addEventListener("click", () => {
  const suggested = generatePassword({length: 14});
  password.value = suggested;
  confirmEl.value = suggested;
  validatePassword(suggested);
  checkMatch();
  copyPassword.textContent = "📋";
});

// ---------- Event Listeners ----------
password.addEventListener("input", () => {
  validatePassword(password.value);
  if (confirmEl.value !== "") checkMatch();
});
confirmEl.addEventListener("input", checkMatch);

// ---------- Initialize ----------
validatePassword("");
attackFill.style.width = "0%";
