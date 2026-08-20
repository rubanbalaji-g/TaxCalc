/* ===================================================
   TaxCalc India - app.js
   FY 2025-26 Tax Calculator Engine
   Old Regime vs New Regime Comparison
   =================================================== */

'use strict';

// ─── TAX CONSTANTS ──────────────────────────────────────────────────────────

const TAX_YEAR = 'FY 2025-26';

// New Regime Slabs (Finance Act 2025 - effective FY 2025-26)
const NEW_REGIME_SLABS = [
  { from: 0,         to: 400000,   rate: 0.00, label: 'Up to ₹4,00,000'            },
  { from: 400000,    to: 800000,   rate: 0.05, label: '₹4,00,001 – ₹8,00,000'      },
  { from: 800000,    to: 1200000,  rate: 0.10, label: '₹8,00,001 – ₹12,00,000'     },
  { from: 1200000,   to: 1600000,  rate: 0.15, label: '₹12,00,001 – ₹16,00,000'    },
  { from: 1600000,   to: 2000000,  rate: 0.20, label: '₹16,00,001 – ₹20,00,000'    },
  { from: 2000000,   to: 2400000,  rate: 0.25, label: '₹20,00,001 – ₹24,00,000'    },
  { from: 2400000,   to: Infinity, rate: 0.30, label: 'Above ₹24,00,000'           },
];

// Old Regime Slabs
const OLD_REGIME_SLABS = [
  { from: 0,        to: 250000,   rate: 0.00, label: 'Up to ₹2,50,000'            },
  { from: 250000,   to: 500000,   rate: 0.05, label: '₹2,50,001 – ₹5,00,000'      },
  { from: 500000,   to: 1000000,  rate: 0.20, label: '₹5,00,001 – ₹10,00,000'     },
  { from: 1000000,  to: Infinity, rate: 0.30, label: 'Above ₹10,00,000'           },
];

// Surcharge rates (same for both regimes)
const SURCHARGE_SLABS = [
  { threshold: 5000000,  rate: 0.10 },
  { threshold: 10000000, rate: 0.15 },
  { threshold: 20000000, rate: 0.25 },
  { threshold: 50000000, rate: 0.37 }, // old regime; new regime caps at 0.25
];

const CESS_RATE          = 0.04;
const OLD_STD_DEDUCTION  = 50000;
const NEW_STD_DEDUCTION  = 75000;
const SEC80C_LIMIT       = 150000;
const NPS_80CCD1B_LIMIT  = 50000;
const MAX_87A_OLD        = 12500;  // tax rebate old regime (income ≤ 5L)
const MAX_87A_NEW        = 60000;  // tax rebate new regime (income ≤ 12L)
const REBATE_LIMIT_OLD   = 500000;
const REBATE_LIMIT_NEW   = 1200000;

// HRA city percentages
const HRA_PCT = { metro: 0.50, 'non-metro': 0.40 };

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const getVal = (id) => parseFloat(document.getElementById(id)?.value) || 0;
const getBool = (id) => document.getElementById(id)?.checked || false;
const getSelect = (id) => document.getElementById(id)?.value || '';

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

// ─── SLAB CALCULATOR ────────────────────────────────────────────────────────

/**
 * Calculate tax using progressive slabs.
 * Returns { total, breakdown: [{label, rate, taxable, tax}] }
 */
function calcSlabTax(income, slabs) {
  let total = 0;
  const breakdown = [];
  for (const slab of slabs) {
    if (income <= slab.from) break;
    const taxable = Math.min(income, slab.to === Infinity ? income : slab.to) - slab.from;
    const tax     = taxable * slab.rate;
    total        += tax;
    breakdown.push({ label: slab.label, rate: slab.rate, taxable, tax });
  }
  return { total, breakdown };
}

/**
 * Calculate surcharge based on total income and regime.
 * New regime caps surcharge at 25% for income above ₹2 crore.
 */
function calcSurcharge(income, baseTax, isNewRegime) {
  let rate = 0;
  if (income > 50000000) {
    rate = isNewRegime ? 0.25 : 0.37;
  } else if (income > 20000000) {
    rate = 0.25;
  } else if (income > 10000000) {
    rate = 0.15;
  } else if (income > 5000000) {
    rate = 0.10;
  }
  return baseTax * rate;
}

