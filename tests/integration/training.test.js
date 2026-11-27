const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { withGarmin } = require('../helpers/fake-garmin');

const date = (day) => new Date(day + 'T12:00:00Z');

/** The only request made, as `[verb, path]` */
const only = (calls) => {
    assert.strictEqual(calls().length, 1);
    return [calls()[0].method, calls()[0].path];
};

test('updateWorkout puts the whole workout', () => {
    const workout = {
        workoutId: 101,
        workoutName: 'Intervals',
        sportType: { sportTypeId: 1, sportTypeKey: 'running' },
        workoutSegments: []
    };
    return withGarmin(
        { 'PUT /workout-service/workout/101': undefined },
        async ({ gc, calls }) => {
            await gc.updateWorkout(workout);
            assert.deepStrictEqual(only(calls), [
                'PUT',
                '/workout-service/workout/101'
            ]);
            assert.deepStrictEqual(calls()[0].body, workout);
        }
    );
});

test('copyWorkout posts the new name as plain text', () =>
    withGarmin(
        { 'POST /workout-service/workout/copy/101': { workoutId: 102 } },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.copyWorkout(101, 'Séance copiée'), {
                workoutId: 102
            });
            assert.deepStrictEqual(only(calls), [
                'POST',
                '/workout-service/workout/copy/101'
            ]);
            assert.strictEqual(calls()[0].rawBody, 'Séance copiée');
            assert.strictEqual(
                calls()[0].headers['content-type'],
                'text/plain'
            );
        }
    ));

test('downloadWorkout writes the bytes to <id>.fit', async () => {
    const bytes = Buffer.from([14, 16, 0, 255, 128, 46, 70, 73, 84]);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-workout-'));
    const dir = path.join(root, 'new');
    try {
        await withGarmin(
            {
                'GET /workout-service/workout/FIT/101': () => ({ body: bytes })
            },
            async ({ gc, calls }) => {
                const file = await gc.downloadWorkout(101, dir);
                assert.strictEqual(file, path.join(dir, '101.fit'));
                assert.deepStrictEqual(fs.readFileSync(file), bytes);
                assert.deepStrictEqual(only(calls), [
                    'GET',
                    '/workout-service/workout/FIT/101'
                ]);
            }
        );
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('downloadWorkout creates nothing when the request fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-workout-'));
    const dir = path.join(root, 'new');
    try {
        await withGarmin({}, async ({ gc }) => {
            await assert.rejects(gc.downloadWorkout(101, dir), /404/);
            assert.strictEqual(fs.existsSync(dir), false);
        });
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('getWorkoutTypes reads the lookup tables', () => {
    const types = {
        workoutStepTypes: [{ stepTypeId: 1, stepTypeKey: 'warmup' }],
        workoutSportTypes: []
    };
    return withGarmin(
        { 'GET /workout-service/workout/types': types },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getWorkoutTypes(), types);
            only(calls);
        }
    );
});

test('getScheduledWorkouts sends the period', () =>
    withGarmin(
        { 'GET /workout-service/schedule/workoutScheduleByPeriod': [] },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(
                await gc.getScheduledWorkouts(
                    date('2026-01-01'),
                    date('2026-01-31')
                ),
                []
            );
            assert.deepStrictEqual(calls()[0].query, {
                startDate: '2026-01-01',
                endDate: '2026-01-31'
            });
        }
    ));

test('getScheduledWorkout reads an entry and turns 204 into null', () =>
    withGarmin(
        {
            'GET /workout-service/schedule/5': { calendarDate: '2026-01-01' },
            'GET /workout-service/schedule/6': undefined
        },
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.getScheduledWorkout(5), {
                calendarDate: '2026-01-01'
            });
            assert.strictEqual(await gc.getScheduledWorkout('6'), null);
        }
    ));

test('unscheduleWorkout deletes the calendar entry', () =>
    withGarmin(
        { 'DELETE /workout-service/schedule/5': undefined },
        async ({ gc, calls }) => {
            await gc.unscheduleWorkout(5);
            assert.deepStrictEqual(only(calls), [
                'DELETE',
                '/workout-service/schedule/5'
            ]);
        }
    ));

