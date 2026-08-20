<div align="center">

# 🇮🇳 TaxCalc India

### The most detailed Indian Income Tax Calculator for FY 2025-26

**Compare Old Regime vs New Regime · Every deduction covered · Smart recommendation**

---

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frubanbalaji-g%2FTaxCalc&project-name=taxcalc-india&repository-name=TaxCalc)
&nbsp;&nbsp;
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rubanbalaji-g/TaxCalc)

</div>

---

## ✨ Features

- **Side-by-side comparison** of Old Regime vs New Regime
- **Smart recommendation** — instantly tells you which regime saves you more
- **Slab-wise tax breakdown** for both regimes
- **Visual bar chart** powered by Chart.js
- **Monthly in-hand salary estimate**
- **Surcharge** calculation for high-income earners (>₹50L)
- **Rebate u/s 87A** automatically applied for both regimes
- **Complete in-app Deductions Guide** for reference

### 📋 Every Deduction Covered

| Section | Description | Limit |
|---|---|---|
| 80C / 80CCC / 80CCD(1) | EPF, PPF, ELSS, LIC, NSC, FD, SSY, SCSS, Tuition, Stamp Duty | ₹1,50,000 |
| 80CCD(1B) | Additional NPS contribution | ₹50,000 |
| 80CCD(2) | Employer NPS contribution (**New Regime too**) | 10% of basic |
| 80D | Health Insurance – self, family & parents (senior citizen limits) | ₹25K–₹1L |
| 80DD | Disabled dependent | ₹75K / ₹1.25L |
| 80DDB | Specified disease treatment | ₹40K / ₹1L |
| 80U | Self disability | ₹75K / ₹1.25L |
| 24(b) | Home loan interest (self-occupied) | ₹2,00,000 |
| 80EE | First-time home buyer extra interest | ₹50,000 |
| 80EEA | Affordable housing extra interest | ₹1,50,000 |
| 80EEB | Electric Vehicle loan interest | ₹1,50,000 |
| 80E | Education loan interest | No limit (8 yrs) |
| 80G / 80GGA | Donations (100% & 50% qualifying) | 10% of GTI |
| 80GG | House rent (if no HRA in salary) | ₹5,000/month |
| 80TTA / 80TTB | Savings account interest / Senior citizen interest | ₹10K / ₹50K |
| HRA [Sec 10(13A)] | House Rent Allowance exemption (metro/non-metro) | Least of 3 criteria |
| LTA [Sec 10(5)] | Leave Travel Allowance (2 journeys/4-yr block) | Actual cost |
| Standard Deduction | Flat deduction for salaried employees | ₹50K (Old) / ₹75K (New) |
| Professional Tax [Sec 16(iii)] | Professional tax paid | ₹2,500 |
| Gratuity | Gratuity exemption | ₹20,00,000 |

---

## 🚀 Deployment

### Option 1 — One-Click Deploy (Recommended)

Click either button at the top of this README to deploy instantly with zero config:

- **Vercel** → click [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frubanbalaji-g%2FTaxCalc&project-name=taxcalc-india&repository-name=TaxCalc)
- **Netlify** → click [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rubanbalaji-g/TaxCalc)

Both buttons will:
1. Fork this repo into your account
2. Auto-detect the static site (no build step needed)
3. Give you a live URL in under 60 seconds

---

### Option 2 — Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project
cd taxcalc

# Deploy (follow prompts on first run)
vercel

# Deploy to production
vercel --prod
```

Your site will be live at `https://taxcalc-india.vercel.app` (or your custom URL).

---

### Option 3 — Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to project
cd taxcalc

# Deploy a preview
netlify deploy --dir .

# Deploy to production
netlify deploy --prod --dir .
```

---

### Option 4 — Netlify Drag & Drop (Fastest!)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the entire `taxcalc` folder onto the page
3. 🎉 Done — you'll get a live URL instantly

---

### Option 5 — GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Set source to **Deploy from a branch** → `main` → `/ (root)`
3. Click **Save** — live at `https://rubanbalaji-g.github.io/taxcalc`

---

### Run Locally

```bash
# Clone the repo
git clone https://github.com/rubanbalaji-g/TaxCalc.git
cd taxcalc

# Serve locally (uses npx, no install needed)
npx serve . -p 3000

# Open in browser
# http://localhost:3000
```

> **No build step, no Node.js dependencies** — it's pure HTML/CSS/JS. Any static file server works.

---

## 📊 Tax Slabs Used (FY 2025-26 / AY 2026-27)

### New Regime

| Taxable Income | Rate |
|---|---|
| Up to ₹4,00,000 | NIL |
| ₹4,00,001 – ₹8,00,000 | 5% |
| ₹8,00,001 – ₹12,00,000 | 10% |
| ₹12,00,001 – ₹16,00,000 | 15% |
| ₹16,00,001 – ₹20,00,000 | 20% |
| ₹20,00,001 – ₹24,00,000 | 25% |
| Above ₹24,00,000 | 30% |

> 🎁 **Rebate u/s 87A**: Zero tax if taxable income ≤ ₹12,00,000 · Standard deduction ₹75,000

### Old Regime

| Taxable Income | Rate |
|---|---|
| Up to ₹2,50,000 | NIL |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

> 🎁 **Rebate u/s 87A**: Zero tax if taxable income ≤ ₹5,00,000 · Standard deduction ₹50,000

### Surcharge (both regimes)

| Total Income | Surcharge |
|---|---|
| ₹50L – ₹1Cr | 10% |
| ₹1Cr – ₹2Cr | 15% |
| ₹2Cr – ₹5Cr | 25% |
| Above ₹5Cr | 37% (Old) / 25% (New, capped) |

**Health & Education Cess: 4%** on (tax + surcharge)

---

## 🗂️ Project Structure

```
taxcalc/
├── index.html      # Main app — all UI & sections
├── styles.css      # Dark glassmorphism design system
├── app.js          # Tax engine + Chart.js rendering
├── vercel.json     # Vercel deployment config
├── netlify.toml    # Netlify deployment config
├── package.json    # Local dev server script
└── README.md       # This file
```

---

## ⚠️ Disclaimer

This calculator is for **illustrative and educational purposes only** based on publicly available FY 2025-26 tax laws. Tax laws are subject to change. Always consult a **Chartered Accountant** or tax professional for accurate tax filing and planning.

---

<div align="center">
  Made for Indian taxpayers · FY 2025-26 · AY 2026-27
</div>
