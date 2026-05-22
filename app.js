
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayISO() { return toISO(new Date()); }

/** Return the Monday of the week containing `date` */
function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return array of 7 Date objects starting from monday */
function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function fmtFull(date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

// storage 
const STORAGE_KEY = 'quacktrack_v1';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { habits: [], checks: {} };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Streak Logic 
/**
 Calculate current streak for a habit.
 Count consecutive days going backwards from today (inclusive).
  If today is unchecked, streak is 0 unless yesterday starts a backward run.
  We count today if checked, then go back through past days.
 */
function calcStreak(habitId, checks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const key = toISO(cursor);
    if (checks[key] && checks[key][habitId]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // If today is unchecked, still check yesterday
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

// App State 

let data = loadData();
let currentMonday = getMondayOf(new Date());

//Render 

function renderGrid() {
  const today = todayISO();
  const days = weekDays(currentMonday);
  const todayDate = new Date(); todayDate.setHours(0,0,0,0);

  // Week range label
  const last = days[6];
  document.getElementById('weekRange').textContent =
    `${fmt(currentMonday)} – ${fmt(last)}`;
  document.getElementById('toToday').textContent = `Today, ${fmtFull(todayDate)}`;

  // Show/hide empty state vs grid
  const hasHabits = data.habits.length > 0;
  document.getElementById('emptyState').hidden = hasHabits;
  document.getElementById('habitGrid').style.display = hasHabits ? '' : 'none';

  if (!hasHabits) return;

  // ── Header row ──
  const head = document.getElementById('gridHead');
  const headerCells = DAY_NAMES.map((name, i) => {
    const d = days[i];
    const iso = toISO(d);
    const isToday = iso === today;
    return `<th class="${isToday ? 'today-head' : ''}" scope="col">
      <span class="day-num">${fmt(d)}</span>
      <span class="day-name-label">${name}</span>
    </th>`;
  }).join('');

  head.innerHTML = `<tr>
    <th class="col-habit" scope="col">Habit</th>
    ${headerCells}
    <th class="col-streak" scope="col"> Streak</th>
    <th class="col-actions" scope="col"><span class="sr-only">Actions</span></th>
  </tr>`;

  // ── Body rows ──
  const body = document.getElementById('gridBody');
  body.innerHTML = data.habits.map(habit => {
    const cells = days.map((d, i) => {
      const iso = toISO(d);
      const isToday = iso === today;
      const isFuture = d > todayDate;
      const isChecked = !!(data.checks[iso] && data.checks[iso][habit.id]);

      let btnClass = 'check-btn';
      let btnAttr = '';
      let btnContent = '';
      let ariaLabel = '';

      if (isFuture) {
        btnClass += ' future';
        btnAttr = 'disabled aria-disabled="true"';
        ariaLabel = `${DAY_NAMES[i]} – upcoming`;
      } else if (isChecked) {
        btnClass += ' checked';
        btnContent = '✓';
        ariaLabel = `${DAY_NAMES[i]} – done, click to uncheck`;
      } else {
        ariaLabel = `${DAY_NAMES[i]} – not done, click to check`;
      }

      return `<td class="${isToday ? 'today-col' : ''}">
        <button
          class="${btnClass}"
          ${btnAttr}
          data-habit="${habit.id}"
          data-date="${iso}"
          aria-label="${ariaLabel}"
          aria-pressed="${isChecked}"
        >${btnContent}</button>
      </td>`;
    }).join('');

    const streak = calcStreak(habit.id, data.checks);
    const streakBadge = streak > 0
      ? `<span class="streak-badge">🔥 ${streak}</span>`
      : `<span class="streak-badge zero">— 0</span>`;

    const escapedName = escapeHTML(habit.name);

    return `<tr>
      <td class="col-habit">
        <div class="habit-name-wrap">
          <span
            class="habit-name-text"
            role="button"
            tabindex="0"
            title="Click to rename"
            data-rename="${habit.id}"
            aria-label="Rename habit: ${escapedName}"
          >${escapedName}</span>
        </div>
      </td>
      ${cells}
      <td class="col-streak">${streakBadge}</td>
      <td class="col-actions">
        <button
          class="del-btn"
          data-delete="${habit.id}"
          aria-label="Delete habit: ${escapedName}"
          title="Delete habit"
        >✕</button>
      </td>
    </tr>`;
  }).join('');
}

// event delegation 

document.getElementById('gridBody').addEventListener('click', e => {
  // toggle check
  const btn = e.target.closest('.check-btn:not(:disabled)');
  if (btn) {
    const { habit, date } = btn.dataset;
    if (!data.checks[date]) data.checks[date] = {};
    const wasChecked = !!data.checks[date][habit];
    if (wasChecked) {
      delete data.checks[date][habit];
    } else {
      data.checks[date][habit] = true;
      // pop animation
      btn.classList.add('pop');
      btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
    }
    saveData(data);
    render();
    return;
  }

  // delete habit
  const delBtn = e.target.closest('[data-delete]');
  if (delBtn) {
    const id = delBtn.dataset.delete;
    const habit = data.habits.find(h => h.id === id);
    if (habit && confirm(`Delete "${habit.name}"? This also removes all its check history.`)) {
      data.habits = data.habits.filter(h => h.id !== id);
      // remove checks for this habit
      Object.values(data.checks).forEach(day => delete day[id]);
      saveData(data);
      render();
    }
    return;
  }

  // rename (click)
  const nameSpan = e.target.closest('[data-rename]');
  if (nameSpan) {
    openRenameModal(nameSpan.dataset.rename);
    return;
  }
});

//allow enter/space on habit name spans
document.getElementById('gridBody').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const nameSpan = e.target.closest('[data-rename]');
    if (nameSpan) {
      e.preventDefault();
      openRenameModal(nameSpan.dataset.rename);
    }
  }
});

