// Read-only. There is no write test: goal and challenge payloads are unverified,
// weight and daily goals would overwrite existing data, and challenges and
// multi-day events can involve other people.
//
// Assertions compare types only, so a failure never prints account data.
const assert = require('node:assert');
const { liveTest } = require('../helpers/live');

const isObject = (value) => typeof value === 'object' && value !== null;

function assertList(value, check = () => {}) {
    assert.ok(Array.isArray(value), 'expected a list');
    value.forEach((entry) => {
        assert.ok(isObject(entry), 'expected list entries to be objects');
        check(entry);
    });
}

function assertTypes(entry, types) {
    Object.keys(types).forEach((key) => {
        assert.ok(typeof entry[key] === types[key], `type of ${key}`);
    });
}

const assertOptional = (value) =>
    assert.ok(value === null || isObject(value), 'expected an object or null');

const checkBadge = (badge) => {
    assertTypes(badge, {
        badgeId: 'number',
        badgeKey: 'string',
        badgeName: 'string',
        badgePoints: 'number'
    });
    assert.ok(Array.isArray(badge.badgeTypeIds), 'type of badgeTypeIds');
};

const checkChallenge = (challenge) =>
    assertTypes(challenge, {
        uuid: 'string',
        badgeChallengeName: 'string',
        userJoined: 'boolean',
        joinable: 'boolean'
    });

liveTest('getPersonalRecords returns a list', async (gc) => {
    assertList(await gc.getPersonalRecords());
});

liveTest('getPersonalRecordTypes returns record types', async (gc) => {
    assertList(await gc.getPersonalRecordTypes(), (type) =>
        assertTypes(type, {
            id: 'number',
            key: 'string',
            visible: 'boolean',
            sport: 'string'
        })
    );
});

liveTest('getGoals returns a list for every status', async (gc) => {
    for (const status of ['active', 'future', 'past']) {
        assertList(await gc.getGoals(status));
    }
});

liveTest('getDailyStepGoal returns a goal or null', async (gc) => {
    assertOptional(await gc.getDailyStepGoal());
});

liveTest('getEffectiveGoals returns the goals of today', async (gc) => {
    const goals = await gc.getEffectiveGoals();
    assert.ok(Array.isArray(goals));
    assert.ok(goals.every((goal) => typeof goal.goalType === 'string'));
});

liveTest('getEarnedBadges returns badges', async (gc) => {
    assertList(await gc.getEarnedBadges(), checkBadge);
});

liveTest('getAvailableBadges returns badges', async (gc) => {
    assertList(await gc.getAvailableBadges(), checkBadge);
});

[
    'getAvailableBadgeChallenges',
    'getCompletedBadgeChallenges',
    'getNonCompletedBadgeChallenges',
    'getAvailableVirtualChallenges'
].forEach((method) => {
    liveTest(`${method} returns challenges`, async (gc) => {
        assertList(await gc[method](), checkChallenge);
    });
});

liveTest('getHistoricalAdHocChallenges returns a list', async (gc) => {
    assertList(await gc.getHistoricalAdHocChallenges());
});

liveTest('getNonCompletedAdHocChallenges returns a list', async (gc) => {
    assertList(await gc.getNonCompletedAdHocChallenges());
});

liveTest('getMultiDayActivities returns events or null', async (gc) => {
    assertOptional(await gc.getMultiDayActivities());
});

/** The id of the first multi-day event, whose list shape is unverified */
async function firstEventId(gc) {
    const events = await gc.getMultiDayActivities();
    const first = Array.isArray(events) ? events[0] : undefined;
    return first && (first.id || first.multiDayActivityId);
}

liveTest('getMultiDayActivity returns an event', async (gc, t) => {
    const id = await firstEventId(gc);
    if (!id) {
        return t.skip('no multi-day event id found');
    }
    assertOptional(await gc.getMultiDayActivity(id));
});

liveTest('getActivitiesOfMultiDayActivity answers', async (gc, t) => {
    const id = await firstEventId(gc);
    if (!id) {
        return t.skip('no multi-day event id found');
    }
    assertOptional(await gc.getActivitiesOfMultiDayActivity(id));
});
