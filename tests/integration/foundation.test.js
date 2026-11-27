const test = require('node:test');
const assert = require('node:assert');
const { withGarmin } = require('../helpers/fake-garmin');
const { load } = require('../helpers/dist');

const { splitDateRange } = load('garmin/common/DateUtils');

const date = (day) => new Date(day + 'T12:00:00Z');

test('requests are authorised with the OAuth2 token', () =>
    withGarmin({ 'GET /x': { ok: true } }, async ({ gc, requests }) => {
        assert.deepStrictEqual(await gc.get(gc.url.GC_API + '/x'), {
            ok: true
        });
        assert.strictEqual(
            requests[0].headers.authorization,
            'Bearer test-token'
        );
    }));

test('delete and patch use the method override header', () =>
    withGarmin(
        { 'DELETE /x': undefined, 'PATCH /x': { ok: 1 } },
        async ({ gc, requests }) => {
            await gc.delete(gc.url.GC_API + '/x');
            await gc.patch(gc.url.GC_API + '/x', { name: 'n' });
            assert.deepStrictEqual(
                requests.map((r) => r.method),
                ['DELETE', 'PATCH']
            );
            assert.deepStrictEqual(requests[1].body, { name: 'n' });
        }
    ));

test('graphql returns data and throws on errors', () =>
    withGarmin(
        {
            'POST /graphql-gateway/graphql': (r) =>
                r.body.query === 'good'
                    ? { body: { data: { a: 1 } } }
                    : { body: { errors: [{ message: 'nope' }] } }
        },
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.graphql('good'), { a: 1 });
            await assert.rejects(gc.graphql('bad'), /graphql: nope/);
        }
    ));

test('the profile is fetched once and again after a new token', () =>
    withGarmin({}, async ({ gc, requests }) => {
        assert.strictEqual(await gc.getDisplayName(), 'tester');
        assert.strictEqual(await gc.getProfileId(), 1);
        assert.strictEqual(requests.length, 1);
        gc.loadToken({}, { access_token: 'other' });
        await gc.getProfileId();
        assert.strictEqual(requests.length, 2);
    }));

test('getOptional turns 204 into null', () =>
    withGarmin({ 'GET /empty': undefined }, async ({ gc }) => {
        assert.strictEqual(
            await gc.getOptional(gc.url.GC_API + '/empty'),
            null
        );
    }));

test('long ranges are split into chunks of at most maxDays', () => {
    assert.deepStrictEqual(
        splitDateRange(date('2026-01-01'), date('2026-03-01'), 28),
        [
            { start: '2026-01-01', end: '2026-01-28' },
            { start: '2026-01-29', end: '2026-02-25' },
            { start: '2026-02-26', end: '2026-03-01' }
        ]
    );
    assert.deepStrictEqual(
        splitDateRange(date('2026-01-01'), date('2026-01-01'), 28),
        [{ start: '2026-01-01', end: '2026-01-01' }]
    );
    assert.throws(() =>
        splitDateRange(date('2026-01-02'), date('2026-01-01'), 28)
    );
});

test('requestByDateRange skips empty chunks', () =>
    withGarmin({}, async ({ gc }) => {
        const seen = [];
        const results = await gc.requestByDateRange(
            date('2026-01-01'),
            date('2026-01-05'),
            2,
            async (start, end) => {
                seen.push(`${start}/${end}`);
                return seen.length === 2 ? null : seen.length;
            }
        );
        assert.strictEqual(seen.length, 3);
        assert.deepStrictEqual(results, [1, 3]);
    }));
