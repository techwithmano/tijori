const puppeteer = require("puppeteer-core");
const path = require("path");

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

  // Wait 1.5s for 3D scene to initialize and start animation loop
  await new Promise((r) => setTimeout(r, 1500));

  // Capture 6 sequential frames at 400ms intervals to capture coins orbiting behind the headline
  for (let i = 1; i <= 6; i++) {
    await new Promise((r) => setTimeout(r, 400));
    const filename = `verify_hero_frame_${i}.png`;
    await page.screenshot({ path: path.join(__dirname, filename) });
    console.log(`Captured ${filename}`);
  }

  // Also check Arabic
  console.log("Switching to Arabic...");
  await page.evaluate(() => {
    // Click language switcher button
    const buttons = Array.from(document.querySelectorAll("button, a, span"));
    const arBtn = buttons.find(
      (b) => b.textContent && (b.textContent.trim() === "عربي" || b.textContent.includes("عربي"))
    );
    if (arBtn) {
      arBtn.click();
    } else {
      // Toggle via localStorage or i18n
      localStorage.setItem("tijori_lang", "ar");
      window.location.reload();
    }
  });

  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(__dirname, "verify_hero_ar.png") });
  console.log("Captured verify_hero_ar.png");

  await browser.close();
  console.log("Verification screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error capturing verification:", err);
  process.exit(1);
});
