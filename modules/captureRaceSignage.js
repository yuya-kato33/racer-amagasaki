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
            waitUntil: 'networkidle0'
        });

        // iframe 6艇描画待ち
        await page.waitForSelector(
            '.signage-frame', { timeout: 30000 }
        );

        // iframe 6枚待機
        await page.waitForFunction(() => {

            const iframes = document.querySelectorAll(
                '.signage-frame'
            );

            return iframes.length === 6;
        });

        // iframe 内部ロード待ち (内部DOMに入る)
        const frames = page.frames();

        for (const frame of frames) {

            console.log('frame url=', frame.url());
            try {
                // racerページだけ対象
                if (!frame.url().includes('/racer')) {
                    continue;
                }

                await frame.waitForSelector(
                    '.taterace-screen img',
                    { timeout: 30000 }
                );

                await frame.waitForFunction(() => {
                    const img =
                        document.querySelector(
                            '.taterace-screen img'
                        );

                    return (img && img.compleate && img.naturalWidth > 0);
                });

                // font待ち
                await page.evaluateHandle(
                    'document.fonts.ready'
                );
            } catch (err) {
                console.log('⚠ frame wait skip: ', err.message)
            }
        }
        // 最終安定待ち
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