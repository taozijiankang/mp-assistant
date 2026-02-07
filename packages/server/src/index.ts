import { chromium } from 'playwright';
import { WXMPWorker } from './worker/wx/WXMPWorker.js';

const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({
    executablePath: executablePath,
    headless: false,
});

new WXMPWorker().init(browser);