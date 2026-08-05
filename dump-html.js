import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  // We need to serve the dist folder since we are testing the built output
  // Or we can just start the dev server
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Wait for networkidle
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Evaluate and get the innerHTML of the first accordion section
  const html = await page.evaluate(() => {
    return document.querySelector('.accordion-section').outerHTML;
  });
  
  console.log(html);
  
  // Also take a screenshot for debugging
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
})();
