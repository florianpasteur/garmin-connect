const test = require('node:test');
const assert = require('node:assert');
const { withGarmin } = require('../helpers/fake-garmin');

const date = (day) => new Date(day + 'T12:00:00Z');

const badge = {
    badgeId: 11,
    badgeKey: 'sample_badge',
    badgeName: 'Sample Badge',
    badgeUuid: null,
    badgeCategoryId: 2,
    badgeDifficultyId: 1,
    badgePoints: 4,
    badgeTypeIds: [1, 3]
};

const earnedBadge = {
    ...badge,
    badgeSeriesId: null,
    badgeStartDate: '2026-01-01T00:00:00.0',
    badgeEndDate: null,
    userProfileId: 1,
    fullName: 'Test Person',
    displayName: 'tester',
    badgeEarnedDate: '2026-01-02T08:00:00.0',
    badgeEarnedNumber: 1,
    premium: false,
    reprocessable: false,
    badgeProgressValue: 5,
    badgeTargetValue: null,
    badgeAssocTypeId: 1,
    badgeAssocType: 'activityId',
    badgeAssocDataId: null,
    earnedByMe: true,
    createDate: '2026-01-02T08:00:00.0'
};

const challenge = {
    uuid: 'abc123',
    badgeChallengeName: 'Sample Challenge',
    challengeCategoryId: 1,
    badgeChallengeStatusId: 2,
    startDate: null,
    endDate: null,
    createDate: '2026-01-01T00:00:00.0',
    updateDate: '2026-01-01T00:00:00.0',
    badgeId: 12,
    badgeKey: 'sample_challenge',
    badgeUuid: 'def456',
    badgePoints: 1,
    badgeUnitId: 1,
    badgeProgressValue: null,
    badgeEarnedDate: null,
    badgeTargetValue: 100,
    badgeTypeIds: [],
    userJoined: false,
    joinable: true,
    premium: false
};

/** Calls a read method and checks it sent exactly one GET without a query */
async function checkRead(path, reply, call) {
    await withGarmin({ [`GET ${path}`]: reply }, async ({ gc, calls }) => {
        assert.deepStrictEqual(await call(gc), reply);
        assert.deepStrictEqual(
            calls().map((r) => [r.method, r.path, r.query]),
            [['GET', path, {}]]
        );
    });
}

/** Asserts that `call` rejects and that nothing was sent */
async function checkRejected(call, message) {
    await withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(call(gc), message);
        assert.strictEqual(requests.length, 0);
    });
}

test('getPersonalRecords reads the records of the signed in user', () =>
    checkRead(
        '/personalrecord-service/personalrecord/prs/tester',
        [{ id: 1 }],
        (gc) => gc.getPersonalRecords()
    ));

test('getPersonalRecordTypes reads the types for the signed in user', () =>
    checkRead(
        '/personalrecord-service/personalrecordtype/prtypes/tester',
        [
            {
                id: 1,
                key: 'pr.label.sample',
                visible: true,
                sport: 'RUNNING',
                minValue: 0,
                maxValue: 100
            }
        ],
        (gc) => gc.getPersonalRecordTypes()
    ));

test('getGoals asks for active goals by default', () =>
    withGarmin(
        { 'GET /goal-service/goal/goals': [] },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getGoals(), []);
            assert.deepStrictEqual(calls()[0].query, { status: 'active' });
        }
    ));

test('getGoals passes the status and the paging options', () =>
    withGarmin(
        { 'GET /goal-service/goal/goals': [] },
        async ({ gc, calls }) => {
            await gc.getGoals('past', {
                start: 0,
                limit: 10,
                sortOrder: 'asc'
            });
            await gc.getGoals('future');
            assert.deepStrictEqual(
                calls().map((r) => r.query),
                [
                    {
                        status: 'past',
                        start: '0',
                        limit: '10',
                        sortOrder: 'asc'
                    },
                    { status: 'future' }
                ]
            );
        }
    ));

