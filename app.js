/* ============================================================
   RIGOPS — Truck Driver Tool Suite
   app.js — All calculator logic + navigation
   ============================================================ */

// ── Utilities ──────────────────────────────────────────────

const $ = id => document.getElementById(id);
const val = id => parseFloat($(id)?.value) || 0;
const strVal = id => $(id)?.value || '';
const fmt$ = n => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtN = (n, dec = 1) => n.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtLbs = n => fmtN(n, 0) + ' lbs';
const show = id => $(id) && $(id).classList.remove('hidden');
const hide = id => $(id) && $(id).classList.add('hidden');

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

// ── Clock & Date ───────────────────────────────────────────

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  setText('clock', `${h}:${m}:${s}`);
}

function setDateDisplay() {
  const el = $('date-display');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ── Navigation ─────────────────────────────────────────────

function gotoSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const section = $('section-' + sectionId);
  if (section) section.classList.add('active');

  document.querySelectorAll(`.nav-tab[data-section="${sectionId}"]`)
    .forEach(t => t.classList.add('active'));

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNav() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.section;
      if (section) gotoSection(section);
    });
  });
}

// ── FUEL CALCULATOR ────────────────────────────────────────

function calcFuel() {
  const miles = val('fuel-miles');
  const mpg   = val('fuel-mpg');
  const price = val('fuel-price');
  const def   = val('fuel-def');

  if (!miles || !mpg || !price) {
    alert('Please fill in Miles, MPG, and Diesel Price.');
    return;
  }

  const gallons  = miles / mpg;
  const fuelCost = gallons * price;
  const defCost  = def ? miles * def : 0;
  const total    = fuelCost + defCost;

  setText('r-gallons',   fmtN(gallons, 1) + ' gal');
  setText('r-fuel-cost', fmt$(fuelCost));
  setText('r-def-cost',  def ? fmt$(defCost) : 'N/A');
  setText('r-fuel-total', fmt$(total));

  show('fuel-result');

  // Update dashboard
  setText('dash-mpg', fmtN(mpg, 1));
}

function calcMPG() {
  const miles   = val('mpg-miles');
  const gallons = val('mpg-gallons');
  const price   = val('fuel-price');

  if (!miles || !gallons) {
    alert('Please enter Miles Driven and Gallons Used.');
    return;
  }

  const mpg = miles / gallons;
  const cpm = price ? (price / mpg) : null;

  setText('r-mpg', fmtN(mpg, 2) + ' MPG');
  setText('r-cpm', cpm ? fmt$(cpm) + '/mi' : '—');

  const ratingEl = $('mpg-rating');
  if (ratingEl) {
    const pct = Math.min((mpg / 10) * 100, 100);
    const color = mpg >= 7 ? '#22d07a' : mpg >= 5.5 ? '#ffc107' : '#ef4444';
    const label = mpg >= 7 ? 'Excellent efficiency' : mpg >= 5.5 ? 'Average efficiency' : 'Below average — check tires, load, idle time';
    ratingEl.innerHTML = `
      <div class="rating-track"><div class="rating-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="rating-label">${label}</div>
    `;
  }

  show('mpg-result');
  setText('dash-mpg', fmtN(mpg, 2));
}

function calcRange() {
  const tankSize = val('range-tank');
  const level    = val('range-level');
  const mpg      = val('range-mpg');

  if (!tankSize || !level || !mpg) {
    alert('Please fill in all range estimator fields.');
    return;
  }

  const gallonsInTank = tankSize * (level / 100);
  const range         = gallonsInTank * mpg;

  setText('r-tank-gal', fmtN(gallonsInTank, 1) + ' gal');
  setText('r-range',    fmtN(range, 0) + ' mi');
  show('range-result');
}

// ── HOS CALCULATOR ─────────────────────────────────────────

