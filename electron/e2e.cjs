const assert = require('assert');
const fs = require('fs');
const path = require('path');

/**
 * Full End-to-End (E2E) test runner executed inside the real Electron BrowserWindow.
 * Drives the actual React DOM, IPC bridge, and atomic local persistence across all tabs.
 */
async function runElectronE2E(win, storePath) {
  const exec = (code) => win.webContents.executeJavaScript(code, true);

  console.log('[E2E] 1/9 Verifying startup lands on current calendar month...');
  const now = new Date();
  const expectedMonthLabel = now.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const selectedMonthText = await exec(`
    (() => {
      const sel = document.querySelector('header select');
      return sel ? sel.options[sel.selectedIndex].text : '';
    })()
  `);
  assert.strictEqual(
    selectedMonthText,
    expectedMonthLabel,
    `Expected startup month "${expectedMonthLabel}", got "${selectedMonthText}"`
  );

  console.log('[E2E] 2/9 Clearing demo data to start with a blank sheet...');
  await exec(`
    (() => {
      const btn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Clear Demo'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 120));

  console.log('[E2E] 3/9 Entering Monthly Salary (1000) in Row 1...');
  await exec(`
    (() => {
      const input = document.querySelector('input[placeholder="Type salary..."]');
      if (!input) throw new Error('Salary input not found');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '1000');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()
  `);
  await new Promise((r) => setTimeout(r, 120));

  console.log('[E2E] 4/9 Adding Extra Income (+200) and negative Salary Cut (-100) via "+" button...');
  await exec(`
    (() => {
      const amtInput = document.querySelector('input[placeholder="+50 or -30"]');
      if (!amtInput) throw new Error('Extra income/cut amount input not found');
      const addBtn = amtInput.closest('tr').querySelector('button');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      // Add +200 without typing a label
      setter.call(amtInput, '200');
      amtInput.dispatchEvent(new Event('input', { bubbles: true }));
      amtInput.dispatchEvent(new Event('change', { bubbles: true }));
      addBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 100));

  await exec(`
    (() => {
      const amtInput = document.querySelector('input[placeholder="+50 or -30"]');
      const addBtn = amtInput.closest('tr').querySelector('button');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      // Add -100 salary cut without typing a label
      setter.call(amtInput, '-100');
      amtInput.dispatchEvent(new Event('input', { bubbles: true }));
      amtInput.dispatchEvent(new Event('change', { bubbles: true }));
      addBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 120));

  const incomeCheck = await exec(`document.body.innerText`);
  assert(
    incomeCheck.includes('1,100.00'),
    'Expected Net Income to equal 1,100.00 after 1000 salary + 200 extra - 100 cut'
  );

  console.log('[E2E] 5/9 Verifying dynamic budget splits & hard 100% split ceiling...');
  // Lower Savings/Debt (3rd bucket) from 20% to 10%, then add 4th bucket requesting 25% -> must clamp to 10%!
  const splitResult = await exec(`
    (() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const pctInputs = Array.from(document.querySelectorAll('input[title^="Max allowed right now"]'));
      if (pctInputs.length < 3) throw new Error('Expected 3 default bucket % inputs');

      // Try setting Mandatory (1st) to 95% while others are 30% + 20% = 50% -> must clamp to 50%
      setter.call(pctInputs[0], '95');
      pctInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      pctInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

      // Lower 3rd bucket (Savings) from 20% to 10%
      setter.call(pctInputs[2], '10');
      pctInputs[2].dispatchEvent(new Event('input', { bubbles: true }));
      pctInputs[2].dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);
  assert(splitResult);
  await new Promise((r) => setTimeout(r, 100));

  await exec(`
    (() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const nameInput = document.querySelector('input[placeholder^="+ Add new split"]');
      const row = nameInput.closest('tr');
      const pctInput = row.querySelector('input[type="number"]');
      const addBtn = row.querySelector('td:last-child button');

      setter.call(nameInput, 'Car Fund');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      // Request 25% even though only 10% is available
      setter.call(pctInput, '25');
      pctInput.dispatchEvent(new Event('input', { bubbles: true }));
      addBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 150));

  const bucketState = await exec(`
    (() => {
      const pctInputs = Array.from(document.querySelectorAll('input[title^="Max allowed right now"]'));
      const sum = pctInputs.reduce((s, el) => s + Number(el.value || 0), 0);
      const visibleTables = document.querySelectorAll('section input[placeholder^="Add to "]').length;
      return { count: pctInputs.length, sum, visibleTables };
    })()
  `);
  assert.strictEqual(bucketState.count, 4, 'Expected 4 buckets after adding Car Fund');
  assert.strictEqual(bucketState.sum, 100, `Expected total split % to be capped at 100%, got ${bucketState.sum}%`);
  assert.strictEqual(bucketState.visibleTables, 3, `Expected max 3 visible expense tables, got ${bucketState.visibleTables}`);

  console.log('[E2E] 6/9 Adding expenses to bucket tables & verifying Used % > 100% on overspend...');
  // Car Fund (10% of 1100 = 110 budget) is currently one of the 3 visible tables; overspend it with 220 (200% used!)
  await exec(`
    (() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const carTitle = document.querySelector('input[placeholder="Add to Car Fund..."]');
      if (!carTitle) throw new Error('Car Fund expense table not visible');
      const row = carTitle.closest('tr');
      const amtInput = row.querySelector('input[type="number"]');
      const cutBtn = row.querySelector('button');

      setter.call(carTitle, 'New Tires');
      carTitle.dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(amtInput, '220');
      amtInput.dispatchEvent(new Event('input', { bubbles: true }));
      cutBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 150));

  const pageTextAfterExpense = await exec(`document.body.innerText`);
  assert(
    pageTextAfterExpense.includes('200%'),
    'Expected Car Fund Used % to reach 200% (>100%) after spending 220 on a 110 budget'
  );

  console.log('[E2E] 7/9 Testing Analytics tab indicators & Category Pivot Table...');
  await exec(`
    (() => {
      const tab = Array.from(document.querySelectorAll('footer button')).find(b => b.textContent.trim() === 'Analytics');
      if (!tab) throw new Error('Analytics tab not found');
      tab.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 150));

  const analyticsText = (await exec(`document.body.innerText`)).toLowerCase();
  assert(
    analyticsText.includes('monthly financial indicators') &&
      analyticsText.includes('category breakdown pivot table'),
    'Expected Analytics tab to render indicators and Category Pivot Table'
  );

  console.log('[E2E] 8/9 Testing Settings tab, Cloud Sync panel, and real Currency Conversion (JOD -> USD)...');
  await exec(`
    (() => {
      const tab = Array.from(document.querySelectorAll('footer button')).find(b => b.textContent.trim() === 'Settings');
      if (!tab) throw new Error('Settings tab not found');
      tab.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 150));

  const settingsText = (await exec(`document.body.innerText`)).toLowerCase();
  assert(
    settingsText.includes('personal cloud sync') &&
      settingsText.includes('currency converter & exchange rates'),
    'Expected Settings tab to render Cloud Sync and Currency Converter sections'
  );

  await exec(`
    (() => {
      const convertBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Convert to USD'));
      if (!convertBtn) throw new Error('Convert to USD button not found');
      convertBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  console.log('[E2E] 9/9 Verifying atomic disk persistence in finance-store.json...');
  assert(fs.existsSync(storePath), `Expected persisted store at ${storePath}`);
  const saved = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  assert.strictEqual(saved.version, 2);
  assert.strictEqual(saved.settings.currency.code, 'USD');
  const activeMonth = saved.months[saved.activeMonth];
  assert(activeMonth, 'Expected active month in saved store');
  assert.strictEqual(activeMonth.buckets.length, 4);
  // 1000 JOD converted to USD (~1410.44 USD)
  const salaryEntry = activeMonth.incomes.find((i) => i.type === 'salary');
  assert(salaryEntry && salaryEntry.amount > 1400, `Expected converted USD salary > 1400, got ${salaryEntry?.amount}`);

  console.log('ELECTRON_E2E_ALL_PASSED');
}

module.exports = { runElectronE2E };