test('createGoal posts the goal as given', () =>
    withGarmin(
        { 'POST /goal-service/goal/goal': { id: 7 } },
        async ({ gc, calls }) => {
            const goal = { goalValue: 10, anything: 'else' };
            assert.deepStrictEqual(await gc.createGoal(goal), { id: 7 });
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'POST');
            assert.deepStrictEqual(calls()[0].body, goal);
        }
    ));

test('createGoal needs a goal', () =>
    checkRejected((gc) => gc.createGoal(), /Missing goal/));

test('deleteGoal deletes the goal by id', () =>
    withGarmin(
        { 'DELETE /goal-service/goal/goal/42': undefined },
        async ({ gc, calls }) => {
            assert.strictEqual(await gc.deleteGoal(42), undefined);
            assert.deepStrictEqual(
                calls().map((r) => [r.method, r.path, r.rawBody]),
                [['DELETE', '/goal-service/goal/goal/42', '']]
            );
        }
    ));

test('deleteGoal needs an id', () =>
    checkRejected((gc) => gc.deleteGoal(), /Missing goalId/));

test('string ids cannot change the request path or query', () =>
    withGarmin(
        { 'DELETE /goal-service/goal/goal/1?x=2': undefined },
        async ({ gc, calls }) => {
            await gc.deleteGoal('1?x=2');
            assert.deepStrictEqual(calls()[0].query, {});
        }
    ));

test('getDailyStepGoal reads the goal of the day', () =>
    checkRead(
        '/wellness-service/wellness/wellness-goals/consolidated/steps/2026-03-04',
        { value: 8000 },
        (gc) => gc.getDailyStepGoal(date('2026-03-04'))
    ));

test('getDailyStepGoal turns 204 into null', () =>
    withGarmin(
        {
            'GET /wellness-service/wellness/wellness-goals/consolidated/steps/2026-03-04':
                undefined
        },
        async ({ gc }) => {
            assert.strictEqual(
                await gc.getDailyStepGoal(date('2026-03-04')),
                null
            );
        }
    ));

test('updateDailyWellnessGoal puts the goal for the date', () =>
    withGarmin(
        {
            'PUT /wellness-service/wellness/wellness-goals/consolidated/2026-03-04':
                { ok: true }
        },
        async ({ gc, calls }) => {
            const goal = { value: 9000 };
            assert.deepStrictEqual(
                await gc.updateDailyWellnessGoal(date('2026-03-04'), goal),
                { ok: true }
            );
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'PUT');
            assert.deepStrictEqual(calls()[0].body, goal);
        }
    ));

test('updateDailyWellnessGoal needs a date and a goal', async () => {
    await checkRejected(
        (gc) => gc.updateDailyWellnessGoal(undefined, {}),
        /Missing date/
    );
    await checkRejected(
        (gc) => gc.updateDailyWellnessGoal(date('2026-03-04')),
        /Missing goal/
    );
});

test('getEffectiveGoals reads the goals of a date', () =>
    checkRead(
        '/goal-service/goal/user/effective/2026-03-04',
        [{ goalType: 'STEPS', goalValue: 8000 }],
        (gc) => gc.getEffectiveGoals(date('2026-03-04'))
    ));

test('setWeightGoal puts the weight in grams for the start date', () =>
    withGarmin(
        {
            'PUT /goal-service/goal/user/effective/WEIGHT_GRAMS/2026-03-04':
                undefined
        },
        async ({ gc, calls }) => {
            await gc.setWeightGoal(70000, date('2026-03-04'));
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'PUT');
            assert.deepStrictEqual(calls()[0].body, {
                goalValue: 70000,
                goalType: 'WEIGHT_GRAMS'
            });
        }
    ));

