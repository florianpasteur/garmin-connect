// A local HTTP server standing in for connectapi.garmin.com, so that requests go
// through the real client: interceptors, query strings, bodies and headers.
const http = require('http');
const { load } = require('./dist');

const { GarminConnect } = load();

console.log = () => {};
console.error = () => {};

const PROFILE = { profileId: 1, displayName: 'tester' };

function readBody(request) {
    return new Promise((resolve) => {
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

function send(response, reply) {
    const { status = 200, body, headers = {} } = reply;
    if (body === undefined) {
        response.writeHead(status === 200 ? 204 : status, headers);
        return response.end();
    }
    const raw = Buffer.isBuffer(body) || typeof body === 'string';
    response.writeHead(status, {
        'Content-Type': raw ? 'application/octet-stream' : 'application/json',
        ...headers
    });
    response.end(raw ? body : JSON.stringify(body));
}

/**
 * @param routes - Keys are `METHOD /path` without the query string. Values are
 * the JSON body to answer with, or a function of the recorded request returning
 * `{ status, body, headers }`. A `body` of undefined answers 204. Requests
 * without a route get a 404.
 * @returns `{ gc, requests, close }`. Each recorded request has `method` (after
 * the X-Http-Method-Override header), `path`, `query` (an object), `search` (the
 * raw query string), `headers`,
 * `body` (parsed when JSON) and `rawBody`.
 */
async function fakeGarmin(routes = {}) {
    const requests = [];
    const all = {
        'GET /userprofile-service/socialProfile': PROFILE,
        ...routes
    };

    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, 'http://localhost');
        const rawBody = (await readBody(request)).toString();
        let body = rawBody || undefined;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            // not JSON
        }
        const record = {
            method: request.headers['x-http-method-override'] || request.method,
            path: decodeURIComponent(url.pathname),
            query: Object.fromEntries(url.searchParams),
            search: url.search,
            headers: request.headers,
            body,
            rawBody
        };
        requests.push(record);
        const key = `${record.method} ${record.path}`;
        if (!(key in all)) {
            return send(response, { status: 404, body: { message: key } });
        }
        const route = all[key];
        send(
            response,
            typeof route === 'function' ? route(record) : { body: route }
        );
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const gc = new GarminConnect({ username: 'user', password: 'password' });
    gc.url.GC_API = `http://127.0.0.1:${server.address().port}`;
    gc.url.GCX_API = `${gc.url.GC_API}/gcx`;
    gc.client.client.defaults.proxy = false;
    gc.client.oauth2Token = { access_token: 'test-token' };

    return {
        gc,
        requests,
        /** Requests other than the profile lookup */
        calls: () =>
            requests.filter(
                (r) => r.path !== '/userprofile-service/socialProfile'
            ),
        close: () =>
            new Promise((resolve) => {
                server.closeAllConnections();
                server.close(resolve);
            })
    };
}

/** Runs `body` against a fake Garmin and always shuts the server down */
async function withGarmin(routes, body) {
    const fake = await fakeGarmin(routes);
    try {
        await body(fake);
    } finally {
        await fake.close();
    }
}

module.exports = { fakeGarmin, withGarmin, PROFILE };
