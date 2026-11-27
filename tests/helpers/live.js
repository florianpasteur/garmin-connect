// Tests against the real Garmin Connect. They only run with GARMIN_LIVE=1, and
// tests that change the account also need GARMIN_ALLOW_WRITES=1.
//
// Sign in with saved tokens (GARMIN_TOKEN_DIR, default ./.garmin-tokens, created
// by `npm run test:live:login`), or with GARMIN_USERNAME and GARMIN_PASSWORD,
// or garmin.config.json. Never log or assert on whole responses: they hold
// personal data.
const fs = require('fs');
const path = require('path');
const nodeTest = require('node:test');
const { load, root } = require('./dist');

const LIVE = process.env.GARMIN_LIVE === '1';
const WRITES = LIVE && process.env.GARMIN_ALLOW_WRITES === '1';
const TOKEN_DIR = path.resolve(
    root,
    process.env.GARMIN_TOKEN_DIR || '.garmin-tokens'
);

function credentials() {
    const { GARMIN_USERNAME, GARMIN_PASSWORD } = process.env;
    if (GARMIN_USERNAME && GARMIN_PASSWORD) {
        return { username: GARMIN_USERNAME, password: GARMIN_PASSWORD };
    }
    const file = path.join(root, 'garmin.config.json');
    return fs.existsSync(file) ? require(file) : undefined;
}

const hasTokens = () =>
    fs.existsSync(path.join(TOKEN_DIR, 'oauth2_token.json'));

let signedIn;

async function signIn(options) {
    const { GarminConnect } = load();
    const found = credentials();
    const gc = new GarminConnect(found || { username: '', password: '' });
    if (hasTokens()) {
        gc.loadTokenByFile(TOKEN_DIR);
        return gc;
    }
    if (!found) {
        throw new Error(
            'No saved tokens and no credentials: run `npm run test:live:login`'
        );
    }
    await gc.login(undefined, undefined, options);
    gc.exportTokenToFile(TOKEN_DIR);
    return gc;
}

/** One signed in client per test file, with tokens shared between files */
function liveClient() {
    signedIn = signedIn || signIn();
    return signedIn;
}

/** A read-only test: `liveTest('name', async (gc, t) => {})` */
function liveTest(name, body) {
    nodeTest(
        name,
        { skip: LIVE ? false : 'set GARMIN_LIVE=1', timeout: 60000 },
        async (t) => body(await liveClient(), t)
    );
}

/** A test that changes the account. It must delete whatever it creates. */
function liveWriteTest(name, body) {
    nodeTest(
        name,
        {
            skip: WRITES ? false : 'set GARMIN_LIVE=1 GARMIN_ALLOW_WRITES=1',
            timeout: 120000
        },
        async (t) => body(await liveClient(), t)
    );
}

module.exports = {
    liveTest,
    liveWriteTest,
    signIn,
    TOKEN_DIR
};