test('setWeightGoal needs a positive weight', async () => {
    for (const value of [undefined, 0, -1, NaN]) {
        await checkRejected(
            (gc) => gc.setWeightGoal(value),
            /Missing goalInGrams/
        );
    }
});

test('getEarnedBadges lists earned badges', () =>
    checkRead('/badge-service/badge/earned', [earnedBadge], (gc) =>
        gc.getEarnedBadges()
    ));

test('getAvailableBadges lists available badges', () =>
    checkRead('/badge-service/badge/available', [badge], (gc) =>
        gc.getAvailableBadges()
    ));

[
    ['getAvailableBadgeChallenges', 'badgeChallenge/available'],
    ['getCompletedBadgeChallenges', 'badgeChallenge/completed'],
    ['getNonCompletedBadgeChallenges', 'badgeChallenge/non-completed'],
    ['getAvailableVirtualChallenges', 'virtualChallenge/available']
].forEach(([method, path]) => {
    test(`${method} reads ${path}`, () =>
        checkRead(`/badgechallenge-service/${path}`, [challenge], (gc) =>
            gc[method]()
        ));
});

test('joinBadgeChallenge posts an empty opt in for the date', () =>
    withGarmin(
        {
            'POST /badgechallenge-service/badgeChallenge/abc123/optIn/2026-03-04':
                undefined
        },
        async ({ gc, calls }) => {
            await gc.joinBadgeChallenge('abc123', date('2026-03-04'));
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'POST');
            assert.strictEqual(calls()[0].rawBody, '');
            assert.strictEqual(calls()[0].headers['content-type'], 'text/html');
        }
    ));

test('joinBadgeChallenge needs a uuid', () =>
    checkRejected((gc) => gc.joinBadgeChallenge(''), /Missing challengeUuid/));

[
    ['getHistoricalAdHocChallenges', 'historical'],
    ['getNonCompletedAdHocChallenges', 'nonCompleted']
].forEach(([method, path]) => {
    test(`${method} reads the ${path} challenges`, () =>
        checkRead(
            `/adhocchallenge-service/adHocChallenge/${path}`,
            [{ uuid: 'abc123' }],
            (gc) => gc[method]()
        ));
});

test('createAdHocChallenge posts the challenge as given', () =>
    withGarmin(
        { 'POST /adhocchallenge-service/adHocChallenge': { uuid: 'new' } },
        async ({ gc, calls }) => {
            const payload = { name: 'Sample', players: [] };
            assert.deepStrictEqual(await gc.createAdHocChallenge(payload), {
                uuid: 'new'
            });
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'POST');
            assert.deepStrictEqual(calls()[0].body, payload);
        }
    ));

test('createAdHocChallenge needs a challenge', () =>
    checkRejected((gc) => gc.createAdHocChallenge(), /Missing challenge/));

test('getMultiDayActivities lists the events', () =>
    checkRead(
        '/multidayactivity-service/multi-day-activity/list',
        [{ id: 5 }],
        (gc) => gc.getMultiDayActivities()
    ));

test('getMultiDayActivities turns 204 into null', () =>
    withGarmin(
        { 'GET /multidayactivity-service/multi-day-activity/list': undefined },
        async ({ gc }) => {
            assert.strictEqual(await gc.getMultiDayActivities(), null);
        }
    ));

test('getMultiDayActivity reads one event', () =>
    checkRead(
        '/multidayactivity-service/multi-day-activity/5',
        { id: 5 },
        (gc) => gc.getMultiDayActivity(5)
    ));

test('getActivitiesOfMultiDayActivity reads the activities of an event', () =>
    checkRead(
        '/multidayactivity-service/multi-day-activity/5/activities',
        [{ activityId: 9 }],
        (gc) => gc.getActivitiesOfMultiDayActivity(5)
    ));