function calcHOS() {
  const driven     = val('hos-driven');
  const onDuty     = val('hos-onduty');
  const cycleLimit = val('hos-cycle');
  const cycleUsed  = val('hos-cycle-used');
  const startTime  = strVal('hos-start');

  if (driven === 0 && onDuty === 0) {
    alert('Please enter hours driven and/or on-duty time.');
    return;
  }

  const driveLeft   = Math.max(0, 11 - driven);
  const totalOnDuty = driven + onDuty;
  const dutyLeft    = Math.max(0, 14 - totalOnDuty);
  const cycleLeft   = Math.max(0, cycleLimit - cycleUsed);
  const effectiveDriveLeft = Math.min(driveLeft, dutyLeft, cycleLeft);

  setText('hos-r-drive', fmtN(effectiveDriveLeft, 1) + ' hrs');
  setText('hos-r-duty',  fmtN(dutyLeft, 1) + ' hrs');
  setText('hos-r-cycle', fmtN(cycleLeft, 1) + ' hrs');

  // Color code drive time
  const driveEl = $('hos-r-drive');
  if (driveEl) {
    driveEl.style.color = effectiveDriveLeft > 4 ? '#22d07a' :
                          effectiveDriveLeft > 1 ? '#ffc107' : '#ef4444';
  }

  // 14-hr window
  if (startTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const windowEnd = new Date();
    windowEnd.setHours(sh + 14, sm, 0, 0);
    const endStr = windowEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setText('hos-r-window', endStr);
  } else {
    setText('hos-r-window', 'Enter start time');
  }

  // Build alerts
  const alertsEl = $('hos-alerts');
  if (alertsEl) {
    const alerts = [];
    if (driven >= 8) alerts.push({ type: 'warn', msg: '⚠ 30-min break required if you drive 8+ hrs without a break' });
    if (effectiveDriveLeft <= 1) alerts.push({ type: 'fail', msg: '🛑 Drive time critically low — plan for 10-hr rest soon' });
    if (cycleLeft <= 5) alerts.push({ type: 'warn', msg: `⚠ Only ${fmtN(cycleLeft, 1)} hrs left in your ${cycleLimit}-hr cycle` });
    if (effectiveDriveLeft > 4) alerts.push({ type: 'ok', msg: '✓ Compliant — adequate drive time remaining' });

    alertsEl.innerHTML = alerts.map(a =>
      `<div class="compliance-item compliance-${a.type === 'ok' ? 'ok' : a.type === 'warn' ? 'warn' : 'fail'}">
        <span>${a.msg}</span>
      </div>`
    ).join('');
  }

  show('hos-result');

  // Update dashboard
  setText('dash-drive', fmtN(effectiveDriveLeft, 1));
}

function calcBreak() {
  const sinceBreak = val('break-since');
  const planned    = val('break-planned');

  if (!sinceBreak) {
    alert('Enter hours since last break.');
    return;
  }

  const statusEl = $('break-status');
  const afterPlanned = sinceBreak + planned;

  let html = '';
  if (sinceBreak >= 8) {
    html = `<div class="compliance-item compliance-fail">
      🛑 BREAK REQUIRED NOW — You have driven ${sinceBreak} hrs since last break (limit: 8 hrs)
    </div>`;
  } else if (afterPlanned > 8) {
    const driveBeforeBreak = 8 - sinceBreak;
    html = `<div class="compliance-item compliance-warn">
      ⚠ You must take a 30-min break after ${fmtN(driveBeforeBreak, 1)} more hours of driving
    </div>`;
  } else {
    html = `<div class="compliance-item compliance-ok">
      ✓ No break required yet — ${fmtN(8 - sinceBreak, 1)} hrs until 8-hr limit
    </div>`;
  }

  if (statusEl) statusEl.innerHTML = html;
  show('break-result');
}

// ── PAY CALCULATOR ─────────────────────────────────────────

function calcPay() {
  const cpm     = val('pay-cpm');
  const loaded  = val('pay-loaded');
  const empty   = val('pay-empty');
  const layover = val('pay-layover');

  if (!cpm || !loaded) {
    alert('Please enter a CPM rate and loaded miles.');
    return;
  }

  const totalMiles = loaded + empty;
  const milePay    = loaded * cpm; // CPM typically applies to loaded miles
  const gross      = milePay + layover;
  const effCpm     = totalMiles > 0 ? gross / totalMiles : 0;

  setText('r-total-miles', fmtN(totalMiles, 0) + ' mi');
  setText('r-mile-pay',    fmt$(milePay));
  setText('r-gross',       fmt$(gross));
  setText('r-eff-cpm',     fmt$(effCpm) + '/mi');

  show('pay-result');
  setText('dash-pay', fmt$(gross));
}

function calcOO() {
  const gross       = val('oo-gross');
  const miles       = val('oo-miles');
  const fuel        = val('oo-fuel');
  const dispatchPct = val('oo-dispatch-pct');
  const insurance   = val('oo-insurance');
  const other       = val('oo-other');

  if (!gross) {
    alert('Please enter gross revenue.');
    return;
  }

  const dispatchFee = gross * (dispatchPct / 100);
  const totalExp    = fuel + dispatchFee + insurance + other;
  const net         = gross - totalExp;
  const margin      = gross > 0 ? (net / gross * 100) : 0;
  const netCpm      = miles > 0 ? net / miles : 0;

  setText('r-expenses', fmt$(totalExp));
  setText('r-net-cpm',  fmt$(netCpm) + '/mi');
  setText('r-net',      fmt$(net));
  setText('r-margin',   fmtN(margin, 1) + '%');

  const netEl = $('r-net');
  if (netEl) netEl.style.color = net >= 0 ? '#22d07a' : '#ef4444';

  show('oo-result');
}