/**
 * Apply marginal relief for surcharge.
 * Ensures tax increase ≤ income increase above threshold.
 */
function applySurchargeRelief(income, baseTax, surcharge, threshold) {
  if (income <= threshold) return surcharge;
  const taxAtThreshold = calcSlabTax(threshold, OLD_REGIME_SLABS).total;
  const maxTax = taxAtThreshold + (income - threshold);
  const totalWithSurcharge = baseTax + surcharge;
  return totalWithSurcharge > maxTax ? Math.max(0, maxTax - baseTax) : surcharge;
}

// ─── HRA EXEMPTION ──────────────────────────────────────────────────────────

function calcHRAExemption(basic, hraReceived, rentPaid, cityType) {
  if (!rentPaid || !hraReceived) return 0;
  const pct  = HRA_PCT[cityType] || 0.40;
  const e1   = hraReceived;             // Actual HRA received
  const e2   = rentPaid - 0.10 * basic; // Rent paid - 10% of basic
  const e3   = pct * basic;             // % of basic
  return Math.max(0, Math.min(e1, e2, e3));
}

// ─── 80D LIMIT ──────────────────────────────────────────────────────────────

function calc80D(mediclaim, mediclaimParents, preventive, isSenior, parentsSenior) {
  const selfLimit   = isSenior ? 50000 : 25000;
  const parentLimit = parentsSenior ? 50000 : 25000;
  const selfDed     = clamp(mediclaim + preventive, 0, selfLimit);
  const parentDed   = clamp(mediclaimParents, 0, parentLimit);
  return selfDed + parentDed;
}

// ─── 80DDB LIMIT ────────────────────────────────────────────────────────────

function calc80DDB(amount, isSenior) {
  return clamp(amount, 0, isSenior ? 100000 : 40000);
}

// ─── 80TTA / TTB ────────────────────────────────────────────────────────────

function calc80TTATTB(tta, ttb, isSenior) {
  if (isSenior) return clamp(ttb, 0, 50000);
  return clamp(tta, 0, 10000);
}

// ─── MAIN CALCULATION ───────────────────────────────────────────────────────