test('reading one event turns 204 into null', () =>
    withGarmin(
        {
            'GET /multidayactivity-service/multi-day-activity/5': undefined,
            'GET /multidayactivity-service/multi-day-activity/5/activities':
                undefined
        },
        async ({ gc }) => {
            assert.strictEqual(await gc.getMultiDayActivity(5), null);
            assert.strictEqual(
                await gc.getActivitiesOfMultiDayActivity(5),
                null
            );
        }
    ));

test('createMultiDayActivity builds the request for the signed in user', () =>
    withGarmin(
        {
            'POST /multidayactivity-service/multi-day-activity': { id: 5 }
        },
        async ({ gc, calls }) => {
            const created = await gc.createMultiDayActivity({
                name: 'Sample trip',
                summary: 'Three days',
                startDate: date('2026-03-04'),
                endDate: date('2026-03-06'),
                accessControlRule: 'sample-rule',
                shareLiveTrack: true,
                courseIds: [3],
                activityIds: [9, 10]
            });
            assert.deepStrictEqual(created, { id: 5 });
            assert.strictEqual(calls().length, 1);
            assert.strictEqual(calls()[0].method, 'POST');
            assert.deepStrictEqual(calls()[0].body, {
                userId: 1,
                name: 'Sample trip',
                summary: 'Three days',
                startDate: '2026-03-04',
                endDate: '2026-03-06',
                accessControlRule: 'sample-rule',
                shareLiveTrack: true,
                courseIds: [3],
                activityIds: [9, 10]
            });
        }
    ));

test('createMultiDayActivity shares nothing extra by default', () =>
    withGarmin(
        {
            'POST /multidayactivity-service/multi-day-activity': { id: 5 }
        },
        async ({ gc, calls }) => {
            await gc.createMultiDayActivity({
                name: 'Day out',
                startDate: date('2026-03-04'),
                endDate: date('2026-03-04'),
                accessControlRule: { id: 1 }
            });
            assert.deepStrictEqual(calls()[0].body, {
                userId: 1,
                name: 'Day out',
                summary: '',
                startDate: '2026-03-04',
                endDate: '2026-03-04',
                accessControlRule: { id: 1 },
                shareLiveTrack: false,
                courseIds: [],
                activityIds: []
            });
        }
    ));

test('createMultiDayActivity validates the event before any request', async () => {
    const valid = {
        name: 'Sample trip',
        startDate: date('2026-03-04'),
        endDate: date('2026-03-06'),
        accessControlRule: 'sample-rule'
    };
    const cases = [
        [{ name: '' }, /Missing name/],
        [{ startDate: undefined }, /Missing startDate or endDate/],
        [{ endDate: undefined }, /Missing startDate or endDate/],
        [{ accessControlRule: undefined }, /Missing accessControlRule/],
        [{ endDate: date('2026-03-03') }, /startDate is after endDate/]
    ];
    for (const [change, message] of cases) {
        await checkRejected(
            (gc) => gc.createMultiDayActivity({ ...valid, ...change }),
            message
        );
    }
});

test('deleteMultiDayActivity deletes the event by id', () =>
    withGarmin(
        {
            'DELETE /multidayactivity-service/multi-day-activity/5': undefined
        },
        async ({ gc, calls }) => {
            assert.strictEqual(await gc.deleteMultiDayActivity(5), undefined);
            assert.deepStrictEqual(
                calls().map((r) => [r.method, r.path, r.rawBody]),
                [
                    [
                        'DELETE',
                        '/multidayactivity-service/multi-day-activity/5',
                        ''
                    ]
                ]
            );
        }
    ));

test('multi-day event methods need an id', async () => {
    for (const method of [
        'getMultiDayActivity',
        'getActivitiesOfMultiDayActivity',
        'deleteMultiDayActivity'
    ]) {
        await checkRejected((gc) => gc[method](), /Missing multiDayActivityId/);
    }
});

test('server errors reach the caller', () =>
    withGarmin({}, async ({ gc }) => {
        await assert.rejects(gc.getEarnedBadges(), /404/);
    }));
