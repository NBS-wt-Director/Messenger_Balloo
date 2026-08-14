#!/usr/bin/env python3
"""Генерирует scripts/generate-pdfs.js из этого Python-скрипта."""

import os

PROJECT_ROOT = '/home/ivan/Рабочий стол/проекты/balloo'
OUTPUT = os.path.join(PROJECT_ROOT, 'scripts', 'generate-pdfs.js')

css = r"""
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1d21; line-height: 1.6; font-size: 10px; }
  @media print {
    @page { size: A4; margin: 15mm; }
    .page { page-break-after: always; min-height: 230mm; padding: 10px 0; }
    .page:last-child { page-break-after: avoid; }
    .page-break { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
  }
  .hero { background: linear-gradient(135deg, #0a0d11, #14191f, #1a2332); color: #f2f5f8; padding: 40px 40px; text-align: center; }
  .hero h1 { font-size: 28px; font-weight: 800; margin-bottom: 10px; }
  .hero h1 .accent { color: #2db84d; }
  .hero p { font-size: 13px; color: #aeb8c4; max-width: 550px; margin: 0 auto; }
  .section { margin-bottom: 22px; }
  .section h2 { font-size: 17px; font-weight: 700; color: #0a0d11; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #2db84d; }
  .section h3 { font-size: 12px; font-weight: 600; color: #1a1d21; margin: 14px 0 5px 0; }
  .section p { margin-bottom: 7px; color: #3a3f47; }
  .section ul, .section ol { margin: 7px 0 7px 16px; }
  .section ul li, .section ol li { margin-bottom: 3px; color: #3a3f47; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
  .card { background: #f5f7fa; border: 1px solid #eef1f5; padding: 14px; border-left: 3px solid #2db84d; }
  .card h4 { font-size: 11px; font-weight: 700; margin-bottom: 5px; color: #0a0d11; }
  .card p { font-size: 8px; color: #5a6573; margin: 0; }
  .step { display: flex; gap: 10px; margin-bottom: 14px; align-items: flex-start; }
  .step-number { flex-shrink: 0; width: 28px; height: 28px; background: #2db84d; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
  .step-content h4 { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  .step-content p { font-size: 8px; color: #5a6573; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 8px; }
  th { background: #0a0d11; color: #f2f5f8; padding: 7px 8px; text-align: left; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #eef1f5; color: #3a3f47; }
  tr:nth-child(even) td { background: #f9fafb; }
  .highlight { background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border-left: 3px solid #2db84d; padding: 10px 14px; margin: 14px 0; }
  .highlight p { margin: 0; color: #1a5c2a; font-weight: 500; font-size: 9px; }
  .cta-box { background: linear-gradient(135deg, #2db84d, #1e9e3e); color: white; padding: 20px 28px; text-align: center; margin: 22px 0; }
  .cta-box h3 { color: white; font-size: 15px; margin-bottom: 5px; border: none; }
  .cta-box p { color: rgba(255,255,255,0.9); font-size: 10px; margin-bottom: 10px; }
  .cta-box .email { font-size: 12px; font-weight: 700; }
  .logo-img { height: 36px; width: auto; }
  .mascot-img { height: 120px; width: auto; margin: 10px 0; }
  .screenshot { width: 100%; max-width: 600px; border: 1px solid #eef1f5; border-radius: 6px; margin: 12px auto; display: block; }
  .screenshot-caption { text-align: center; font-size: 8px; color: #727f8d; margin: 4px 0 12px; font-style: italic; }
  .stat-row { display: flex; gap: 16px; margin: 18px 0; }
  .stat-box { flex: 1; text-align: center; padding: 14px; background: #f5f7fa; }
  .stat-box .number { font-size: 24px; font-weight: 800; color: #2db84d; }
  .stat-box .label { font-size: 8px; color: #5a6573; margin-top: 2px; }
  .pdf-footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #eef1f5; text-align: center; font-size: 7px; color: #939eab; }
  .dark-section { background: #0a0d11; color: #f2f5f8; padding: 22px 28px; margin: 18px 0; }
  .dark-section h3 { color: #2db84d; }
  .dark-section p { color: #aeb8c4; font-size: 8px; }
  .cover { background: linear-gradient(135deg, #0a0d11, #1a2332); color: #f2f5f8; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 297mm; padding: 40px 40px; text-align: center; }
  .cover .mascot-img { height: 140px; width: auto; margin-bottom: 20px; }
  .cover h1 { font-size: 34px; font-weight: 900; margin-bottom: 10px; }
  .cover h1 .accent { color: #2db84d; }
  .cover .subtitle { font-size: 14px; color: #aeb8c4; margin-bottom: 28px; }
  .cover .meta { font-size: 9px; color: #727f8d; }
  .cover .logo-img { height: 48px; width: auto; margin-bottom: 16px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; }
  .info-box { background: #f5f7fa; padding: 12px; border-radius: 4px; }
  .info-box h4 { font-size: 10px; font-weight: 700; margin-bottom: 5px; color: #0a0d11; }
  .info-box p { font-size: 8px; color: #5a6573; margin: 0; }
  .feature-list { columns: 2; column-gap: 18px; margin: 10px 0; }
  .feature-list li { padding: 3px 0; break-inside: avoid; }
"""

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write('#!/usr/bin/env node\n')
    f.write('/**\n * Balloo Messenger — PDF Generator v3\n * Генерирует 4 PDF-файла с реальными логотипами, маскотом и скриншотами макетов\n */\n\n')
    f.write("import puppeteer from 'puppeteer';\n")
    f.write("import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';\n")
    f.write("import { join, dirname, resolve } from 'path';\n")
    f.write("import { fileURLToPath } from 'url';\n\n")
    f.write('const __filename = fileURLToPath(import.meta.url);\n')
    f.write('const __dirname = dirname(__filename);\n')
    f.write('const PROJECT_ROOT = resolve(__dirname, "..");\n')
    f.write('const OUTPUT_DIR = PROJECT_ROOT;\n')
    f.write("const EMAIL = 'o8eryuhtin@yandex.ru';\n")
    f.write('const LOGOS_DIR = join(PROJECT_ROOT, "assets", "logos");\n')
    f.write('const MOCKUPS_DIR = join(PROJECT_ROOT, "mockups");\n')
    f.write('const SCREENSHOTS_DIR = join(PROJECT_ROOT, "tmp", "screenshots");\n\n')
    f.write("const COMMON_CSS = `" + css + "`;\n\n")
    
    # Screenshot functions
    f.write("""
async function captureScreenshot(htmlPath, outputPng) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: outputPng, fullPage: false, type: 'png' });
  } finally {
    await browser.close();
  }
}

async function captureAllScreenshots() {
  console.log('\\n📸 Захват скриншотов макетов...');
  const allScreenshots = [
    'balloo-su/chats.html', 'balloo-su/login.html', 'balloo-su/register.html',
    'balloo-su/onboarding.html', 'balloo-su/empty-chat.html', 'balloo-su/profile.html',
    'balloo-su/public-profile.html', 'balloo-su/calls.html', 'balloo-su/active-call.html',
    'balloo-su/group-create.html', 'balloo-su/group-settings.html',
    'balloo-su/story-create.html', 'balloo-su/poll-editor.html',
    'balloo-su/settings.html', 'balloo-su/privacy-settings.html',
    'balloo-su/two-factor.html', 'balloo-su/my-devices.html',
    'balloo-su/notification-settings.html', 'balloo-su/about-balloo.html',
    'balloo-su/about-company.html', 'balloo-su/donate.html', 'balloo-su/rules.html',
    'balloo-su/search.html', 'balloo-su/contacts.html', 'balloo-su/invites.html',
    'balloo-su/bots.html', 'balloo-su/archive.html', 'balloo-su/blocked-users.html',
  ];
  let captured = 0;
  for (const mockup of allScreenshots) {
    const mockupPath = join(MOCKUPS_DIR, mockup + '.html');
    if (!existsSync(mockupPath)) { console.log('   ⚠️  Не найден: ' + mockup); continue; }
    const desc = mockup.replace(/[\\/\\-]/g, '_').replace('.html', '');
    const outputPng = join(SCREENSHOTS_DIR, desc + '.png');
    try {
      await captureScreenshot(mockupPath, outputPng);
      captured++;
      console.log('   ✅ ' + mockup);
    } catch (err) {
      console.log('   ❌ ' + mockup + ': ' + err.message);
    }
  }
  console.log('   Всего: ' + captured + '/' + allScreenshots.length + '\\n');
}

function screenshotPath(desc) { return join(SCREENSHOTS_DIR, desc + '.png'); }

function screenshotToBase64(desc) {
  const path = screenshotPath(desc);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'base64');
}

function logoToBase64(filename) {
  const path = join(LOGOS_DIR, filename);
  if (!existsSync(path)) return null;
  return readFileSync(path, 'base64');
}

function dataURI(filename) {
  const data = logoToBase64(filename);
  return data ? 'data:image/png;base64,' + data : null;
}

function imgTag(dataURI, className) {
  if (dataURI) return '<img src="' + dataURI + '" class="' + className + '">';
  if (className === 'mascot-img') {
    return '<div style="width:120px;height:120px;background:linear-gradient(135deg,#2db84d,#1e9e3e);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:10px 0;"><span style="color:white;font-size:48px;font-weight:900;">&#x1F43B;</span></div>';
  }
  return '<div style="width:48px;height:48px;background:linear-gradient(135deg,#2db84d,#1e9e3e);clip-path:polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;"><span style="color:white;font-weight:800;font-size:20px;">B</span></div>';
}

function screenshotImg(desc, caption) {
  const data = screenshotToBase64(desc);
  if (data) {
    return '<img src="data:image/png;base64,' + data + '" class="screenshot"><div class="screenshot-caption">' + caption + '</div>';
  }
  return '<div class="card" style="text-align:center;padding:30px;"><p style="color:#939eab;">&#x1F4F7; Скриншот: ' + caption + '</p></div>';
}

""")
    
    print("Part 1 written: " + OUTPUT)
    print("Size so far: " + str(os.path.getsize(OUTPUT)) + " bytes")
