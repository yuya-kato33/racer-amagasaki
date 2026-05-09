const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runCaptureRaceSignage(targetDate, jcd) {

    const BASE_URL = 'http://127.0.0.1:8083';

    // レース集合画像フォルダ
    const OUTPUT_DIR = path.join(__dirname, `../output/${targetDate}/race`);

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 重要
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 3240, height: 3840 }
    });

    const page = await browser.newPage();

    for (let rno = 1; rno <= 12; rno++) {
        const rno2 = String(rno).padStart(2, '0');

        const url = `${BASE_URL}/race-signage?hdate=${targetDate}&jcd=${jcd}&rno=${rno2}`;

        console.log(`🌐 ${url} `);

        await page.goto(url, {
            waitUntil: 'domcontentloaded'
        });

        // 6艇描画待ち
        await page.waitForSelector(
            '.taterace-screen img', { timeout: 30000 }
        );

        // 全画面読み込み待機
        await page.waitForFunction(() => {
            const imgs = document.querySelectorAll(
                '.taterace-screen img'
            );

            return [...imgs].every(
                img => img.complete
            );
        });

        // font待ち
        await page.evaluateHandle(
            'document.fonts.ready'
        );
        await sleep(1000);

        const filename = path.join(
            OUTPUT_DIR, `${targetDate}_${rno2}R_race.png`
        );

        await page.screenshot({
            path: filename,
            type: 'png',
            omitBackground: false
        });

        console.log(`📸 ${filename}`)
    }
    await browser.close();
}

module.exports = {
    runCaptureRaceSignage
}