function calcRPM() {
  const rate  = val('rpm-rate');
  const miles = val('rpm-miles');

  if (!rate || !miles) {
    alert('Please enter load rate and miles.');
    return;
  }

  const rpm = rate / miles;

  setText('r-rpm', fmt$(rpm) + '/mi');

  const ratingEl = $('r-rpm-rating');
  if (ratingEl) {
    let rating, color;
    if (rpm >= 3.00)      { rating = '🟢 EXCELLENT'; color = '#22d07a'; }
    else if (rpm >= 2.50) { rating = '🟡 GOOD'; color = '#ffc107'; }
    else if (rpm >= 2.00) { rating = '🟠 FAIR'; color = '#f59e0b'; }
    else if (rpm >= 1.50) { rating = '🔴 BELOW AVERAGE'; color = '#ef4444'; }
    else                  { rating = '⛔ AVOID'; color = '#ef4444'; }

    ratingEl.textContent = rating;
    ratingEl.style.color = color;
  }

  show('rpm-result');
}

// ── LOAD / AXLE CALCULATOR ─────────────────────────────────

function calcAxle() {
  const steer   = val('axle-steer');
  const drive   = val('axle-drive');
  const trailer = val('axle-trailer');
  const tare    = val('axle-tare');

  if (!steer && !drive && !trailer) {
    alert('Please enter at least one axle weight.');
    return;
  }

  const gvw     = steer + drive + trailer;
  const payload = tare > 0 ? Math.max(0, gvw - tare) : null;

  setText('axle-r-gvw',     fmtLbs(gvw));
  setText('axle-r-payload', payload !== null ? fmtLbs(payload) : 'Enter tare weight');

  // Update axle bars
  updateAxleBar('axle-steer-bar',   steer,   20000);
  updateAxleBar('axle-drive-bar',   drive,   34000);
  updateAxleBar('axle-trailer-bar', trailer, 34000);

  // Compliance checks
  const compEl = $('axle-compliance');
  if (compEl) {
    const checks = [
      { label: 'Steer Axle (max 20,000 lbs)',     val: steer,   limit: 20000 },
      { label: 'Drive Tandem (max 34,000 lbs)',    val: drive,   limit: 34000 },
      { label: 'Trailer Tandem (max 34,000 lbs)',  val: trailer, limit: 34000 },
      { label: 'Gross Vehicle Weight (max 80,000 lbs)', val: gvw, limit: 80000 },
    ];

    compEl.innerHTML = checks.filter(c => c.val > 0).map(c => {
      const pct  = c.val / c.limit * 100;
      const over = c.val > c.limit;
      const warn = pct >= 95 && !over;
      const cls  = over ? 'compliance-fail' : warn ? 'compliance-warn' : 'compliance-ok';
      const icon = over ? '🛑' : warn ? '⚠' : '✓';
      return `<div class="compliance-item ${cls}">
        <span class="icon">${icon}</span>
        <span>${c.label}: ${fmtLbs(c.val)} / ${fmtLbs(c.limit)} (${fmtN(pct, 1)}%)</span>
      </div>`;
    }).join('');
  }

  show('axle-result');
  setText('dash-load', fmtN(gvw, 0));
}

function updateAxleBar(id, weight, max) {
  const el = $(id);
  if (!el) return;
  const pct   = Math.min((weight / max) * 100, 100);
  const color = pct >= 100 ? '#ef4444' : pct >= 90 ? '#f59e0b' : '#ffc107';
  el.style.height = pct + '%';
  el.style.background = color;
}

function calcPayload() {
  const tare  = val('payload-tare');
  const limit = val('payload-limit');

  if (!tare) {
    alert('Please enter tare weight.');
    return;
  }

  const maxPayload      = Math.max(0, limit - tare);
  const maxPayloadTons  = maxPayload / 2000;

  setText('r-max-payload',      fmtLbs(maxPayload));
  setText('r-max-payload-tons', fmtN(maxPayloadTons, 2) + ' tons');
  show('payload-result');
}

// ── TRIP CALCULATOR ────────────────────────────────────────

