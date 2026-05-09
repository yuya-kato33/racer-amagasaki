const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runCaptureSignage(targetDate, jcd) {

    const BASE_URL = 'http://127.0.0.1:8083';

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 1080, height: 1920 }
    });

    const page = await browser.newPage();

    for (let teiban = 1; teiban <= 6; teiban++) {
        const OUTPUT_DIR = path.join(__dirname, `../output/${targetDate}/single`);

        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        for (let rno = 1; rno <= 12; rno++) {
            const rno2 = String(rno).padStart(2, '0');

            const url =
                `${BASE_URL}/racer?hdate=${targetDate}&jcd=${jcd}&rno=${rno2}&teiban=${teiban}&capture=1`;

            await page.goto(url, { waitUntil: 'domcontentloaded' });

            // taterace-signage.html 側の一番外側にこのclassをつける
            await page.waitForSelector('.taterace-screen img', { timeout: 30000 });

            await page.waitForFunction(() => {
                const img = document.querySelector('.taterace-screen img');
                return img && img.complete;
            })

            await page.evaluateHandle('document.fonts.ready');
            await sleep(200);

            const filename = path.join(
                OUTPUT_DIR, `${targetDate}_${rno2}R_${teiban}.png`);

            await page.screenshot({
                path: filename, type: 'png', omitBackground: false
            });

            console.log(`📸 ${filename}`);
        }

    }
    await browser.close();
};

module.exports = { runCaptureSignage }

