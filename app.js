// MyFive Golf - Application Logic
// Pick your five stats. Chase zero events.

// --- STAT LIBRARY ---
// Every stat is a one-tap, per-hole event. `parOnly` restricts a stat to holes
// of a specific par (the toggle is disabled elsewhere, like Tiger 5's par-5 rule).
const STAT_LIBRARY = [
  // Scoring
  { id: 'double_bogey',    title: 'Double Bogey+',      subtitle: 'Any hole played at +2 or worse',          category: 'Scoring' },
  { id: 'triple_bogey',    title: 'Triple Bogey+',      subtitle: 'Any hole played at +3 or worse',          category: 'Scoring' },
  { id: 'par5_bogey',      title: 'Bogey on Par 5',     subtitle: 'Bogey or worse on a par 5',               category: 'Scoring', parOnly: 5 },
  { id: 'par3_double',     title: 'Double on Par 3',    subtitle: 'Double bogey or worse on a par 3',        category: 'Scoring', parOnly: 3 },
  // Off the Tee
  { id: 'lost_ball_tee',   title: 'Lost Ball off Tee',  subtitle: 'Ball lost or out of bounds from the tee', category: 'Off the Tee' },
  { id: 'water_tee',       title: 'Tee Shot in Hazard', subtitle: 'Tee shot into water or a penalty area',   category: 'Off the Tee' },
  { id: 'recovery_tee',    title: 'Punch-Out',          subtitle: 'Tee shot forced a recovery or punch-out', category: 'Off the Tee' },
  { id: 're_tee',          title: 'Re-Tee',             subtitle: 'Had to hit 3 off the tee',                category: 'Off the Tee' },
  // Approach
  { id: 'wedge_green_miss', title: 'Wedge Miss',        subtitle: 'Missed the green from wedge distance',    category: 'Approach' },
  { id: 'duff_top',        title: 'Duff / Top',         subtitle: 'Chunked or topped a full shot',           category: 'Approach' },
  { id: 'approach_hazard', title: 'Approach in Trouble', subtitle: 'Approach into a bunker or penalty area', category: 'Approach' },
  // Short Game
  { id: 'double_chip',     title: 'Chipped Twice+',     subtitle: '2+ chips/pitches around the same green',  category: 'Short Game' },
  { id: 'bunker_fail',     title: 'Left in Bunker',     subtitle: 'Needed 2+ tries to escape the sand',      category: 'Short Game' },
  { id: 'chip_miss',       title: 'Chip Missed Green',  subtitle: 'A chip or pitch failed to reach the green', category: 'Short Game' },
  // Putting
  { id: 'three_putt',      title: 'Three Putt+',        subtitle: '3 or more putts on the green',            category: 'Putting' },
  { id: 'short_putt_miss', title: 'Missed Short Putt',  subtitle: 'Missed a putt inside 1 meter',            category: 'Putting' },
  // General
  { id: 'penalty',         title: 'Penalty Stroke',     subtitle: 'Any penalty stroke on the hole',          category: 'General' },
  { id: 'mental_error',    title: 'Mental Error',       subtitle: 'Wrong club, bad decision, lost focus',    category: 'General' }
];

const STATS_BY_ID = Object.fromEntries(STAT_LIBRARY.map(s => [s.id, s]));
const STAT_CATEGORIES = ['Scoring', 'Off the Tee', 'Approach', 'Short Game', 'Putting', 'General'];
const TRACK_COUNT = 5;

const PRESETS = [
  {
    id: 'classic',
    name: 'Classic Tiger 5',
    desc: 'The original five score-wreckers',
    stats: ['double_bogey', 'par5_bogey', 'three_putt', 'wedge_green_miss', 'double_chip']
  },
  {
    id: 'beginner',
    name: 'Beginner 5',
    desc: 'Stop the big numbers first',
    stats: ['lost_ball_tee', 'penalty', 'triple_bogey', 'duff_top', 'three_putt']
  },
  {
    id: 'shortgame',
    name: 'Short Game 5',
    desc: 'Sharpen everything inside 100m',
    stats: ['double_chip', 'bunker_fail', 'chip_miss', 'three_putt', 'short_putt_miss']
  }
];

// Legacy Tiger 5 stats keys (used to import old backup files)
const LEGACY_KEYS = ['double_bogey', 'par5_bogey', 'three_putt', 'wedge_green_miss', 'double_chip'];

// --- STATE MANAGEMENT ---
let state = {
  rounds: [],           // Finished rounds history
  currentRound: null,   // Active round (in_progress)
  theme: 'system',      // Theme selection: system, light, dark
  selectedStats: null,  // The user's chosen five stat ids (null = not chosen yet)
  courses: []           // Remembered courses: { id, name, pars: { holeNumber: par } }
};

// --- HAPTICS ---
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(15);
  }
}

// --- LOCAL STORAGE UTILITIES ---
function loadState() {
  try {
    const savedRounds = localStorage.getItem('MYFIVE_ROUNDS');
    const savedCurrent = localStorage.getItem('MYFIVE_CURRENT_ROUND');
    const savedSettings = localStorage.getItem('MYFIVE_SETTINGS');
    const savedCourses = localStorage.getItem('MYFIVE_COURSES');

    if (savedRounds) state.rounds = JSON.parse(savedRounds);
    if (savedCurrent) state.currentRound = JSON.parse(savedCurrent);
    if (savedCourses) state.courses = JSON.parse(savedCourses);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.theme) state.theme = settings.theme;
      if (Array.isArray(settings.selectedStats)) {
        const valid = settings.selectedStats.filter(id => STATS_BY_ID[id]);
        if (valid.length === TRACK_COUNT) state.selectedStats = valid;
      }
    }
    applyTheme(state.theme);
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
  }
}

function saveRounds() {
  localStorage.setItem('MYFIVE_ROUNDS', JSON.stringify(state.rounds));
}

function saveCourses() {
  localStorage.setItem('MYFIVE_COURSES', JSON.stringify(state.courses));
}

function saveCurrentRound() {
  if (state.currentRound) {
    localStorage.setItem('MYFIVE_CURRENT_ROUND', JSON.stringify(state.currentRound));
  } else {
    localStorage.removeItem('MYFIVE_CURRENT_ROUND');
  }
}

function saveSettings() {
  localStorage.setItem('MYFIVE_SETTINGS', JSON.stringify({
    theme: state.theme,
    selectedStats: state.selectedStats
  }));
}

function saveThemeSetting(theme) {
  state.theme = theme;
  saveSettings();
  applyTheme(theme);
}

