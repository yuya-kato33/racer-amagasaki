const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runCapture(targetDate) {

    const BASE_URL = 'http://192.168.1.24:8083';
    const OUTPUT_DIR = path.join(__dirname, `../output/${targetDate}`);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // 初回アクセス
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    await page.waitForSelector('#total-pages');
    await page.waitForSelector('.racer-card');

    await page.evaluateHandle('document.fonts.ready');

    // ページ数取得
    const totalPages = await page.$eval('#total-pages', el => Number(el.textContent));

    console.log('pages:', totalPages);

    // 各ページをキャプチャ
    for (let i = 0; i < totalPages; i++) {

        const url = `${BASE_URL}?page=${i}`;
        await page.goto(url, { waitUntil: 'networkidle0' });

        await page.waitForSelector('.racer-card');
        await sleep(500);

        const filename = `${OUTPUT_DIR}/${targetDate}_ichiran_page_${i + 1}.png`;
        // const filename = `${OUTPUT_DIR}/${targetDate}_${jcdOnly || 'all'}_ichiran_page_${i + 1}.png`;

        await page.screenshot({ path: filename });

        console.log(`📸 ${filename}`);
    }

    await browser.close();
}

module.exports = { runCapture }
