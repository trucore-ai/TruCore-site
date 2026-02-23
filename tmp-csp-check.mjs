import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const violations = [];
page.on("console", (msg) => {
  const text = msg.text();
  if (/content security policy|csp/i.test(text)) {
    violations.push(text);
  }
});

for (const path of ["/", "/atf"]) {
  await page.goto(`http://127.0.0.1:3000${path}`, { waitUntil: "networkidle" });
}

await browser.close();

if (violations.length > 0) {
  console.error("CSP violations detected:");
  for (const item of violations) {
    console.error(item);
  }
  process.exit(1);
}

console.log("No CSP console violations detected for / and /atf");