// --- THEME ENGINE ---
function applyTheme(theme) {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) themeSelect.value = theme;
}

// --- STAT HELPERS ---
function getSelectedStats() {
  return state.selectedStats || PRESETS[0].stats;
}

// Which stats a round tracks (snapshotted when the round starts, so history
// stays correct even if the user changes their five later)
function getTrackedStats(round) {
  if (Array.isArray(round.trackedStats)) {
    const valid = round.trackedStats.filter(id => STATS_BY_ID[id]);
    if (valid.length > 0) return valid;
  }
  return PRESETS[0].stats;
}

function statAppliesTo(statId, par) {
  const stat = STATS_BY_ID[statId];
  return !stat.parOnly || stat.parOnly === par;
}

// --- COURSE MEMORY ---
// Courses are learned from play: finishing a round stores the par you set for
// each hole (by absolute hole number), so the next round there is pre-filled.
function normalizeCourseName(name) {
  return name.trim().toLowerCase();
}

function findCourse(name) {
  const key = normalizeCourseName(name);
  if (!key) return null;
  return state.courses.find(c => normalizeCourseName(c.name) === key) || null;
}

function learnCourseFromRound(round) {
  if (!round.courseName || round.courseName === 'Unspecified Course') return;
  let course = findCourse(round.courseName);
  if (!course) {
    course = { id: 'course_' + Date.now(), name: round.courseName.trim(), pars: {} };
    state.courses.push(course);
  }
  round.holes.forEach(h => {
    course.pars[h.holeNumber] = h.par;
  });
  saveCourses();
}

// --- ROUND LOGIC ---
// Holes carry their absolute course hole number (start at 10, play 9 -> holes
// 10..18); `currentHole` is the POSITION in the round (1..totalHoles).
function startNewRound(courseName, date, numHoles = 18, startHole = 1) {
  const parsedHoles = parseInt(numHoles) || 18;
  const parsedStart = parseInt(startHole) || 1;
  const course = findCourse(courseName);
  state.currentRound = {
    id: 'round_' + Date.now(),
    courseName: courseName.trim() || 'Unspecified Course',
    date: date || new Date().toISOString().split('T')[0],
    status: 'in_progress',
    currentHole: 1,
    totalHoles: parsedHoles,
    startHole: parsedStart,
    trackedStats: [...getSelectedStats()],
    holes: Array.from({ length: parsedHoles }, (_, i) => {
      const holeNumber = ((parsedStart - 1 + i) % 18) + 1;
      return {
        holeNumber,
        par: (course && course.pars[holeNumber]) || 4,
        events: {}
      };
    })
  };
  saveCurrentRound();
  renderActiveHole();
  showScreen('screen-active-round');
}

function discardCurrentRound() {
  state.currentRound = null;
  saveCurrentRound();
  renderDashboard();
  showScreen('screen-dashboard');
}

function finishCurrentRound() {
  if (!state.currentRound) return;
  state.currentRound.status = 'finished';
  learnCourseFromRound(state.currentRound);
  state.rounds.push(state.currentRound);

  const finishedRoundId = state.currentRound.id;
  state.currentRound = null;
  saveCurrentRound();
  saveRounds();

  showRoundSummary(finishedRoundId);
}

// --- MATH & DERIVED METRICS ---
function hasAnyEventChecked(hole, trackedStats) {
  return trackedStats.some(id => hole.events[id] && statAppliesTo(id, hole.par));
}

function calculateRoundStats(round) {
  const tracked = getTrackedStats(round);
  let totalEvents = 0;
  let holesPlayed = 0;
  let cleanHoles = 0;

  const metricsCount = {};
  const eligibleCount = {}; // holes where the stat could apply (matters for parOnly stats)
  tracked.forEach(id => {
    metricsCount[id] = 0;
    eligibleCount[id] = 0;
  });

  round.holes.forEach((hole, idx) => {
    // Finished rounds count all holes; in-progress rounds count positions up to
    // the current one (the current position only if something is logged on it)
    const position = idx + 1;
    const isLogged = round.status === 'finished' || position < round.currentHole ||
                     (position === round.currentHole && hasAnyEventChecked(hole, tracked));

    if (isLogged) {
      holesPlayed++;
      let holeEvents = 0;

      tracked.forEach(id => {
        if (statAppliesTo(id, hole.par)) {
          eligibleCount[id]++;
          if (hole.events[id]) {
            metricsCount[id]++;
            totalEvents++;
            holeEvents++;
          }
        }
      });

      if (holeEvents === 0) cleanHoles++;
    }
  });

  const index = holesPlayed > 0 ? ((totalEvents / holesPlayed) * 18).toFixed(1) : '0.0';
  const cleanPct = holesPlayed > 0 ? Math.round((cleanHoles / holesPlayed) * 100) : null;

  // Find biggest leak
  let biggestLeak = null;
  let maxCount = -1;
  tracked.forEach(id => {
    if (metricsCount[id] > maxCount) {
      maxCount = metricsCount[id];
      biggestLeak = id;
    }
  });

  return {
    totalEvents,
    holesPlayed,
    index,
    cleanHoles,
    cleanPct,
    metricsCount,
    eligibleCount,
    trackedStats: tracked,
    biggestLeak: maxCount > 0 ? biggestLeak : null
  };
}

function getSeasonSummary(year = new Date().getFullYear()) {
  const filteredRounds = state.rounds.filter(r => new Date(r.date).getFullYear() === year);

  const metricsCount = {};
  const eligibleCount = {};
  STAT_LIBRARY.forEach(s => {
    metricsCount[s.id] = 0;
    eligibleCount[s.id] = 0;
  });

  if (filteredRounds.length === 0) {
    return { roundsCount: 0, index: '0.0', biggestLeak: null, cleanPct: null, metricsCount, eligibleCount, totalHoles: 0, trackedSet: [] };
  }

  let totalEvents = 0;
  let totalHoles = 0;
  let totalCleanHoles = 0;
  const trackedSet = new Set();

  filteredRounds.forEach(r => {
    const stats = calculateRoundStats(r);
    totalEvents += stats.totalEvents;
    totalHoles += stats.holesPlayed;
    totalCleanHoles += stats.cleanHoles;

    stats.trackedStats.forEach(id => {
      trackedSet.add(id);
      metricsCount[id] += stats.metricsCount[id];
      eligibleCount[id] += stats.eligibleCount[id];
    });
  });

  const index = totalHoles > 0 ? ((totalEvents / totalHoles) * 18).toFixed(1) : '0.0';
  const cleanPct = totalHoles > 0 ? Math.round((totalCleanHoles / totalHoles) * 100) : null;

  // Rank leaks by events per 18 holes played
  let biggestLeak = null;
  let maxRate = -1;
  trackedSet.forEach(id => {
    const rate = totalHoles > 0 ? (metricsCount[id] / totalHoles) * 18 : 0;
    if (rate > maxRate) {
      maxRate = rate;
      biggestLeak = id;
    }
  });

  return {
    roundsCount: filteredRounds.length,
    index,
    metricsCount,
    eligibleCount,
    cleanPct,
    biggestLeak: maxRate > 0 ? biggestLeak : null,
    totalHoles,
    trackedSet: [...trackedSet]
  };
}

