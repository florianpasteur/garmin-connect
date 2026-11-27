// sendWorkoutToDevice is deliberately not tested here: nothing may reach a
// device. updateEvent and deleteEvent have no test because the library cannot
// create an event of its own to change.
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { liveTest, liveWriteTest } = require('../helpers/live');
const { load } = require('../helpers/dist');

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days) => new Date(Date.now() + days * DAY);
/** Local YYYY-MM-DD, like the library */
const localDay = (date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
        .toISOString()
        .slice(0, 10);

const isObject = (value) =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const assertObjectOrNull = (value) =>
    assert.ok(value === null || isObject(value));

/** Skips the test when Garmin answers with one of `statuses` */
async function unlessStatus(t, statuses, request) {
    try {
        return await request();
    } catch (error) {
        const status = statuses.find((s) => error.message.includes(`(${s})`));
        if (!status) throw error;
        t.skip(`Garmin answered ${status}`);
        return undefined;
    }
}

const monthItems = async (gc, date) =>
    (await gc.getMonthCalendarEvents(date.getFullYear(), date.getMonth()))
        .calendarItems || [];

/** First calendar item of a type, from this month and the two around it */
async function findCalendarItem(gc, itemType) {
    for (const offset of [0, -31, 31]) {
        const found = (await monthItems(gc, daysFromNow(offset))).find(
            (item) => item.itemType === itemType
        );
        if (found) return found;
    }
    return undefined;
}

const firstWorkoutId = async (gc) => {
    const [workout] = await gc.getWorkouts(0, 1);
    return workout && workout.workoutId;
};

liveTest('workouts can be listed', async (gc) => {
    assert.ok(Array.isArray(await gc.getWorkouts(0, 5)));
    assert.ok(Array.isArray(await gc.workouts()));
});

liveTest('a workout has segments', async (gc, t) => {
    const workoutId = await firstWorkoutId(gc);
    if (!workoutId) return t.skip('no workouts');
    const detail = await gc.getWorkoutDetail({ workoutId: String(workoutId) });
    assert.strictEqual(typeof detail.workoutName, 'string');
    assert.ok(Array.isArray(detail.workoutSegments));
});

liveTest('a workout downloads as a FIT file', async (gc, t) => {
    const workoutId = await firstWorkoutId(gc);
    if (!workoutId) return t.skip('no workouts');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-workout-'));
    try {
        const file = await gc.downloadWorkout(workoutId, dir);
        assert.ok(fs.statSync(file).size > 0);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

liveTest('workout types list sports and steps', async (gc) => {
    const types = await gc.getWorkoutTypes();
    assert.ok(Array.isArray(types.workoutSportTypes));
    assert.ok(Array.isArray(types.workoutStepTypes));
    assert.ok(Array.isArray(types.workoutTargetTypes));
});

liveTest('scheduled workouts of a period are a list', async (gc) => {
    const list = await gc.getScheduledWorkouts(
        daysFromNow(-30),
        daysFromNow(30)
    );
    assert.ok(Array.isArray(list));
});

liveTest('a scheduled workout can be read', async (gc, t) => {
    const item = await findCalendarItem(gc, 'workout');
    if (!item) return t.skip('nothing scheduled');
    assertObjectOrNull(await gc.getScheduledWorkout(item.id));
});

liveTest('the calendar can be read by year, month and week', async (gc) => {
    const now = new Date();
    const year = await gc.getYearCalendarEvents(now.getFullYear());
    assert.ok(Array.isArray(year.yearItems));
    assert.ok(Array.isArray(await monthItems(gc, now)));
    const week = await gc.getWeekCalendarEvents(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
    assert.ok(Array.isArray(week.calendarItems));
});

liveTest('a calendar note can be read', async (gc, t) => {
    const item = await findCalendarItem(gc, 'note');
    if (!item) return t.skip('no notes');
    assertObjectOrNull(await gc.getNote(item.id));
});

liveTest('upcoming events are a list', async (gc) => {
    assert.ok(Array.isArray(await gc.getUpcomingEvents(90, 5)));
});

liveTest('events answer', async (gc, t) => {
    // The query parameters are unknown, so a rejected request is not a failure
    const events = await unlessStatus(t, [400, 404], () => gc.getEvents());
    if (events !== undefined) {
        assert.ok(events === null || typeof events === 'object');
    }
});

liveTest('the primary event can be read', async (gc, t) => {
    const event = await unlessStatus(t, [404], () => gc.getPrimaryEvent());
    if (event !== undefined) assertObjectOrNull(event);
});

liveTest('an event can be read', async (gc, t) => {
    const [event] = await gc.getUpcomingEvents(365, 1);
    if (!event || !event.id) return t.skip('no upcoming event with an id');
    assertObjectOrNull(await gc.getEvent(event.id));
});

liveTest('training plans come with their search filter', async (gc) => {
    const plans = await gc.getTrainingPlans(5);
    assert.ok(Array.isArray(plans.trainingPlanList));
    assert.ok(isObject(plans.searchFilter));
});

for (const method of [
    'getTrainingPlan',
    'getAdaptiveTrainingPlan',
    'getPhasedTrainingPlan'
]) {
    liveTest(`${method} reads a listed plan`, async (gc, t) => {
        const { trainingPlanList } = await gc.getTrainingPlans(5);
        const plan = trainingPlanList[0];
        const planId = plan && (plan.trainingPlanId || plan.id);
        if (!planId) return t.skip('no training plan with an id');
        // A plan only answers on the path of its own kind
        const detail = await unlessStatus(t, [400, 404], () =>
            gc[method](planId)
        );
        if (detail !== undefined) assertObjectOrNull(detail);
    });
}

liveWriteTest(
    'a test workout is updated, copied, scheduled and removed',
    async (gc) => {
        const {
            WorkoutBuilder,
            WorkoutType,
            Step,
            StepType,
            TimeDuration,
            NoTarget
        } = load();
        // Unique to this run: cleanup only ever matches names starting with it
        const prefix = `gc-lib-test ${Date.now()}`;
        const workoutIds = [];
        const scheduleIds = [];
        const first = daysFromNow(30);
        const second = daysFromNow(31);
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gc-workout-'));

        const listTestWorkouts = async () =>
            (await gc.getWorkouts(0, 999)).filter(
                (w) => String(w.workoutName).indexOf(prefix) === 0
            );
        const remember = (id) => {
            if (id && workoutIds.indexOf(id) < 0) workoutIds.push(id);
        };

        try {
            const builder = new WorkoutBuilder(WorkoutType.Running, prefix);
            builder.addStep(
                new Step(
                    StepType.Run,
                    TimeDuration.fromSeconds(60),
                    new NoTarget(),
                    'test step'
                )
            );
            const created = await gc.createWorkout(builder.build());
            const workoutId = created.workoutId;
            assert.strictEqual(typeof workoutId, 'number');
            remember(workoutId);

            const detail = await gc.getWorkoutDetail({
                workoutId: String(workoutId)
            });
            const renamed = `${prefix} updated`;
            await gc.updateWorkout({ ...detail, workoutName: renamed });
            const updated = await gc.getWorkoutDetail({
                workoutId: String(workoutId)
            });
            assert.ok(updated.workoutName === renamed, 'name was not updated');

            const copyName = `${prefix} copy`;
            await gc.copyWorkout(workoutId, copyName);
            const copy = (await listTestWorkouts()).find(
                (w) => w.workoutName === copyName
            );
            assert.ok(copy, 'the copy is not listed');
            remember(copy.workoutId);
            assert.notStrictEqual(copy.workoutId, workoutId);

            const file = await gc.downloadWorkout(workoutId, dir);
            assert.ok(fs.statSync(file).size > 0);

            const scheduled = await gc.scheduleWorkout(
                { workoutId: String(workoutId) },
                localDay(first)
            );
            let scheduleId = scheduled && scheduled.workoutScheduleId;
            if (!scheduleId) {
                const item = (await monthItems(gc, first)).find(
                    (i) => i.itemType === 'workout' && i.workoutId === workoutId
                );
                scheduleId = item && item.id;
            }
            assert.ok(scheduleId, 'no schedule id found');
            scheduleIds.push(scheduleId);

            const entry = await gc.getScheduledWorkout(scheduleId);
            assert.ok(entry && entry.workout, 'the entry has no workout');
            assert.ok(entry.workout.workoutId === workoutId);

            await gc.rescheduleWorkout(scheduleId, second);
            const moved = await gc.getScheduledWorkout(scheduleId);
            assert.ok(moved.calendarDate === localDay(second), 'not moved');

            await gc.unscheduleWorkout(scheduleId);
            scheduleIds.pop();
        } finally {
            const failures = [];
            const attempt = (request) =>
                request().catch((error) => failures.push(error.message));
            for (const id of scheduleIds) {
                await attempt(() => gc.unscheduleWorkout(id));
            }
            scheduleIds.length = 0;
            // Also finds a workout whose id never reached the test
            await attempt(async () =>
                (await listTestWorkouts()).forEach((w) => remember(w.workoutId))
            );
            // Calendar entries of the test workouts whose id was never found
            for (const day of [first, second]) {
                await attempt(async () => {
                    for (const item of await monthItems(gc, day)) {
                        if (
                            item.itemType === 'workout' &&
                            workoutIds.indexOf(item.workoutId) >= 0 &&
                            scheduleIds.indexOf(item.id) < 0
                        ) {
                            scheduleIds.push(item.id);
                            await gc.unscheduleWorkout(item.id);
                        }
                    }
                });
            }
            for (const id of workoutIds) {
                await attempt(() =>
                    gc.deleteWorkout({ workoutId: String(id) })
                );
            }
            fs.rmSync(dir, { recursive: true, force: true });
            assert.deepStrictEqual(
                failures,
                [],
                `cleanup failed, remove "${prefix}" by hand`
            );
        }
    }
);

liveWriteTest('a test note is created, read and deleted', async (gc) => {
    const name = `gc-lib-test ${Date.now()}`;
    const day = daysFromNow(30);
    let noteId;
    const findNoteId = async () => {
        const item = (await monthItems(gc, day)).find(
            (i) => i.itemType === 'note' && i.title === name
        );
        return item && item.id;
    };
    try {
        const created = await gc.createNote(name, 'test note', day);
        noteId = (created && created.id) || (await findNoteId());
        assert.ok(noteId, 'no note id found');
        assert.ok(isObject(await gc.getNote(noteId)));
    } finally {
        noteId = noteId || (await findNoteId());
        if (noteId) await gc.deleteNote(noteId);
    }
});