function calculateTax() {
  // ── Collect inputs ──
  const basic          = getVal('basicSalary');
  const hraReceived    = getVal('hra');
  const specialAllow   = getVal('specialAllowance');
  const ltaReceived    = getVal('lta');
  const bonus          = getVal('bonus');
  const otherIncome    = getVal('otherIncome');
  const employerPF     = getVal('employerPF');
  const employerNPS    = getVal('employerNPS');

  const rentPaid       = getVal('rentPaid');
  const cityType       = getSelect('cityType');
  const ltaClaimed     = getVal('ltaClaimed');
  const profTax        = Math.min(getVal('profTax'), 2500);
  const gratuity       = Math.min(getVal('gratuity'), 2000000);

  // 80C family
  const epf            = getVal('epf');
  const ppf            = getVal('ppf');
  const elss           = getVal('elss');
  const lic            = getVal('lic');
  const nsc            = getVal('nsc');
  const taxfd          = getVal('taxfd');
  const homeLoanPr     = getVal('homeLoanPrincipal');
  const ssy            = getVal('ssy');
  const scss           = getVal('scss');
  const tuitionFee     = getVal('tuitionFee');
  const stampDuty      = getVal('stampDuty');
  const pension80ccc   = getVal('pension80ccc');
  const nps80ccd1      = getVal('nps80ccd1');

  const raw80C         = epf + ppf + elss + lic + nsc + taxfd + homeLoanPr +
                         ssy + scss + tuitionFee + stampDuty + pension80ccc + nps80ccd1;
  const sec80C         = Math.min(raw80C, SEC80C_LIMIT);

  // NPS extra
  const nps80ccd1b     = Math.min(getVal('nps80ccd1b'), NPS_80CCD1B_LIMIT);

  // 80D
  const isSenior       = getBool('isSeniorCitizen');
  const parentsSenior  = getBool('parentsAreSenior');
  const sec80D         = calc80D(
    getVal('mediclaim'), getVal('mediclaimParents'),
    getVal('preventiveHealth'), isSenior, parentsSenior
  );

  // Disability
  const sec80DD        = parseInt(getSelect('disabled80dd')) || 0;
  const sec80DDB       = calc80DDB(getVal('disease80ddb'), isSenior);
  const sec80U         = parseInt(getSelect('selfDisabled80u')) || 0;

  // Home loan
  const homeLoanInt    = Math.min(getVal('homeLoanInterest'), 200000);
  const hl80ee         = Math.min(getVal('homeLoan80ee'), 50000);
  const hl80eea        = Math.min(getVal('homeLoan80eea'), 150000);
  const ev80eeb        = Math.min(getVal('evLoan80eeb'), 150000);

  // Education & donations
  const sec80E         = getVal('educationLoan');
  const sec80G100      = getVal('donation100');
  const sec80G50       = getVal('donation50') * 0.5;
  const sec80GGA       = getVal('donation80gga');
  const sec80GG        = getVal('rent80gg');

  // Interest
  const sec80TTATTB    = calc80TTATTB(
    getVal('savingsInterest80tta'), getVal('interest80ttb'), isSenior
  );

  // Employer NPS (80CCD2) - allowed in new regime too
  const employerNPSDed = Math.min(employerNPS, basic * 0.10);

  // ─── OLD REGIME COMPUTATION ──────────────────────────────────────

  // Gross salary
  const grossSalaryOld = basic + hraReceived + specialAllow + ltaReceived + bonus;
  const grossTotal     = grossSalaryOld + otherIncome;

  // HRA exemption
  const hraExemption   = calcHRAExemption(basic, hraReceived, rentPaid, cityType);
  // LTA exemption (capped at LTA received)
  const ltaExemption   = Math.min(ltaClaimed, ltaReceived);

  // Standard deduction (old regime)
  const stdDeductOld   = Math.min(OLD_STD_DEDUCTION, grossSalaryOld);

  // Build deduction list for old regime
  const deductionsOld = {
    'Standard Deduction [Sec 16(ia)]': stdDeductOld,
    'HRA Exemption [Sec 10(13A)]': hraExemption,
    'LTA Exemption [Sec 10(5)]': ltaExemption,
    'Professional Tax [Sec 16(iii)]': profTax,
    'Section 80C / 80CCC / 80CCD(1)': sec80C,
    'Section 80CCD(1B) – NPS': nps80ccd1b,
    'Section 80CCD(2) – Employer NPS': employerNPSDed,
    'Section 80D – Health Insurance': sec80D,
    'Section 80DD – Disabled Dependent': sec80DD,
    'Section 80DDB – Specified Disease': sec80DDB,
    'Section 80U – Self Disability': sec80U,
    'Section 24(b) – Home Loan Interest': homeLoanInt,
    'Section 80EE – First Home Loan': hl80ee,
    'Section 80EEA – Affordable Housing': hl80eea,
    'Section 80EEB – EV Loan Interest': ev80eeb,
    'Section 80E – Education Loan': sec80E,
    'Section 80G – Donations (100%)': sec80G100,
    'Section 80G – Donations (50%)': sec80G50,
    'Section 80GGA – Research Donations': sec80GGA,
    'Section 80GG – House Rent (No HRA)': sec80GG,
    'Section 80TTA/TTB – Interest': sec80TTATTB,
    'Gratuity Exemption': gratuity,
  };

  const totalDeductOld = Object.values(deductionsOld).reduce((a, b) => a + b, 0);
  const taxableOld     = Math.max(0, grossTotal - totalDeductOld);

  // Slab tax
  const { total: baseTaxOld, breakdown: slabBkOld } = calcSlabTax(taxableOld, OLD_REGIME_SLABS);
  const surchargeOld  = calcSurcharge(taxableOld, baseTaxOld, false);
  const taxWithSurOld = baseTaxOld + surchargeOld;
  const cessOld       = taxWithSurOld * CESS_RATE;

  // Rebate 87A
  const rebateOld     = taxableOld <= REBATE_LIMIT_OLD ? Math.min(baseTaxOld, MAX_87A_OLD) : 0;
  const finalTaxOld   = Math.max(0, taxWithSurOld + cessOld - rebateOld);

  // ─── NEW REGIME COMPUTATION ──────────────────────────────────────

  // Gross = all salary components + other income (employer NPS excluded as it's deducted)
  const grossNew       = basic + hraReceived + specialAllow + ltaReceived + bonus + otherIncome;

  // Deductions in new regime
  const stdDeductNew   = Math.min(NEW_STD_DEDUCTION, basic + hraReceived + specialAllow + ltaReceived + bonus);
  const taxableNew     = Math.max(0, grossNew - stdDeductNew - employerNPSDed);

  // Slab tax
  const { total: baseTaxNew, breakdown: slabBkNew } = calcSlabTax(taxableNew, NEW_REGIME_SLABS);
  const surchargeNew   = calcSurcharge(taxableNew, baseTaxNew, true);
  const taxWithSurNew  = baseTaxNew + surchargeNew;
  const cessNew        = taxWithSurNew * CESS_RATE;

  // Rebate 87A – new regime: full tax rebate if income ≤ 12L (after std deduction)
  // For taxable income ≤ 12L → no tax
  const rebateNew      = taxableNew <= REBATE_LIMIT_NEW ? Math.min(baseTaxNew, MAX_87A_NEW) : 0;
  const finalTaxNew    = Math.max(0, taxWithSurNew + cessNew - rebateNew);

  // ─── RENDER RESULTS ──────────────────────────────────────────────

  renderResults({
    // Old
    grossTotal, totalDeductOld, taxableOld, baseTaxOld, surchargeOld,
    cessOld: taxWithSurOld * CESS_RATE, rebateOld, finalTaxOld,
    slabBkOld, deductionsOld,
    // New
    grossNew, stdDeductNew, employerNPSDed, taxableNew, baseTaxNew,
    surchargeNew, cessNew: taxWithSurNew * CESS_RATE, rebateNew, finalTaxNew,
    slabBkNew,
  });
}