// --- SCREEN NAVIGATION ---
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(scr => {
    scr.classList.add('hidden');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo(0, 0);
  }
}

// --- UI RENDERING ENGINE ---

// 1. Dashboard View
function renderDashboard() {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  // Check for in-progress round
  const inProgressContainer = document.getElementById('in-progress-banner');
  if (state.currentRound) {
    inProgressContainer.innerHTML = `
      <div class="card card-alert">
        <div class="card-alert-body">
          <h3>Round in Progress</h3>
          <p>${state.currentRound.courseName} — Hole ${state.currentRound.holes[state.currentRound.currentHole - 1].holeNumber} (${state.currentRound.currentHole} of ${state.currentRound.totalHoles})</p>
        </div>
        <div class="card-alert-actions">
          <button class="btn btn-primary btn-sm" id="btn-resume-round">Resume</button>
          <button class="btn btn-secondary btn-sm" id="btn-discard-prompt">Discard</button>
        </div>
      </div>
    `;
    inProgressContainer.classList.remove('hidden');

    document.getElementById('btn-resume-round').addEventListener('click', () => {
      triggerHaptic();
      renderActiveHole();
      showScreen('screen-active-round');
    });

    document.getElementById('btn-discard-prompt').addEventListener('click', () => {
      triggerHaptic();
      if (confirm('Are you sure you want to discard this round? This cannot be undone.')) {
        discardCurrentRound();
      }
    });
  } else {
    inProgressContainer.innerHTML = '';
    inProgressContainer.classList.add('hidden');
  }

  // Season overview
  const currentYear = new Date().getFullYear();
  const season = getSeasonSummary(currentYear);

  let leakHTML = 'None logged';
  if (season.biggestLeak) {
    leakHTML = `<span class="badge badge-warning">${STATS_BY_ID[season.biggestLeak].title}</span>`;
  }

  const cleanHTML = season.cleanPct !== null ? `${season.cleanPct}%` : 'N/A';

  // The user's current five, shown as tappable chips
  const trackingChips = getSelectedStats()
    .map(id => `<span class="tracking-chip">${STATS_BY_ID[id].title}</span>`)
    .join('');

  container.innerHTML = `
    <!-- Top Brand Card -->
    <div class="brand-hero">
      <div class="brand-hero-logo">
        <img src="icons/logo.svg" alt="MyFive Golf Logo" />
      </div>
      <h2>MyFive Golf</h2>
      <p class="subtitle">your five. zero events.</p>
    </div>

    <!-- Currently tracked stats -->
    <div class="tracking-strip" id="tracking-strip" title="Change your five stats">
      ${trackingChips}
      <span class="tracking-chip tracking-edit">✎ Edit</span>
    </div>

    <!-- Quick Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Season Index</span>
        <span class="stat-val text-accent">${season.index}</span>
        <span class="stat-desc">Events per 18 holes</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Rounds</span>
        <span class="stat-val">${season.roundsCount}</span>
        <span class="stat-desc">Played in ${currentYear}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Biggest Leak</span>
        <span class="stat-val val-small">${leakHTML}</span>
        <span class="stat-desc">Most frequent event</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Clean Holes</span>
        <span class="stat-val text-success">${cleanHTML}</span>
        <span class="stat-desc">Holes with zero events</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="dashboard-actions">
      <button class="btn btn-primary btn-lg btn-full" id="btn-start-flow">
        <span class="btn-icon">🏌️‍♂️</span> Start New Round
      </button>
      <div class="button-row">
        <button class="btn btn-secondary btn-full" id="btn-goto-trends">
          📊 Trends &amp; History
        </button>
        <button class="btn btn-secondary btn-full" id="btn-goto-settings">
          ⚙️ Settings
        </button>
      </div>
    </div>
  `;

  // Bind Dashboard Buttons
  document.getElementById('tracking-strip').addEventListener('click', () => {
    triggerHaptic();
    renderStatPicker({ firstRun: false });
    showScreen('screen-picker');
  });

  document.getElementById('btn-start-flow').addEventListener('click', () => {
    triggerHaptic();
    prepareSetupScreen();
    showScreen('screen-setup');
  });

  document.getElementById('btn-goto-trends').addEventListener('click', () => {
    triggerHaptic();
    renderTrendsView();
    showScreen('screen-trends');
  });

  document.getElementById('btn-goto-settings').addEventListener('click', () => {
    triggerHaptic();
    renderSettingsView();
    showScreen('screen-settings');
  });
}

// 2. Stat Picker View (onboarding + settings)
let pickerSelection = new Set();