test('rescheduleWorkout writes the entry back with the new date', () =>
    withGarmin(
        {
            'GET /workout-service/schedule/5': {
                workoutScheduleId: 5,
                calendarDate: '2026-01-01',
                workout: { workoutId: 101, workoutName: 'Intervals' }
            },
            'PUT /workout-service/schedule/5': undefined
        },
        async ({ gc, calls }) => {
            await gc.rescheduleWorkout(5, date('2026-02-03'));
            assert.deepStrictEqual(
                calls().map((r) => r.method),
                ['GET', 'PUT']
            );
            assert.deepStrictEqual(calls()[1].body, {
                workoutScheduleId: 5,
                calendarDate: '2026-02-03',
                workout: { workoutId: 101 }
            });
        }
    ));

test('rescheduleWorkout writes nothing without a workoutId', () =>
    withGarmin(
        {
            'GET /workout-service/schedule/5': { calendarDate: '2026-01-01' },
            'GET /workout-service/schedule/6': undefined
        },
        async ({ gc, calls }) => {
            for (const id of [5, 6]) {
                await assert.rejects(
                    gc.rescheduleWorkout(id, date('2026-02-03')),
                    /no workoutId/
                );
            }
            await assert.rejects(gc.rescheduleWorkout(5), /Missing date/);
            assert.deepStrictEqual(
                calls().map((r) => r.method),
                ['GET', 'GET']
            );
        }
    ));

const deviceMessage = (messageName) => [
    {
        deviceId: 900,
        messageUrl: 'workout-service/workout/FIT/101',
        messageType: 'workouts',
        messageName,
        groupName: null,
        priority: 1,
        fileType: 'FIT',
        metaDataId: 101
    }
];

test('sendWorkoutToDevice posts an array holding one message', () =>
    withGarmin(
        { 'POST /devicemessage-service/devicemessage/messages': [] },
        async ({ gc, calls }) => {
            await gc.sendWorkoutToDevice('101', '900', 'Today');
            assert.deepStrictEqual(only(calls), [
                'POST',
                '/devicemessage-service/devicemessage/messages'
            ]);
            assert.deepStrictEqual(calls()[0].body, deviceMessage('Today'));
        }
    ));

test('sendWorkoutToDevice names the message after the workout', () =>
    withGarmin(
        {
            'GET /workout-service/workout/101': { workoutName: 'Intervals' },
            'POST /devicemessage-service/devicemessage/messages': []
        },
        async ({ gc, calls }) => {
            await gc.sendWorkoutToDevice(101, 900);
            assert.deepStrictEqual(calls()[1].body, deviceMessage('Intervals'));
        }
    ));

test('createNote posts the note with its day', () =>
    withGarmin(
        { 'POST /calendar-service/note': { id: 7 } },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(
                await gc.createNote('Rest', 'Easy day', date('2026-01-05')),
                { id: 7 }
            );
            assert.deepStrictEqual(only(calls), [
                'POST',
                '/calendar-service/note'
            ]);
            assert.deepStrictEqual(calls()[0].body, {
                noteName: 'Rest',
                content: 'Easy day',
                date: '2026-01-05',
                id: null
            });
        }
    ));

test('createNote defaults to today', () =>
    withGarmin(
        { 'POST /calendar-service/note': { id: 7 } },
        async ({ gc, calls }) => {
            await gc.createNote('Rest', '');
            assert.match(calls()[0].body.date, /^\d{4}-\d{2}-\d{2}$/);
            assert.strictEqual(calls()[0].body.content, '');
        }
    ));

test('getNote and deleteNote address the note by id', () =>
    withGarmin(
        {
            'GET /calendar-service/note/7': { id: 7 },
            'GET /calendar-service/note/8': undefined,
            'DELETE /calendar-service/note/7': undefined
        },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getNote(7), { id: 7 });
            assert.strictEqual(await gc.getNote(8), null);
            await gc.deleteNote(7);
            assert.deepStrictEqual(
                calls().map((r) => `${r.method} ${r.path}`),
                [
                    'GET /calendar-service/note/7',
                    'GET /calendar-service/note/8',
                    'DELETE /calendar-service/note/7'
                ]
            );
        }
    ));

test('getUpcomingEvents sends the window, with defaults', () =>
    withGarmin(
        { 'GET /calendar-service/events/upcoming': [] },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(
                await gc.getUpcomingEvents(14, 3, date('2026-01-05')),
                []
            );
            await gc.getUpcomingEvents();
            assert.deepStrictEqual(calls()[0].query, {
                numDaysForward: '14',
                limit: '3',
                startDate: '2026-01-05'
            });
            assert.strictEqual(calls()[1].query.numDaysForward, '30');
            assert.strictEqual(calls()[1].query.limit, '10');
            assert.match(calls()[1].query.startDate, /^\d{4}-\d{2}-\d{2}$/);
        }
    ));

