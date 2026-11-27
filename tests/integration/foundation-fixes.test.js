// Regression tests of error handling, using a fake axios adapter.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const axios = require('axios');
const { load } = require('../helpers/dist');

const GarminConnect = load('garmin/GarminConnect').default;

console.log = () => {};
console.error = () => {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client(handler) {
    const gc = new GarminConnect({ username: 'u', password: 'p' });
    const calls = [];
    gc.client.client.defaults.adapter = async (config) => {
        calls.push(config);
        const [status, data] = await handler(config, calls);
        const response = { status, data, headers: {}, config, statusText: '' };
        if (status >= 400) {
            throw new axios.AxiosError('fail', 'ERR', config, null, response);
        }
        return response;
    };
    return { gc, calls };
}

function withTokens(gc, access = 'old') {
    gc.client.OAUTH_CONSUMER = { key: 'k', secret: 's' };
    gc.client.oauth1Token = { oauth_token: 'a', oauth_token_secret: 'b' };
    gc.client.oauth2Token = { access_token: access };
}

const isExchange = (c) => c.url.includes('/exchange/user/2.0');
const bearer = (c) => String(c.headers.Authorization || '');
const NEW_TOKEN = {
    access_token: 'new',
    expires_in: 60,
    refresh_token_expires_in: 60
};

// Fails the test instead of hanging forever.
const within = (p, ms = 500) =>
    Promise.race([
        p,
        sleep(ms).then(() => {
            throw new Error('HUNG');
        })
    ]);

const rejectsWith401 = (p) => assert.rejects(within(p), /\(401\)/);

// --- authentication ---------------------------------------------------------

test('401 without an OAuth2 token rejects', async () => {
    const { gc } = client(async () => [401, {}]);
    await rejectsWith401(gc.get('https://x/api'));
});

test('401 refreshes the token once and retries', async () => {
    const { gc, calls } = client(async (c) => {
        if (isExchange(c)) return [200, { ...NEW_TOKEN }];
        return bearer(c).endsWith('new') ? [200, 'ok'] : [401, {}];
    });
    withTokens(gc);
    assert.strictEqual(await within(gc.get('https://x/api')), 'ok');
    assert.strictEqual(calls.filter(isExchange).length, 1);
    assert.ok(!bearer(calls.find(isExchange)).startsWith('Bearer'));
});

test('concurrent 401s share one refresh', async () => {
    const { gc, calls } = client(async (c) => {
        if (isExchange(c)) {
            await sleep(30);
            return [200, { ...NEW_TOKEN }];
        }
        return bearer(c).endsWith('new') ? [200, 'ok'] : [401, {}];
    });
    withTokens(gc);
    const all = Promise.all([1, 2, 3].map((i) => gc.get('https://x/' + i)));
    assert.deepStrictEqual(await within(all), ['ok', 'ok', 'ok']);
    assert.strictEqual(calls.filter(isExchange).length, 1);
});

test('a request sent while a refresh is running waits for it', async () => {
    const { gc, calls } = client(async (c) => {
        if (isExchange(c)) {
            await sleep(40);
            return [200, { ...NEW_TOKEN }];
        }
        return bearer(c).endsWith('new') ? [200, 'ok'] : [401, {}];
    });
    withTokens(gc);
    const first = gc.get('https://x/first');
    await sleep(10);
    const second = gc.get('https://x/second');
    assert.deepStrictEqual(await within(Promise.all([first, second])), [
        'ok',
        'ok'
    ]);
    assert.strictEqual(calls.filter(isExchange).length, 1);
});

test('a failed refresh rejects every waiting request, and a later one recovers', async () => {
    let healthy = false;
    const { gc } = client(async (c) => {
        if (isExchange(c)) {
            await sleep(30);
            return healthy ? [200, { ...NEW_TOKEN }] : [500, {}];
        }
        return bearer(c).endsWith('new') ? [200, 'ok'] : [401, {}];
    });
    withTokens(gc);
    const results = await within(
        Promise.allSettled([gc.get('https://x/1'), gc.get('https://x/2')])
    );
    assert.deepStrictEqual(
        results.map((r) => r.status),
        ['rejected', 'rejected']
    );
    assert.strictEqual(gc.client.oauth2Token.access_token, 'old');
    healthy = true;
    assert.strictEqual(await within(gc.get('https://x/3')), 'ok');
});

test('a 401 from the token exchange itself rejects without deadlock', async () => {
    const { gc, calls } = client(async () => [401, {}]);
    withTokens(gc);
    await rejectsWith401(gc.get('https://x/api'));
    assert.strictEqual(calls.filter(isExchange).length, 1);
});

test('a request that stays 401 is retried only once', async () => {
    const { gc, calls } = client(async (c) =>
        isExchange(c) ? [200, { ...NEW_TOKEN }] : [401, {}]
    );
    withTokens(gc);
    await rejectsWith401(gc.get('https://x/api'));
    assert.strictEqual(calls.length, 3);
});

test('two clients do not share a refresh', async () => {
    const make = (name, delay) => {
        const made = client(async (c) => {
            if (isExchange(c)) {
                await sleep(delay);
                return [200, { ...NEW_TOKEN, access_token: name }];
            }
            return bearer(c).endsWith(name) ? [200, name] : [401, {}];
        });
        withTokens(made.gc);
        return made.gc;
    };
    const a = make('token-a', 40);
    const b = make('token-b', 5);
    const both = Promise.all([a.get('https://x/a'), b.get('https://x/b')]);
    assert.deepStrictEqual(await within(both), ['token-a', 'token-b']);
});

test('other errors still reject', async () => {
    const { gc } = client(async () => [500, {}]);
    await assert.rejects(within(gc.get('https://x/api')), /\(500\)/);
});

// --- upload -----------------------------------------------------------------

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-'));
for (const [name, format, expected] of [
    ['a.gpx', undefined, 'gpx'],
    ['a.TCX', undefined, 'tcx'],
    ['a.fit', undefined, 'fit'],
    ['noextension', undefined, 'fit'],
    ['a.dat', 'gpx', 'gpx']
]) {
    test(`upload ${name} with format ${format} goes to .${expected}`, async () => {
        const file = path.join(dir, name);
        fs.writeFileSync(file, 'x');
        const { gc, calls } = client(async () => [200, {}]);
        await gc.uploadActivity(file, format);
        await sleep(10);
        assert.ok(
            calls[0].url.endsWith('/upload-service/upload/.' + expected),
            calls[0].url
        );
    });
}

test('upload rejects an unsupported extension', async () => {
    const file = path.join(dir, 'a.dat');
    fs.writeFileSync(file, 'x');
    const { gc, calls } = client(async () => [200, {}]);
    await assert.rejects(gc.uploadActivity(file), /Invalid format: dat/);
    assert.strictEqual(calls.length, 0);
});

// --- health -----------------------------------------------------------------

const answering = (data) => client(async () => [200, data]).gc;
const day = new Date('2026-01-15T12:00:00Z');

test('hydration with nothing logged is 0', async () => {
    assert.strictEqual(
        await answering({ valueInML: null }).getDailyHydration(day),
        0
    );
});
test('hydration of 0 is 0', async () => {
    assert.strictEqual(
        await answering({ valueInML: 0 }).getDailyHydration(day),
        0
    );
});
test('hydration converts millilitres', async () => {
    const oz = await answering({ valueInML: 1000 }).getDailyHydration(day);
    assert.ok(Math.abs(oz - 33.814) < 1e-9);
});
test('hydration rejects an empty response', async () => {
    await assert.rejects(
        answering('').getDailyHydration(day),
        /Invalid or empty/
    );
});

const steps = (totalSteps) =>
    answering([{ calendarDate: '2026-01-15', totalSteps }]);
test('steps are returned, including 0', async () => {
    assert.strictEqual(await steps(1234).getSteps(day), 1234);
    assert.strictEqual(await steps(0).getSteps(day), 0);
});
test('steps without device data are null', async () => {
    assert.strictEqual(await steps(null).getSteps(day), null);
});
test('steps reject a missing day', async () => {
    await assert.rejects(answering([]).getSteps(day), /Can't find/);
});

const night = (start, end) =>
    answering({
        dailySleepDTO: {
            sleepStartTimestampGMT: start,
            sleepEndTimestampGMT: end
        }
    });
test('sleep duration is computed', async () => {
    assert.deepStrictEqual(await night(0, 27000000).getSleepDuration(day), {
        hours: 7,
        minutes: 30
    });
});
test('sleep duration rejects a night without data', async () => {
    await assert.rejects(
        night(null, null).getSleepDuration(day),
        /Invalid or missing/
    );
});

// --- upstream login fallback --------------------------------------------------

test('a rate limited mobile login still falls back to the SSO widget', async () => {
    const { gc, calls } = client(async (c) => {
        if (c.url.includes('/mobile/api/login')) return [429, {}];
        if (c.url.endsWith('/sso/signin')) {
            return c.method === 'get'
                ? [200, '<input name="_csrf" value="x">']
                : [200, '<a href="embed?ticket=ST-1">'];
        }
        if (c.url.includes('preauthorized')) {
            return [200, 'oauth_token=a&oauth_token_secret=b'];
        }
        if (isExchange(c)) return [200, { ...NEW_TOKEN }];
        return [200, ''];
    });
    gc.client.fetchOauthConsumer = async () => {
        gc.client.OAUTH_CONSUMER = { key: 'k', secret: 's' };
    };
    await within(gc.login());
    assert.strictEqual(gc.client.oauth2Token.access_token, 'new');
    assert.ok(calls.some((c) => c.url.endsWith('/sso/signin')));
});
