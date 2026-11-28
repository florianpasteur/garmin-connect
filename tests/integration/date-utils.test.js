const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('child_process');
const { dist } = require('../helpers/dist');

const script = (zone) =>
    `const { getLocalTimestamp } = require(${JSON.stringify(
        dist + '/garmin/common/DateUtils'
    )});
    process.stdout.write(getLocalTimestamp(new Date('2024-03-05T20:00:00.123Z'), '${zone}'));`;

// Run in child processes: the result must not depend on the system timezone
for (const system of [
    'UTC',
    'Europe/Paris',
    'Asia/Kolkata',
    'America/Los_Angeles'
]) {
    test(`getLocalTimestamp on a system in ${system}`, () => {
        const convert = (zone) =>
            execFileSync(process.execPath, ['-e', script(zone)], {
                env: { ...process.env, TZ: system },
                stdio: 'pipe'
            }).toString();
        assert.strictEqual(convert('Europe/Paris'), '2024-03-05T21:00:00.123');
        assert.strictEqual(convert('Asia/Tokyo'), '2024-03-06T05:00:00.123');
        assert.throws(() => convert('Not/AZone'), /Invalid time zone/);
    });
}