//  Add Habit

function addHabit() {
  const input = document.getElementById('habitInput');
  const name = input.value.trim();
  if (!name) { input.focus(); return; }

  // Duplicate check
  if (data.habits.some(h => h.name.toLowerCase() === name.toLowerCase())) {
    alert('You already have a habit with that name!');
    return;
  }

  data.habits.push({ id: uid(), name, createdAt: new Date().toISOString() });
  saveData(data);
  input.value = '';
  input.focus();
  render();
}

document.getElementById('addBtn').addEventListener('click', addHabit);
document.getElementById('habitInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addHabit();
});

// Week Navigation //
document.getElementById('prevWeek').addEventListener('click', () => {
  currentMonday = new Date(currentMonday);
  currentMonday.setDate(currentMonday.getDate() - 7);
  render();
});

document.getElementById('nextWeek').addEventListener('click', () => {
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const todayMonday = getMondayOf(new Date());
  // Don't allow navigating past the current week
  if (nextMonday > todayMonday) return;
  currentMonday = nextMonday;
  render();
});

document.getElementById('toToday').addEventListener('click', () => {
  currentMonday = getMondayOf(new Date());
  render();
});

// Disable "next week" button when already on current week
function updateNavState() {
  const todayMonday = getMondayOf(new Date());
  const isCurrentWeek = toISO(currentMonday) === toISO(todayMonday);
  document.getElementById('nextWeek').style.opacity = isCurrentWeek ? '0.35' : '1';
  document.getElementById('nextWeek').style.pointerEvents = isCurrentWeek ? 'none' : '';
  document.getElementById('toToday').style.opacity = isCurrentWeek ? '0.35' : '1';
}

function render() {
  renderGrid();
  updateNavState();
}

// Rename Modal 

let renamingId = null;

function openRenameModal(habitId) {
  renamingId = habitId;
  const habit = data.habits.find(h => h.id === habitId);
  if (!habit) return;
  const input = document.getElementById('renameInput');
  input.value = habit.name;
  document.getElementById('modalOverlay').hidden = false;
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

function closeModal() {
  document.getElementById('modalOverlay').hidden = true;
  renamingId = null;
}

function saveRename() {
  const input = document.getElementById('renameInput');
  const name = input.value.trim();
  if (!name || !renamingId) return;
  if (data.habits.some(h => h.id !== renamingId && h.name.toLowerCase() === name.toLowerCase())) {
    alert('Another habit already has that name!');
    return;
  }
  const habit = data.habits.find(h => h.id === renamingId);
  if (habit) { habit.name = name; saveData(data); render(); }
  closeModal();
}

document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalSave').addEventListener('click', saveRename);
document.getElementById('renameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveRename();
  if (e.key === 'Escape') closeModal();
});
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// Init

render();
