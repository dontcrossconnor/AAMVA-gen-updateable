import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Fira+Code:wght@500;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      padding: 40px;
      background: #ffffff;
    }
    
    .header-banner {
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    
    .header-banner h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    
    .header-banner p {
      margin: 6px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
    }
    
    .quick-start-box {
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    
    .quick-start-steps {
      margin: 0;
      padding-left: 20px;
    }
    
    .quick-start-steps li {
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    
    .feature-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      background: #ffffff;
    }
    
    .feature-card h3 {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 700;
      color: #4f46e5;
    }
    
    .feature-card p {
      margin: 0;
      font-size: 12px;
      color: #475569;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    
    code {
      font-family: 'Fira Code', monospace;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      color: #0284c7;
      font-size: 11px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="header-banner">
    <h1>🪪 AAMVA PDF417 Studio — User & Feature Guide</h1>
    <p>Enterprise-grade desktop & web suite for AAMVA driver's license barcode generation, inspection, and multi-version compliance testing.</p>
  </div>

  <div class="quick-start-box">
    <strong style="color: #4f46e5; font-size: 14px;">⚡ Quick-Start Guide (3 Steps)</strong>
    <ol class="quick-start-steps" style="margin-top: 8px;">
      <li><strong>Launch Executable</strong>: Double-click <code>AAMVA PDF417 Studio 1.0.0.exe</code> (standalone executable — no install needed).</li>
      <li><strong>Select Jurisdiction & Profile</strong>: Pick a state (e.g. <em>California</em>, <em>Illinois</em>) or choose a preset sample.</li>
      <li><strong>Generate & Export</strong>: Edit credentials with live validation, then click <strong>Download PNG</strong>, <strong>Download SVG</strong>, or <strong>Copy String</strong>.</li>
    </ol>
  </div>

  <div class="section-title">🔥 Key Features & Technical Architecture</div>

  <div class="feature-grid">
    <div class="feature-card">
      <h3>🎯 State-Level Version Filtering</h3>
      <p>Automatically filters active AAMVA versions per state (e.g. <code>v08</code>, <code>v09</code>, <code>v10</code>). Non-circulating legacy specs (15-20 years old) are automatically hidden on a per-state basis.</p>
    </div>
    
    <div class="feature-card">
      <h3>🌐 Live Remote Rule Synchronization</h3>
      <p>Syncs real-time state version mappings as US jurisdictions update DMV card layouts. Connect custom S3/GitHub endpoints, commercial identity APIs, or use default offline rules.</p>
    </div>

    <div class="feature-card">
      <h3>🔍 Strict Input Validation & Tooltips</h3>
      <p>Enumerated inputs (Sex, Eye Color, REAL ID, Organ Donor) use strict dropdowns. Text inputs enforce live regex matching (<code>YYYYMMDD</code>, <code>070 in</code>, <code>180 lb</code>) with interactive <code>(?)</code> tooltips.</p>
    </div>

    <div class="feature-card">
      <h3>🛠️ Dual Studio & Vector Export</h3>
      <p>Features visual Variable Form Studio and Raw Payload Inspector with byte counters, high-DPI 300+ PNG, SVG vector download, and string clipboard copy.</p>
    </div>
  </div>

  <div class="section-title">🌐 Live Sync Endpoint Provider Options</div>
  <table>
    <thead>
      <tr>
        <th>Sync Source</th>
        <th>Configuration / Target</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Self-Hosted Endpoint (Default)</strong></td>
        <td><code>https://your-domain.com/aamva-rules.json</code></td>
        <td>Host custom state version JSON feeds on AWS S3, GitHub Raw, or Gist.</td>
      </tr>
      <tr>
        <td><strong>Commercial Identity SDK APIs</strong></td>
        <td>IDScan.net / Scandit / Dynamsoft Cloud API</td>
        <td>Connect commercial verification API feeds for enterprise automated updates.</td>
      </tr>
      <tr>
        <td><strong>Built-In Offline Engine</strong></td>
        <td>Offline Baseline (Aug 2026)</td>
        <td>Bundled master ruleset. Operates 100% standalone without internet.</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">📋 AAMVA Core Data Element Cheat Sheet</div>
  <table>
    <thead>
      <tr>
        <th>Tag</th>
        <th>Field Name</th>
        <th>Format / Allowed Options</th>
        <th>Example</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>DAQ</code></td>
        <td>License / ID Number</td>
        <td>Alphanumeric (4-25 chars)</td>
        <td><code>D12345678</code></td>
      </tr>
      <tr>
        <td><code>DCS</code></td>
        <td>Family / Last Name</td>
        <td>Text (1-40 chars)</td>
        <td><code>DOE</code></td>
      </tr>
      <tr>
        <td><code>DAC</code></td>
        <td>First Name</td>
        <td>Text (1-40 chars)</td>
        <td><code>JOHN</code></td>
      </tr>
      <tr>
        <td><code>DBB</code></td>
        <td>Date of Birth</td>
        <td>Strict 8 digits (<code>YYYYMMDD</code>)</td>
        <td><code>19900101</code></td>
      </tr>
      <tr>
        <td><code>DBC</code></td>
        <td>Sex / Gender Code</td>
        <td><code>1</code> (Male), <code>2</code> (Female), <code>9</code> (Unspecified)</td>
        <td><code>1</code></td>
      </tr>
      <tr>
        <td><code>DAY</code></td>
        <td>Eye Color</td>
        <td><code>BLK</code>, <code>BLU</code>, <code>BRO</code>, <code>GRN</code>, <code>GRY</code>, <code>HAZ</code>, etc.</td>
        <td><code>BRO</code></td>
      </tr>
      <tr>
        <td><code>DAJ</code></td>
        <td>State Code</td>
        <td>2-Letter Postal Abbreviation</td>
        <td><code>IL</code></td>
      </tr>
      <tr>
        <td><code>DDA</code></td>
        <td>REAL ID Compliance</td>
        <td><code>F</code> (Full Compliance), <code>N</code> (Non-Compliant), <code>M</code> (Material)</td>
        <td><code>F</code></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    AAMVA PDF417 Studio • Compliant with AAMVA DL/ID Card Design Standards (Versions 01 - 10) • Generated August 2026
  </div>

</body>
</html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(process.cwd(), 'AAMVA_PDF417_Studio_Guide.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
  });

  console.log(`PDF generated successfully at: ${pdfPath}`);
  await browser.close();
})();