function renderStatPicker({ firstRun = false } = {}) {
  const container = document.getElementById('picker-content');
  if (!container) return;

  pickerSelection = new Set(getSelectedStats());

  const introHTML = firstRun
    ? `
      <div class="brand-hero">
        <div class="brand-hero-logo">
          <img src="icons/logo.svg" alt="MyFive Golf Logo" />
        </div>
        <h2>Welcome to MyFive Golf</h2>
        <p class="subtitle">pick the 5 stats you want to beat</p>
      </div>
      <p class="picker-intro">Great golf is about avoiding <strong>your</strong> five most costly mistakes.
      Choose exactly five events to track — start from a preset or build your own mix. You can change them anytime in Settings.</p>
    `
    : `
      <div class="header-bar"><h2>My 5 Stats</h2></div>
      <p class="picker-intro">Choose exactly five events to track. Your round history keeps the stats it was played with.</p>
    `;

  const presetsHTML = PRESETS.map(p => `
    <button class="preset-btn" data-preset="${p.id}">
      <span class="preset-name">${p.name}</span>
      <span class="preset-desc">${p.desc}</span>
    </button>
  `).join('');

  const categoriesHTML = STAT_CATEGORIES.map(cat => {
    const stats = STAT_LIBRARY.filter(s => s.category === cat);
    const cardsHTML = stats.map(s => `
      <div class="stat-pick-card" data-stat="${s.id}">
        <div class="stat-pick-info">
          <span class="stat-pick-title">${s.title}</span>
          <span class="stat-pick-subtitle">${s.subtitle}</span>
        </div>
        <div class="pick-check">✓</div>
      </div>
    `).join('');
    return `
      <div class="picker-category">
        <label class="section-label">${cat}</label>
        <div class="toggles-grid">${cardsHTML}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    ${introHTML}

    <label class="section-label">Quick Presets</label>
    <div class="preset-row">${presetsHTML}</div>

    ${categoriesHTML}

    <div class="picker-footer">
      <div class="picker-counter" id="picker-counter"></div>
      <button class="btn btn-primary btn-lg btn-full" id="btn-picker-save">Save My 5</button>
      ${firstRun ? '' : '<button class="btn btn-secondary btn-full" id="btn-picker-cancel">Cancel</button>'}
    </div>
  `;

  function refreshPickerUI() {
    container.querySelectorAll('.stat-pick-card').forEach(card => {
      const id = card.getAttribute('data-stat');
      card.classList.toggle('selected', pickerSelection.has(id));
    });
    const counter = document.getElementById('picker-counter');
    const n = pickerSelection.size;
    counter.textContent = `${n} of ${TRACK_COUNT} selected`;
    counter.classList.toggle('counter-ok', n === TRACK_COUNT);
    document.getElementById('btn-picker-save').disabled = n !== TRACK_COUNT;
  }

  // Preset buttons
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic();
      const preset = PRESETS.find(p => p.id === btn.getAttribute('data-preset'));
      pickerSelection = new Set(preset.stats);
      refreshPickerUI();
    });
  });

  // Stat cards
  container.querySelectorAll('.stat-pick-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-stat');
      if (pickerSelection.has(id)) {
        triggerHaptic();
        pickerSelection.delete(id);
      } else {
        if (pickerSelection.size >= TRACK_COUNT) {
          // At the limit: flash the counter instead of adding a sixth
          const counter = document.getElementById('picker-counter');
          counter.classList.remove('counter-shake');
          void counter.offsetWidth; // restart animation
          counter.classList.add('counter-shake');
          return;
        }
        triggerHaptic();
        pickerSelection.add(id);
      }
      refreshPickerUI();
    });
  });

  // Save / Cancel
  document.getElementById('btn-picker-save').addEventListener('click', () => {
    if (pickerSelection.size !== TRACK_COUNT) return;
    triggerHaptic();
    // Store in library order for consistent display
    state.selectedStats = STAT_LIBRARY.filter(s => pickerSelection.has(s.id)).map(s => s.id);
    saveSettings();
    renderDashboard();
    showScreen('screen-dashboard');
  });

  const cancelBtn = document.getElementById('btn-picker-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      triggerHaptic();
      renderDashboard();
      showScreen('screen-dashboard');
    });
  }

  refreshPickerUI();
}

// 3. Active Hole Log View
function renderActiveHole() {
  const round = state.currentRound;
  if (!round) return;

  const holeIndex = round.currentHole - 1;
  const hole = round.holes[holeIndex];
  const tracked = getTrackedStats(round);

  const container = document.getElementById('active-round-content');
  if (!container) return;

  // Build the list of toggles
  let togglesHTML = '';
  tracked.forEach(id => {
    const stat = STATS_BY_ID[id];
    const isDisabled = !statAppliesTo(id, hole.par);
    const isChecked = hole.events[id] && !isDisabled;

    togglesHTML += `
      <div class="toggle-card ${isDisabled ? 'disabled' : ''} ${isChecked ? 'active' : ''}" data-metric="${id}">
        <div class="toggle-card-info">
          <span class="toggle-title">${stat.title}</span>
          <span class="toggle-subtitle">${stat.subtitle}</span>
        </div>
        <div class="toggle-control">
          <input type="checkbox" id="chk-${id}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
          <label for="chk-${id}"></label>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="hole-header">
      <div class="hole-nav-arrow" id="btn-hole-prev" ${round.currentHole === 1 ? 'style="visibility: hidden;"' : ''}>
        ←
      </div>
      <div class="hole-title-group">
        <span class="hole-label">Hole</span>
        <h1 class="hole-number">${hole.holeNumber}</h1>
        <span class="hole-total">${round.currentHole} of ${round.totalHoles}</span>
      </div>
      <div class="hole-nav-arrow" id="btn-hole-next-header" ${round.currentHole === round.totalHoles ? 'style="visibility: hidden;"' : ''}>
        →
      </div>
    </div>

    <!-- Par Selector Segmented Control -->
    <div class="par-selector-container">
      <label class="section-label">Hole Par</label>
      <div class="segmented-control">
        <button class="segment-btn ${hole.par === 3 ? 'active' : ''}" data-par="3">Par 3</button>
        <button class="segment-btn ${hole.par === 4 ? 'active' : ''}" data-par="4">Par 4</button>
        <button class="segment-btn ${hole.par === 5 ? 'active' : ''}" data-par="5">Par 5</button>
      </div>
    </div>

    <!-- Tracked Events Grid -->
    <div class="errors-container">
      <label class="section-label">Your Five</label>
      <div class="toggles-grid">
        ${togglesHTML}
      </div>
    </div>

    <!-- Navigation & Completion buttons -->
    <div class="active-nav-actions">
      ${round.currentHole < round.totalHoles
        ? `<button class="btn btn-primary btn-lg btn-full" id="btn-hole-next">Next Hole</button>`
        : `<button class="btn btn-accent btn-lg btn-full" id="btn-finish-prompt">Finish Round</button>`
      }
      <button class="btn btn-danger-text btn-full text-center" id="btn-finish-abort">
        Finish &amp; Save Round Early
      </button>
    </div>
  `;

  // Read visual checkboxes state and save into state
  function saveHoleState() {
    tracked.forEach(id => {
      const checkbox = document.getElementById(`chk-${id}`);
      if (checkbox && !checkbox.disabled) {
        hole.events[id] = checkbox.checked;
      } else {
        hole.events[id] = false;
      }
    });
  }

  // 1. Hole navigation buttons
  const prevBtn = document.getElementById('btn-hole-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      triggerHaptic();
      saveHoleState();
      round.currentHole--;
      saveCurrentRound();
      renderActiveHole();
    });
  }

  const nextBtnHeader = document.getElementById('btn-hole-next-header');
  if (nextBtnHeader) {
    nextBtnHeader.addEventListener('click', () => {
      triggerHaptic();
      saveHoleState();
      round.currentHole++;
      saveCurrentRound();
      renderActiveHole();
    });
  }

  const nextBtnFooter = document.getElementById('btn-hole-next');
  if (nextBtnFooter) {
    nextBtnFooter.addEventListener('click', () => {
      triggerHaptic();
      saveHoleState();
      round.currentHole++;
      saveCurrentRound();
      renderActiveHole();
    });
  }

  const finishPrompt = document.getElementById('btn-finish-prompt');
  if (finishPrompt) {
    finishPrompt.addEventListener('click', () => {
      triggerHaptic();
      saveHoleState();
      if (confirm('Complete and lock this round in history?')) {
        finishCurrentRound();
      }
    });
  }

  const abortBtn = document.getElementById('btn-finish-abort');
  if (abortBtn) {
    abortBtn.addEventListener('click', () => {
      triggerHaptic();
      saveHoleState();
      if (confirm(`Do you want to save and finish this round early at Hole ${hole.holeNumber}?`)) {
        // Cut the round short to the current hole
        round.holes = round.holes.slice(0, round.currentHole);
        round.totalHoles = round.currentHole;
        finishCurrentRound();
      }
    });
  }

  // 2. Par selection segmented buttons
  container.querySelectorAll('.segment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      triggerHaptic();
      const selectedPar = parseInt(e.currentTarget.getAttribute('data-par'));
      hole.par = selectedPar;

      // Clear any events that no longer apply on this par
      tracked.forEach(id => {
        if (!statAppliesTo(id, selectedPar)) {
          hole.events[id] = false;
        }
      });

      saveCurrentRound();
      // Rerender to enable/disable par-restricted toggles
      renderActiveHole();
    });
  });

  // 3. Toggle click listeners (clicking the whole card should toggle)
  container.querySelectorAll('.toggle-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.currentTarget.classList.contains('disabled')) return;

      // Prevent double triggers if clicking the checkbox/label directly
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') {
        return;
      }

      triggerHaptic();
      const metric = e.currentTarget.getAttribute('data-metric');
      const checkbox = document.getElementById(`chk-${metric}`);
      checkbox.checked = !checkbox.checked;

      // Update UI classes
      if (checkbox.checked) {
        e.currentTarget.classList.add('active');
      } else {
        e.currentTarget.classList.remove('active');
      }

      hole.events[metric] = checkbox.checked;
      saveCurrentRound();
    });
  });

  // Checkbox direct change binding
  container.querySelectorAll('.toggle-control input').forEach(input => {
    input.addEventListener('change', (e) => {
      triggerHaptic();
      const metric = e.currentTarget.id.replace('chk-', '');
      const card = e.currentTarget.closest('.toggle-card');

      if (e.currentTarget.checked) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }

      hole.events[metric] = e.currentTarget.checked;
      saveCurrentRound();
    });
  });
}