function calcTrip() {
  const miles      = val('trip-miles');
  const speed      = val('trip-speed') || 62;
  const stops      = val('trip-stops') || 0;
  const stopMin    = val('trip-stop-min') || 30;
  const departTime = strVal('trip-depart');

  if (!miles) {
    alert('Please enter total trip miles.');
    return;
  }

  const driveHours = miles / speed;
  const stopHours  = (stops * stopMin) / 60;
  const totalHours = driveHours + stopHours;

  const dh = Math.floor(driveHours);
  const dm = Math.round((driveHours - dh) * 60);
  const th = Math.floor(totalHours);
  const tm = Math.round((totalHours - th) * 60);

  setText('r-drive-time', `${dh}h ${dm}m`);
  setText('r-stop-time',  `${Math.floor(stopHours)}h ${Math.round((stopHours % 1) * 60)}m`);
  setText('r-total-time', `${th}h ${tm}m`);

  if (departTime) {
    const [dh2, dm2] = departTime.split(':').map(Number);
    const arrival = new Date();
    arrival.setHours(dh2, dm2, 0, 0);
    arrival.setMinutes(arrival.getMinutes() + Math.round(totalHours * 60));
    const arrStr = arrival.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dayDiff = Math.floor(totalHours / 24);
    setText('r-arrival', arrStr + (dayDiff >= 1 ? ` (+${dayDiff}d)` : ''));
  } else {
    setText('r-arrival', `~${th}h ${tm}m from departure`);
  }

  // HOS note
  const hosNoteEl = $('trip-hos-note');
  if (hosNoteEl) {
    if (driveHours > 11) {
      const days = Math.ceil(driveHours / 11);
      hosNoteEl.innerHTML = `<div class="compliance-item compliance-warn">
        ⚠ This trip requires ~${days} driving days under HOS 11-hr rule (${fmtN(driveHours, 1)} total drive hrs)
      </div>`;
    } else {
      hosNoteEl.innerHTML = `<div class="compliance-item compliance-ok">
        ✓ Trip fits within a single HOS driving shift (${fmtN(driveHours, 1)} hrs drive time)
      </div>`;
    }
  }

  show('trip-result');
}

function calcTripCost() {
  const miles   = val('cost-miles');
  const mpg     = val('cost-mpg');
  const diesel  = val('cost-diesel');
  const tolls   = val('cost-tolls');
  const scales  = val('cost-scales');
  const misc    = val('cost-misc');

  if (!miles || !mpg || !diesel) {
    alert('Please enter Miles, MPG, and Diesel Price.');
    return;
  }

  const fuelCost  = (miles / mpg) * diesel;
  const fees      = tolls + scales;
  const total     = fuelCost + fees + misc;
  const cpm       = total / miles;

  setText('r-trip-fuel',  fmt$(fuelCost));
  setText('r-trip-fees',  fmt$(fees + misc));
  setText('r-trip-cpm',   fmt$(cpm) + '/mi');
  setText('r-trip-total', fmt$(total));

  show('cost-result');
}

// ── Load Boards ────────────────────────────────────────────

/**
 * handleLoadBoard — called by the Find Better Loads section buttons.
 * Links are placeholder (#) so we show a brief toast notification
 * instead of navigating. Swap href values to real URLs when ready.
 */
function handleLoadBoard(name) {
  const urls = {
    'DAT Load Board':        '#',   // Replace with: https://www.dat.com
    'Truckstop Load Board':  '#',   // Replace with: https://truckstop.com
    'Direct Shipper Freight':'#',   // Replace with: chosen direct-freight platform
  };

  const url = urls[name] || '#';

  // Show toast notification
  showToast(`Opening ${name}…`, 'info');

  // If a real URL is set (not #), open in new tab
  if (url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return false; // prevent default anchor navigation for placeholder links
}

/**
 * showToast — lightweight in-app notification
 * type: 'info' | 'success' | 'warning' | 'error'
 */
function showToast(message, type = 'info') {
  // Remove any existing toast
  const existing = document.getElementById('rigops-toast');
  if (existing) existing.remove();

  const colors = {
    info:    { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)',  text: '#93d8f8' },
    success: { bg: 'rgba(34,208,122,0.12)',  border: 'rgba(34,208,122,0.35)',  text: '#7dffc0' },
    warning: { bg: 'rgba(255,193,7,0.12)',   border: 'rgba(255,193,7,0.35)',   text: '#ffd54f' },
    error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   text: '#fca5a5' },
  };

  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.id = 'rigops-toast';
  toast.textContent = message;

  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '28px',
    right:        '28px',
    zIndex:       '9999',
    background:   c.bg,
    border:       `1px solid ${c.border}`,
    color:        c.text,
    fontFamily:   "'Barlow Condensed', sans-serif",
    fontSize:     '0.85rem',
    fontWeight:   '700',
    letterSpacing:'0.08em',
    textTransform:'uppercase',
    padding:      '12px 20px',
    borderRadius: '8px',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
    opacity:      '0',
    transform:    'translateY(10px)',
    transition:   'opacity 0.2s ease, transform 0.2s ease',
    pointerEvents:'none',
  });

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateY(0)';
    });
  });

  // Animate out after 3s
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// ── Init ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  setDateDisplay();
  updateClock();
  setInterval(updateClock, 1000);

  // Set default departure time to current time
  const tripDepart = $('trip-depart');
  const hosStart   = $('hos-start');
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  if (tripDepart) tripDepart.value = timeStr;
  if (hosStart)   hosStart.value   = timeStr;
});
