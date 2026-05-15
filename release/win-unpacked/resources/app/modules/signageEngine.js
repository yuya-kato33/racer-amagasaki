// 現在レース判定ロジック
function normalizeStime(stime) {
    if (!stime) return null;

    const [h, m] = stime.split(':');

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildJstdate(hdate, stime) {
    const hhmm = normalizeStime(stime);
    if (!hhmm) return null;

    const yyyy = hdate.slice(0, 4);
    const mm = hdate.slice(4, 6);
    const dd = hdate.slice(6, 8);

    return new Date(`${yyyy}-${mm}-${dd}T${hhmm}:00+09:00`);
}

async function getRaceSchedule(db, hdate, jcd) {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT rno, MIN(stime) AS stime
        FROM racer_programs
        WHERE hdate = ?
        AND jcd = ?
        GROUP BY rno
        ORDER BY CAST(rno AS INTEGER)
        `;

        db.all(sql, [hdate, jcd], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function decideCurrentRace(schedule, hdate, autoAdvanceMinutes) {
    const now = new Date();

    let currentRace = 1;

    for (const row of schedule) {
        const deadline = buildJstdate(hdate, row.stime);
        if (!deadline) continue;

        const switchTime = new Date(
            deadline.getTime() + autoAdvanceMinutes * 60 * 1000
        );

        if (now >= switchTime) {
            currentRace = Number(row.rno) + 1;
        }
    }

    if (currentRace > 12) currentRace = 12;

    return currentRace;
}

module.exports = {
    getRaceSchedule, decideCurrentRace, buildJstdate, normalizeStime
}

// 1R締切 08:32 → 10分後　→ 8:42以降 2R表示
