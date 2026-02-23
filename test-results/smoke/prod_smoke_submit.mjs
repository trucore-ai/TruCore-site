import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const ts = Date.now();
const standardEmail = `smoke.standard+${ts}@example.com`;
const partnerEmail = `smoke.partner+${ts}@example.com`;

const results = [];

try {
  await page.goto("https://trucore.xyz/#waitlist", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('#waitlist input[name="email"]', { timeout: 30000 });
  await page.fill('#waitlist input[name="email"]', standardEmail);
  await page.selectOption('#waitlist select[name="role"]', "Builder");
  await page.fill('#waitlist input[name="useCase"]', "Stage 49 production smoke waitlist submission");
  await page.getByRole("button", { name: /join waitlist/i }).click();
  await page.locator('[data-testid="waitlist-success"]').waitFor({ timeout: 30000 });
  await page.screenshot({ path: "test-results/smoke/standard-waitlist-success.png", fullPage: true });
  results.push("standard_submit:PASS");
} catch (error) {
  const statusText = (await page.locator('#waitlist-status, [role="alert"]').first().textContent().catch(() => null))?.trim();
  await page.screenshot({ path: "test-results/smoke/standard-waitlist-fail.png", fullPage: true });
  results.push(`standard_submit:FAIL:${error?.message || String(error)}`);
  if (statusText) results.push(`standard_submit_message:${statusText}`);
}

try {
  await page.goto("https://trucore.xyz/atf/apply", { waitUntil: "networkidle", timeout: 60000 });
  await page.fill("#apply-email", partnerEmail);
  await page.fill("#apply-project", "TruCore Smoke Project");
  await page.check('input[name="integrationsInterest"][value="jupiter"]');
  await page.selectOption("#apply-build-stage", "prototype");
  await page.selectOption("#apply-tx-volume", "10k_100k");
  await page.selectOption("#apply-role", "Founder");
  await page.fill("#apply-usecase", "Stage 49 production smoke design partner submission");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.getByText(/application received/i).waitFor({ timeout: 30000 });
  await page.screenshot({ path: "test-results/smoke/design-partner-success.png", fullPage: true });
  results.push("design_partner_submit:PASS");
} catch (error) {
  results.push(`design_partner_submit:FAIL:${error?.message || String(error)}`);
}

await browser.close();
console.log(`standard_email:${standardEmail}`);
console.log(`partner_email:${partnerEmail}`);
for (const line of results) console.log(line);