// 4. Round Summary View
function showRoundSummary(roundId) {
  const round = state.rounds.find(r => r.id === roundId);
  if (!round) {
    showScreen('screen-dashboard');
    return;
  }

  const container = document.getElementById('summary-content');
  if (!container) return;

  const stats = calculateRoundStats(round);
  const tracked = stats.trackedStats;

  // Verdict text generation
  let verdict = '';
  if (stats.totalEvents === 0) {
    verdict = 'A perfect round! 0 events across your five. Absolutely stellar golf!';
  } else {
    const leakName = STATS_BY_ID[stats.biggestLeak]?.title || 'events';
    if (parseFloat(stats.index) < 4.0) {
      verdict = `${stats.totalEvents} events over ${stats.holesPlayed} holes. Brilliant scoring efficiency! Keep it up.`;
    } else if (parseFloat(stats.index) < 8.0) {
      verdict = `${stats.totalEvents} events over ${stats.holesPlayed} holes. Decent round, but ${leakName} held you back today.`;
    } else {
      verdict = `${stats.totalEvents} events over ${stats.holesPlayed} holes. A tough round — your main leak was ${leakName}. Plan your practice here.`;
    }
  }

  // Create list of holes list review
  let holeReviewHTML = '';
  round.holes.forEach(h => {
    let holeErrors = [];
    tracked.forEach(id => {
      if (h.events[id] && statAppliesTo(id, h.par)) {
        holeErrors.push(STATS_BY_ID[id].title);
      }
    });

    const errorTags = holeErrors.map(err => `<span class="badge-tag">${err}</span>`).join(' ');

    holeReviewHTML += `
      <div class="summary-hole-row">
        <div class="hole-num-col">Hole ${h.holeNumber} <span class="par-tag">Par ${h.par}</span></div>
        <div class="hole-errors-col">
          ${holeErrors.length > 0 ? errorTags : '<span class="text-success text-small font-semibold">Clean Hole ✓</span>'}
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="card card-summary-header text-center">
      <h2 class="course-title">${round.courseName}</h2>
      <div class="summary-meta">${round.date} • ${round.holes.length} Holes Played</div>

      <!-- Big Score Index -->
      <div class="summary-index-container">
        <div class="index-circle">
          <span class="index-score">${stats.index}</span>
          <span class="index-label">Index</span>
        </div>
        <div class="index-explanation">
          <strong>MyFive Index</strong><br>
          Normalized events per 18 holes. Target is 0.0!
        </div>
      </div>

      <!-- Verdict -->
      <div class="summary-verdict">
        "${verdict}"
      </div>
    </div>

    <!-- Metrics Breakdown Card -->
    <div class="card">
      <h3 class="card-title">Your Five Breakdown</h3>
      <div class="breakdown-list">
        ${tracked.map(id => {
          const count = stats.metricsCount[id];
          const stat = STATS_BY_ID[id];

          let displayCount = count.toString();
          if (stat.parOnly) {
            const eligible = stats.eligibleCount[id];
            displayCount = eligible > 0 ? `${count} (of ${eligible})` : 'N/A';
          }

          return `
            <div class="breakdown-item">
              <span class="breakdown-label">${stat.title}</span>
              <span class="breakdown-val ${count > 0 ? 'text-warning font-semibold' : 'text-muted-dark'}" style="font-size: 1.1rem;">
                ${displayCount}
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Hole-by-Hole Review -->
    <div class="card">
      <h3 class="card-title">Hole-by-Hole Log</h3>
      <div class="summary-holes-list">
        ${holeReviewHTML}
      </div>
    </div>

    <!-- Actions -->
    <div class="button-container">
      <button class="btn btn-primary btn-lg btn-full" id="btn-summary-home">Back to Dashboard</button>
      <button class="btn btn-secondary btn-full" id="btn-summary-delete">Delete Round Record</button>
    </div>
  `;

  // Bind Buttons
  document.getElementById('btn-summary-home').addEventListener('click', () => {
    triggerHaptic();
    renderDashboard();
    showScreen('screen-dashboard');
  });

  document.getElementById('btn-summary-delete').addEventListener('click', () => {
    triggerHaptic();
    if (confirm('Delete this round permanently? This cannot be undone.')) {
      state.rounds = state.rounds.filter(r => r.id !== round.id);
      saveRounds();
      renderDashboard();
      showScreen('screen-dashboard');
    }
  });

  showScreen('screen-summary');
}

// 5. Trends and History View
function renderTrendsView() {
  const container = document.getElementById('trends-content');
  if (!container) return;

  const currentYear = new Date().getFullYear();
  const years = [...new Set(state.rounds.map(r => new Date(r.date).getFullYear()))];
  if (years.length === 0 || !years.includes(currentYear)) {
    years.push(currentYear);
  }
  years.sort((a, b) => b - a);

  // Group selector
  let yearDropdown = `
    <div class="form-group" style="margin-bottom: 1.5rem;">
      <label for="trends-year-select">Select Season</label>
      <select id="trends-year-select" class="form-control">
        ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y} Season</option>`).join('')}
      </select>
    </div>
  `;

  container.innerHTML = `
    ${yearDropdown}

    <!-- Dynamic Chart Section -->
    <div class="card" id="chart-trends-card">
      <h3 class="card-title">MyFive Index History</h3>
      <div class="chart-container" id="svg-trends-chart">
        <!-- SVG will be injected here -->
      </div>
    </div>

    <div class="card" id="chart-leaks-card">
      <h3 class="card-title">Recurring Leaks (Events per 18 Holes)</h3>
      <div class="chart-container" id="svg-leaks-chart">
        <!-- SVG will be injected here -->
      </div>
    </div>

    <!-- History list -->
    <div class="card">
      <h3 class="card-title">Rounds History</h3>
      <div class="history-list" id="rounds-history-list">
        <!-- History rows will be injected here -->
      </div>
    </div>

    <div class="button-container" style="margin-top: 2rem;">
      <button class="btn btn-primary btn-full" id="btn-trends-home">Back to Dashboard</button>
    </div>
  `;

  // Bind Selector Event
  const selector = document.getElementById('trends-year-select');
  selector.addEventListener('change', (e) => {
    updateSeasonGraphs(parseInt(e.target.value));
  });

  document.getElementById('btn-trends-home').addEventListener('click', () => {
    triggerHaptic();
    renderDashboard();
    showScreen('screen-dashboard');
  });

  // Initial render of charts for current year
  updateSeasonGraphs(currentYear);
}

function updateSeasonGraphs(year) {
  const filteredRounds = state.rounds
    .filter(r => new Date(r.date).getFullYear() === year)
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Chronological for line chart

  const trendsContainer = document.getElementById('svg-trends-chart');
  const leaksContainer = document.getElementById('svg-leaks-chart');
  const listContainer = document.getElementById('rounds-history-list');

  // 1. Render rounds list (sorted newest first)
  const historyList = [...filteredRounds].reverse();
  if (historyList.length === 0) {
    listContainer.innerHTML = '<p class="text-center text-muted py-4">No rounds logged in this season.</p>';
  } else {
    listContainer.innerHTML = historyList.map(r => {
      const stats = calculateRoundStats(r);
      return `
        <div class="history-row" data-round-id="${r.id}">
          <div class="history-info">
            <span class="history-course">${r.courseName}</span>
            <span class="history-meta">${r.date} • ${r.holes.length} holes</span>
          </div>
          <div class="history-badge">
            <span class="badge-index">${stats.index}</span>
            <span class="chevron">›</span>
          </div>
        </div>
      `;
    }).join('');

    // Bind clicks to history rows
    listContainer.querySelectorAll('.history-row').forEach(row => {
      row.addEventListener('click', (e) => {
        triggerHaptic();
        const rid = e.currentTarget.getAttribute('data-round-id');
        showRoundSummary(rid);
      });
    });
  }

  // 2. Render SVG Line Chart (MyFive Index over time)
  if (filteredRounds.length === 0) {
    trendsContainer.innerHTML = '<div class="chart-placeholder">Play rounds to see trend line</div>';
    leaksContainer.innerHTML = '<div class="chart-placeholder">Play rounds to see leak analysis</div>';
    return;
  }

  // Draw Line Chart
  const width = 340;
  const height = 180;
  const padding = 25;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Extract indexes
  const dataPoints = filteredRounds.map(r => parseFloat(calculateRoundStats(r).index));

  // Calculate scaling
  const maxVal = Math.max(10, Math.ceil(Math.max(...dataPoints))); // Keep scale at least 0-10
  const minVal = 0;

  const getX = (index) => {
    if (dataPoints.length <= 1) return padding + (chartWidth / 2);
    return padding + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return height - padding - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  // Generate SVG code
  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const val = minVal + (i / 4) * (maxVal - minVal);
    const y = getY(val);
    gridLines += `
      <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4,4" />
      <text x="${padding - 5}" y="${y + 4}" font-size="10" fill="var(--text-muted)" text-anchor="end">${val.toFixed(0)}</text>
    `;
  }

  let linePoints = '';
  let dots = '';
  dataPoints.forEach((val, idx) => {
    const x = getX(idx);
    const y = getY(val);
    linePoints += `${x},${y} `;

    dots += `
      <circle cx="${x}" cy="${y}" r="4" fill="var(--accent-color)" stroke="var(--card-bg)" stroke-width="2" />
      <text x="${x}" y="${y - 8}" font-size="9" fill="var(--text-primary)" font-weight="bold" text-anchor="middle">${val.toFixed(1)}</text>
    `;
  });

  const pathD = `M ${linePoints.trim().replace(/ /g, ' L ')}`;
  const areaD = `M ${getX(0)},${height - padding} L ${linePoints} L ${getX(dataPoints.length - 1)},${height - padding} Z`;

  trendsContainer.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%">
      <defs>
        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-color)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--accent-color)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Grid -->
      ${gridLines}

      <!-- Area Fill -->
      ${dataPoints.length > 0 ? `<path d="${areaD}" fill="url(#chart-area-grad)" />` : ''}

      <!-- Trend Line -->
      ${dataPoints.length > 0 ? `<path d="${pathD}" fill="none" stroke="var(--accent-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />` : ''}

      <!-- Data Dots -->
      ${dots}

      <!-- X-axis Labels (Round markers) -->
      ${filteredRounds.map((r, idx) => {
        const x = getX(idx);
        return `<text x="${x}" y="${height - 5}" font-size="9" fill="var(--text-muted)" text-anchor="middle">R${idx + 1}</text>`;
      }).join('')}
    </svg>
  `;

  // 3. Render Leaks Horizontal Bar Chart (over every stat tracked this season)
  const seasonStats = getSeasonSummary(year);
  const totalHoles = seasonStats.totalHoles || 1;

  const leakData = seasonStats.trackedSet.map(id => {
    const rate = (seasonStats.metricsCount[id] / totalHoles) * 18;
    return {
      id,
      title: STATS_BY_ID[id].title,
      rate: parseFloat(rate.toFixed(1)),
      count: seasonStats.metricsCount[id]
    };
  });

  // Sort by rate descending (biggest leak first)
  leakData.sort((a, b) => b.rate - a.rate);

  const maxRate = Math.max(2.0, Math.max(...leakData.map(d => d.rate)));

  let barsHTML = '';
  leakData.forEach((item, index) => {
    const percentageWidth = (item.rate / maxRate) * 100;
    const barClass = index === 0 && item.rate > 0 ? 'bar-fill bar-warning' : 'bar-fill';

    barsHTML += `
      <div class="bar-chart-row">
        <div class="bar-chart-labels">
          <span class="bar-title">${item.title}</span>
          <span class="bar-legend-val">${item.rate} <span class="legend-unit">/18 holes</span></span>
        </div>
        <div class="bar-track">
          <div class="${barClass}" style="width: ${percentageWidth}%"></div>
        </div>
        <div class="bar-meta">Logged ${item.count} times</div>
      </div>
    `;
  });

  leaksContainer.innerHTML = `
    <div class="bar-chart-container">
      ${barsHTML}
    </div>
  `;
}

// 6. Settings View
function renderSettingsView() {
  const container = document.getElementById('settings-content');
  if (!container) return;

  const myFiveList = getSelectedStats()
    .map(id => `<li>${STATS_BY_ID[id].title}</li>`)
    .join('');

  const coursesHTML = state.courses.length === 0
    ? '<p class="card-desc" style="margin-bottom: 0;">No courses remembered yet. Finish a round and the course\'s hole pars are saved automatically.</p>'
    : `<div class="course-list">${state.courses.map(c => `
        <div class="course-row">
          <div class="course-row-info">
            <span class="course-row-name">${c.name}</span>
            <span class="course-row-meta">${Object.keys(c.pars).length} holes remembered</span>
          </div>
          <button class="btn btn-sm btn-danger-text" data-delete-course="${c.id}">Delete</button>
        </div>
      `).join('')}</div>`;

  container.innerHTML = `
    <!-- My 5 Stats -->
    <div class="card">
      <h3 class="card-title">My 5 Stats</h3>
      <p class="card-desc">The five events you track during a round. Finished rounds keep the stats they were played with.</p>
      <ul class="myfive-list">${myFiveList}</ul>
      <button class="btn btn-accent btn-full" id="btn-change-stats">Change My 5</button>
    </div>

    <!-- Saved Courses -->
    <div class="card">
      <h3 class="card-title">Saved Courses</h3>
      <p class="card-desc">Courses you've played, with the par you set for each hole. Pars are pre-filled when you play them again and updated after every round.</p>
      ${coursesHTML}
    </div>

    <!-- Theme Selection -->
    <div class="card">
      <h3 class="card-title">App Settings</h3>
      <div class="form-group">
        <label for="theme-select">Visual Theme</label>
        <select id="theme-select" class="form-control">
          <option value="system">System Default</option>
          <option value="light">Light Theme (Sunlight Optimized)</option>
          <option value="dark">Dark Theme (Night Round)</option>
        </select>
      </div>
    </div>

    <!-- Data Backup & Sync -->
    <div class="card">
      <h3 class="card-title">Backup &amp; Data Safety</h3>
      <p class="card-desc">All stats are stored locally on your device. Export a backup to save elsewhere, or import to restore your history. Tiger 5 stats backups import too.</p>

      <div class="button-stack">
        <button class="btn btn-secondary btn-full" id="btn-export-json">
          📥 Export Backup Data (JSON)
        </button>
        <button class="btn btn-secondary btn-full" id="btn-export-csv">
          📊 Export Spreadsheet Data (CSV)
        </button>
        <label class="btn btn-secondary btn-full text-center" style="display: block; cursor: pointer; margin-top: 0.5rem;">
          📤 Import Backup File
          <input type="file" id="file-import-json" accept=".json" style="display: none;">
        </label>
      </div>
    </div>

    <!-- Clear database -->
    <div class="card card-destructive">
      <h3 class="card-title text-danger">Reset Application</h3>
      <p class="card-desc text-danger">Permanently erase all rounds and history from this device. This cannot be undone.</p>
      <button class="btn btn-danger btn-full" id="btn-reset-data">Clear All Data</button>
    </div>

    <div class="button-container" style="margin-top: 2rem;">
      <button class="btn btn-primary btn-full" id="btn-settings-home">Back to Dashboard</button>
    </div>
  `;

  // Bind course delete buttons
  container.querySelectorAll('[data-delete-course]').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic();
      const courseId = btn.getAttribute('data-delete-course');
      const course = state.courses.find(c => c.id === courseId);
      if (course && confirm(`Forget "${course.name}" and its remembered pars? Played rounds are not affected.`)) {
        state.courses = state.courses.filter(c => c.id !== courseId);
        saveCourses();
        renderSettingsView();
      }
    });
  });

  // Bind My 5 change button
  document.getElementById('btn-change-stats').addEventListener('click', () => {
    triggerHaptic();
    renderStatPicker({ firstRun: false });
    showScreen('screen-picker');
  });

  // Bind Theme Selector
  const themeSelect = document.getElementById('theme-select');
  themeSelect.value = state.theme;
  themeSelect.addEventListener('change', (e) => {
    triggerHaptic();
    saveThemeSetting(e.target.value);
  });

  // Bind Export/Import
  document.getElementById('btn-export-json').addEventListener('click', () => {
    triggerHaptic();
    exportJSONData();
  });

  document.getElementById('btn-export-csv').addEventListener('click', () => {
    triggerHaptic();
    exportCSVData();
  });

  document.getElementById('file-import-json').addEventListener('change', (e) => {
    triggerHaptic();
    const file = e.target.files[0];
    if (file) {
      importJSONData(file);
    }
  });

  document.getElementById('btn-reset-data').addEventListener('click', () => {
    triggerHaptic();
    if (confirm('DANGER: Erase all golf records? This will delete your entire history permanently.')) {
      if (confirm('Confirm again: Are you absolutely certain you want to wipe all records?')) {
        localStorage.removeItem('MYFIVE_ROUNDS');
        localStorage.removeItem('MYFIVE_CURRENT_ROUND');
        localStorage.removeItem('MYFIVE_SETTINGS');
        localStorage.removeItem('MYFIVE_COURSES');
        state.rounds = [];
        state.currentRound = null;
        state.theme = 'system';
        state.selectedStats = null;
        state.courses = [];
        applyTheme('system');
        alert('All app data has been reset.');
        renderStatPicker({ firstRun: true });
        showScreen('screen-picker');
      }
    }
  });

  document.getElementById('btn-settings-home').addEventListener('click', () => {
    triggerHaptic();
    renderDashboard();
    showScreen('screen-dashboard');
  });
}

// --- DATA IMPORT / EXPORT UTILITIES ---

function exportJSONData() {
  const data = {
    version: '2.1',
    app: 'MyFive Golf',
    exportedAt: new Date().toISOString(),
    theme: state.theme,
    selectedStats: state.selectedStats,
    courses: state.courses,
    rounds: state.rounds
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `myfive_golf_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSVData() {
  if (state.rounds.length === 0) {
    alert('No round data available to export.');
    return;
  }

  // One column per library stat; blank when a round didn't track that stat
  const statColumns = STAT_LIBRARY.map(s => s.id);
  let csvContent = 'round_id,date,course_name,holes_played,myfive_index,clean_holes,' + statColumns.join(',') + '\n';

  state.rounds.forEach(r => {
    const stats = calculateRoundStats(r);
    const trackedSet = new Set(stats.trackedStats);
    const statValues = statColumns.map(id => trackedSet.has(id) ? stats.metricsCount[id] : '');
    const row = [
      r.id,
      r.date,
      `"${r.courseName.replace(/"/g, '""')}"`,
      stats.holesPlayed,
      stats.index,
      stats.cleanHoles,
      ...statValues
    ].join(',');
    csvContent += row + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `myfive_golf_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convert a round from the legacy Tiger 5 stats format (flat boolean keys on
// each hole) into the MyFive events format
function migrateLegacyRound(round) {
  if (!Array.isArray(round.holes)) return round;
  const isLegacy = round.holes.length > 0 && round.holes[0].events === undefined;
  if (!isLegacy) return round;

  return {
    ...round,
    trackedStats: [...LEGACY_KEYS],
    holes: round.holes.map(h => {
      const events = {};
      LEGACY_KEYS.forEach(key => {
        events[key] = !!h[key];
      });
      const { holeNumber, par } = h;
      return { holeNumber, par, events };
    })
  };
}

function importJSONData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && Array.isArray(data.rounds)) {
        state.rounds = data.rounds.map(migrateLegacyRound);
        if (data.theme) {
          state.theme = data.theme;
          applyTheme(state.theme);
        }
        if (Array.isArray(data.selectedStats)) {
          const valid = data.selectedStats.filter(id => STATS_BY_ID[id]);
          if (valid.length === TRACK_COUNT) state.selectedStats = valid;
        }
        if (Array.isArray(data.courses)) {
          state.courses = data.courses.filter(c => c && c.name && c.pars);
        } else {
          // Older backups (v2.0 / Tiger 5) have no courses: learn them from the
          // imported rounds, oldest first so the newest pars win
          state.courses = [];
          [...state.rounds]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(learnCourseFromRound);
        }
        saveCourses();
        saveRounds();
        saveSettings();
        alert(`Successfully imported ${data.rounds.length} round records!`);
        renderDashboard();
        showScreen('screen-dashboard');
      } else {
        alert('Invalid backup file. Could not find valid round records.');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing JSON backup file. Please make sure it is a valid backup file.');
    }
  };
  reader.readAsText(file);
}

// --- SETUP SCREEN ---
function prepareSetupScreen() {
  document.getElementById('setup-course').value = '';
  document.getElementById('setup-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('setup-holes').value = '18';

  // Course name suggestions from remembered courses
  const datalist = document.getElementById('course-suggestions');
  datalist.innerHTML = state.courses
    .map(c => `<option value="${c.name.replace(/"/g, '&quot;')}"></option>`)
    .join('');

  // Starting hole selector (1-18)
  const startSelect = document.getElementById('setup-start-hole');
  startSelect.innerHTML = Array.from({ length: 18 }, (_, i) =>
    `<option value="${i + 1}">Hole ${i + 1}</option>`
  ).join('');
  startSelect.value = '1';

  updateCourseHint();
}