// ─── RENDER ─────────────────────────────────────────────────────────────────

let chartInstance = null;

function renderResults(d) {
  const sect = document.getElementById('comparison');
  sect.style.display = 'block';

  // Smooth scroll
  setTimeout(() => sect.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  const effectiveOld = d.grossTotal > 0 ? ((d.finalTaxOld / d.grossTotal) * 100).toFixed(2) : 0;
  const effectiveNew = d.grossNew   > 0 ? ((d.finalTaxNew / d.grossNew)   * 100).toFixed(2) : 0;

  // ── Old card ──
  setText('oldTaxDisplay',      fmt(d.finalTaxOld));
  setText('oldGrossIncome',     fmt(d.grossTotal));
  setText('oldTotalDeductions', `-${fmt(d.totalDeductOld)}`);
  setText('oldTaxableIncome',   fmt(d.taxableOld));
  setText('oldTaxBeforeCess',   fmt(d.baseTaxOld));
  setText('oldSurcharge',       fmt(d.surchargeOld));
  setText('oldCess',            fmt(d.cessOld));
  setText('oldRebate',          d.rebateOld > 0 ? `-${fmt(d.rebateOld)}` : '₹0');
  setText('oldFinalTax',        fmt(d.finalTaxOld));
  setText('oldEffectiveRate',   `${effectiveOld}%`);

  // ── New card ──
  setText('newTaxDisplay',      fmt(d.finalTaxNew));
  setText('newGrossIncome',     fmt(d.grossNew));
  setText('newStdDeduction',    `-${fmt(d.stdDeductNew)}`);
  setText('newEmployerNPS',     d.employerNPSDed > 0 ? `-${fmt(d.employerNPSDed)}` : '₹0');
  setText('newTaxableIncome',   fmt(d.taxableNew));
  setText('newTaxBeforeCess',   fmt(d.baseTaxNew));
  setText('newSurcharge',       fmt(d.surchargeNew));
  setText('newCess',            fmt(d.cessNew));
  setText('newRebate',          d.rebateNew > 0 ? `-${fmt(d.rebateNew)}` : '₹0');
  setText('newFinalTax',        fmt(d.finalTaxNew));
  setText('newEffectiveRate',   `${effectiveNew}%`);

  // ── Recommendation ──
  const diff   = d.finalTaxNew - d.finalTaxOld;
  const banner = document.getElementById('recommendationBanner');
  if (Math.abs(diff) < 500) {
    banner.className = 'recommendation-banner tie';
    banner.innerHTML = `<span class="banner-icon">⚖️</span>
      <div class="banner-text">
        <strong>Both Regimes are nearly identical for you!</strong>
        <div class="banner-saving">Difference of ${fmt(Math.abs(diff))} — consider future investment plans to decide.</div>
      </div>`;
  } else if (d.finalTaxOld < d.finalTaxNew) {
    banner.className = 'recommendation-banner old-wins';
    banner.innerHTML = `<span class="banner-icon">📜</span>
      <div class="banner-text">
        <strong>Old Tax Regime is better for you!</strong>
        <div class="banner-saving">You save ${fmt(diff)} annually by choosing Old Regime (thanks to your deductions).</div>
      </div>`;
  } else {
    banner.className = 'recommendation-banner new-wins';
    banner.innerHTML = `<span class="banner-icon">✨</span>
      <div class="banner-text">
        <strong>New Tax Regime is better for you!</strong>
        <div class="banner-saving">You save ${fmt(Math.abs(diff))} annually by choosing New Regime (lower slab rates).</div>
      </div>`;
  }

  // ── Savings banner ──
  const savBanner = document.getElementById('savingsBanner');
  const saving    = Math.abs(d.finalTaxOld - d.finalTaxNew);
  const better    = d.finalTaxOld < d.finalTaxNew ? 'Old' : 'New';
  savBanner.innerHTML = `Potential annual savings by choosing the right regime: <strong>${fmt(saving)}</strong> → Choose <strong>${better} Regime</strong>`;

  // ── Slab breakdown ──
  renderSlabs('oldSlabBody', d.slabBkOld, d.taxableOld, OLD_REGIME_SLABS);
  renderSlabs('newSlabBody', d.slabBkNew, d.taxableNew, NEW_REGIME_SLABS);

  // ── Deductions used ──
  renderDeductionsUsed(d.deductionsOld);

  // ── Chart ──
  renderChart(d);

  // ── Monthly in-hand ──
  const monthlyOld = Math.round((d.grossTotal - d.finalTaxOld) / 12);
  const monthlyNew = Math.round((d.grossNew   - d.finalTaxNew) / 12);
  setText('oldMonthly', `${fmt(monthlyOld)} / month`);
  setText('newMonthly', `${fmt(monthlyNew)} / month`);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderSlabs(tbodyId, breakdown, taxableIncome, slabs) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = '';
  slabs.forEach((slab, i) => {
    const bk   = breakdown[i];
    const taxable = bk ? bk.taxable : 0;
    const tax     = bk ? bk.tax     : 0;
    const isActive = taxable > 0;
    const tr = document.createElement('tr');
    if (isActive) tr.className = 'active-slab';
    tr.innerHTML = `
      <td>${slab.label}</td>
      <td>${(slab.rate * 100).toFixed(0)}%</td>
      <td>${isActive ? fmt(tax) : '–'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDeductionsUsed(deductions) {
  const container = document.getElementById('deductionsUsedList');
  if (!container) return;
  container.innerHTML = '';
  const entries = Object.entries(deductions).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No deductions applied — consider investments to reduce taxable income!</p>';
    return;
  }
  entries.forEach(([name, amount]) => {
    const parts = name.split(' – ');
    const sectionPart = parts[0];
    const descPart    = parts[1] || '';
    const chip = document.createElement('div');
    chip.className = 'deduction-chip';
    chip.innerHTML = `
      <span class="chip-section">${sectionPart}</span>
      <span class="chip-name">${descPart || sectionPart}</span>
      <span class="chip-amount">${fmt(amount)}</span>
    `;
    container.appendChild(chip);
  });
}

function renderChart(d) {
  const ctx = document.getElementById('taxChart').getContext('2d');
  if (chartInstance) { chartInstance.destroy(); }

  const labels = [
    'Gross Income', 'Deductions', 'Taxable Income',
    'Base Tax', 'Cess', 'Net Tax'
  ];
  const oldData = [
    d.grossTotal, d.totalDeductOld, d.taxableOld,
    d.baseTaxOld, d.cessOld, d.finalTaxOld
  ];
  const newData = [
    d.grossNew, d.stdDeductNew + d.employerNPSDed, d.taxableNew,
    d.baseTaxNew, d.cessNew, d.finalTaxNew
  ];

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Old Regime',
          data: oldData,
          backgroundColor: 'rgba(224, 82, 82, 0.7)',
          borderColor: '#e05252',
          borderWidth: 1.5,
          borderRadius: 6,
        },
        {
          label: 'New Regime',
          data: newData,
          backgroundColor: 'rgba(56, 189, 248, 0.7)',
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#8892a4', font: { family: 'Inter', size: 12 } }
        },
        tooltip: {
          backgroundColor: '#0f1218',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8892a4',
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#4a5568', font: { family: 'Inter', size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: {
            color: '#4a5568', font: { family: 'JetBrains Mono', size: 10 },
            callback: (v) => '₹' + (v >= 100000 ? (v / 100000).toFixed(0) + 'L' : v.toLocaleString('en-IN')),
          },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });
}

// ─── 80C LIVE METER ─────────────────────────────────────────────────────────

function update80CMeter() {
  const inputs = document.querySelectorAll('[data-80c]');
  let total = 0;
  inputs.forEach((inp) => { total += parseFloat(inp.value) || 0; });
  const clamped = Math.min(total, SEC80C_LIMIT);
  const pct     = Math.min((total / SEC80C_LIMIT) * 100, 100);

  const label = document.getElementById('sec80cTotal');
  const bar   = document.getElementById('sec80cBar');
  if (label) label.textContent = fmt(clamped) + (total > SEC80C_LIMIT ? ' (capped)' : '');
  if (bar) {
    bar.style.width = `${pct}%`;
    bar.style.background = pct >= 100
      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
      : 'linear-gradient(90deg, var(--new-primary), var(--purple))';
  }
}

// Attach listeners to all 80C fields
document.querySelectorAll('[data-80c]').forEach((inp) => {
  inp.addEventListener('input', update80CMeter);
});

// ─── GUIDE TABS ─────────────────────────────────────────────────────────────

function switchTab(regime) {
  const oldContent = document.getElementById('tabContentOld');
  const newContent = document.getElementById('tabContentNew');
  const oldBtn     = document.getElementById('tabOld');
  const newBtn     = document.getElementById('tabNew');

  if (regime === 'old') {
    oldContent.style.display = 'block';
    newContent.style.display = 'none';
    oldBtn.classList.add('active');
    newBtn.classList.remove('active');
  } else {
    oldContent.style.display = 'none';
    newContent.style.display = 'block';
    newBtn.classList.add('active');
    oldBtn.classList.remove('active');
  }
}

// ─── RESET ───────────────────────────────────────────────────────────────────

function resetForm() {
  document.querySelectorAll('input[type="number"]').forEach((inp) => { inp.value = ''; });
  document.querySelectorAll('input[type="checkbox"]').forEach((inp) => { inp.checked = false; });
  document.querySelectorAll('select').forEach((sel) => { sel.selectedIndex = 0; });
  document.getElementById('comparison').style.display = 'none';
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  update80CMeter();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── SAMPLE DATA (for demo) ──────────────────────────────────────────────────

function loadSampleData() {
  const sample = {
    basicSalary: 800000, hra: 200000, specialAllowance: 150000,
    lta: 50000, bonus: 100000, otherIncome: 50000,
    employerPF: 72000, employerNPS: 60000,
    rentPaid: 216000, ltaClaimed: 40000, profTax: 2400,
    epf: 72000, ppf: 50000, elss: 28000, mediclaim: 25000,
    mediclaimParents: 25000, homeLoanInterest: 150000,
    homeLoanPrincipal: 50000, educationLoan: 30000,
    nps80ccd1b: 50000, savingsInterest80tta: 10000,
  };
  Object.entries(sample).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  update80CMeter();
}

// ─── KEYBOARD SHORTCUT ──────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') calculateTax();
});

// ─── INIT ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  update80CMeter();
  // Animate hero stats on load
  document.querySelectorAll('.stat-pill').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 200 + i * 80);
  });
});