test('getEvents passes the query parameters through', () =>
    withGarmin(
        { 'GET /calendar-service/events': [{ id: 3 }] },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getEvents({ limit: 5 }), [
                { id: 3 }
            ]);
            await gc.getEvents();
            assert.deepStrictEqual(calls()[0].query, { limit: '5' });
            assert.deepStrictEqual(calls()[1].query, {});
        }
    ));

test('getPrimaryEvent turns 204 into null', () =>
    withGarmin(
        { 'GET /calendar-service/event/primary': undefined },
        async ({ gc, calls }) => {
            assert.strictEqual(await gc.getPrimaryEvent(), null);
            only(calls);
        }
    ));

test('events are read, replaced and deleted by id', () =>
    withGarmin(
        {
            'GET /calendar-service/event/3': { id: 3 },
            'PUT /calendar-service/event/3': { id: 3 },
            'DELETE /calendar-service/event/3': undefined
        },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getEvent(3), { id: 3 });
            await gc.updateEvent(3, { id: 3, eventName: 'Race' });
            await gc.deleteEvent(3);
            assert.deepStrictEqual(
                calls().map((r) => r.method),
                ['GET', 'PUT', 'DELETE']
            );
            assert.deepStrictEqual(calls()[1].body, {
                id: 3,
                eventName: 'Race'
            });
        }
    ));

test('getTrainingPlans sends the limit', () => {
    const plans = {
        trainingPlanList: [],
        searchFilter: { ownerId: 1, start: 0, limit: 100 }
    };
    return withGarmin(
        { 'GET /trainingplan-service/trainingplan/plans': plans },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(await gc.getTrainingPlans(), plans);
            await gc.getTrainingPlans(5);
            assert.deepStrictEqual(
                calls().map((r) => r.query),
                [{ limit: '100' }, { limit: '5' }]
            );
        }
    );
});

test('each kind of training plan has its own path', () =>
    withGarmin(
        {
            'GET /trainingplan-service/trainingplan/11': { id: 11 },
            'GET /trainingplan-service/trainingplan/fbt-adaptive/12': {
                id: 12
            },
            'GET /trainingplan-service/trainingplan/phased/13': undefined
        },
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.getTrainingPlan(11), { id: 11 });
            assert.deepStrictEqual(await gc.getAdaptiveTrainingPlan(12), {
                id: 12
            });
            assert.strictEqual(await gc.getPhasedTrainingPlan(13), null);
        }
    ));

test('ids cannot add to the path or the query', () =>
    withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(gc.getNote('1?x=2'), /404/);
        assert.strictEqual(requests[0].path, '/calendar-service/note/1?x=2');
        assert.deepStrictEqual(requests[0].query, {});
    }));

test('missing arguments are rejected before any request', () =>
    withGarmin({}, async ({ gc, requests }) => {
        const day = date('2026-01-01');
        const cases = [
            [() => gc.updateWorkout({ workoutName: 'x' }), /workoutId/],
            [() => gc.copyWorkout(0, 'x'), /workoutId/],
            [() => gc.copyWorkout(1, ''), /name/],
            [() => gc.downloadWorkout('', '/tmp'), /workoutId/],
            [() => gc.downloadWorkout(1, ''), /dir/],
            [() => gc.downloadWorkout(1, '/tmp', 'ZIP'), /Invalid type/],
            [() => gc.getScheduledWorkouts(day), /date range/],
            [() => gc.getScheduledWorkout(0), /scheduleId/],
            [() => gc.unscheduleWorkout(''), /scheduleId/],
            [() => gc.rescheduleWorkout(0, day), /scheduleId/],
            [() => gc.sendWorkoutToDevice('abc', 1), /workoutId/],
            [() => gc.sendWorkoutToDevice(1, 0), /deviceId/],
            [() => gc.createNote('', 'x'), /noteName/],
            [() => gc.getNote(0), /noteId/],
            [() => gc.deleteNote(''), /noteId/],
            [() => gc.getEvent(0), /eventId/],
            [() => gc.updateEvent(0, {}), /eventId/],
            [() => gc.updateEvent(1), /Missing event/],
            [() => gc.deleteEvent(0), /eventId/],
            [() => gc.getTrainingPlan(0), /planId/],
            [() => gc.getAdaptiveTrainingPlan(0), /planId/],
            [() => gc.getPhasedTrainingPlan(0), /planId/]
        ];
        for (const [call, message] of cases) {
            await assert.rejects(call(), message);
        }
        assert.strictEqual(requests.length, 0);
    }));