function updateCourseHint() {
  const hint = document.getElementById('course-known-hint');
  const course = findCourse(document.getElementById('setup-course').value);
  hint.classList.toggle('hidden', !course);
}

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
  // Load State
  loadState();

  // First launch: pick your five. Otherwise: dashboard.
  if (!state.selectedStats) {
    renderStatPicker({ firstRun: true });
    showScreen('screen-picker');
  } else {
    renderDashboard();
    showScreen('screen-dashboard');
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('[Service Worker] Registered successfully', reg.scope))
        .catch((err) => console.error('[Service Worker] Registration failed', err));
    });
  }

  // Setup view: Date defaults to today
  document.getElementById('setup-date').value = new Date().toISOString().split('T')[0];

  // Show the "known course" hint while typing a course name
  document.getElementById('setup-course').addEventListener('input', updateCourseHint);

  // Bind setup round start button
  document.getElementById('btn-setup-start').addEventListener('click', () => {
    triggerHaptic();
    const course = document.getElementById('setup-course').value;
    const date = document.getElementById('setup-date').value;
    const holes = document.getElementById('setup-holes').value;
    const startHole = document.getElementById('setup-start-hole').value;
    startNewRound(course, date, holes, startHole);
  });

  // Bind setup cancel button
  document.getElementById('btn-setup-cancel').addEventListener('click', () => {
    triggerHaptic();
    showScreen('screen-dashboard');
  });
});
