// The write test creates a dog and an activity of its own and deletes both. Only
// booleans, types and the made up values it wrote are asserted.
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert');
const { liveTest, liveWriteTest } = require('../helpers/live');

const isArray = (value) => assert.ok(Array.isArray(value), 'expected a list');

/** Retries a read until `done` is true, Garmin indexes changes with a delay */
async function eventually(read, done) {
    for (let attempt = 0; attempt < 10; attempt++) {
        if (done(await read())) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    assert.fail('the change did not show up');
}

liveTest('getDogs', async (gc) => {
    isArray(await gc.getDogs());
});

liveTest('getDogs, active ones', async (gc) => {
    const dogs = await gc.getDogs({ status: 'active' });
    assert.ok(dogs.every((dog) => dog.status === 'active'));
});

liveTest('getDogBreeds', async (gc) => {
    const breeds = await gc.getDogBreeds();
    assert.ok(breeds.length > 100);
});

liveTest('getDogStatsTotals', async (gc) => {
    const totals = await gc.getDogStatsTotals();
    isArray(totals.stats.all.animals.animalProfileGroups);
});

liveTest('getDogPhysioSettings', async (gc) => {
    isArray(await gc.getDogPhysioSettings());
});

liveTest('getDogActivitiesSetting', async (gc) => {
    const setting = await gc.getDogActivitiesSetting();
    assert.ok(setting === null || /^OPT_/.test(setting.userOptionType));
});

liveTest('searchActivities with a dog', async (gc) => {
    const activities = await gc.searchActivities({ hasDog: true, limit: 5 });
    assert.ok(activities.every((activity) => activity.hasDog));
});

liveWriteTest('a dog from creation to deletion', async (gc, t) => {
    if ((await gc.getDogs({ status: 'active' })).length >= 10) {
        return t.skip('the web app allows 10 active dogs');
    }
    // A 1x1 PNG
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'garmin-dog-'));
    const picture = path.join(folder, 'dog.png');
    fs.writeFileSync(
        picture,
        Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        )
    );

    const dog = await gc.createDog({
        name: 'Library Test Dog',
        gender: 'female',
        weightInGrams: 20000,
        birthdate: new Date(2023, 5, 15)
    });
    let activityId;
    try {
        assert.strictEqual(dog.status, 'active');
        assert.strictEqual(dog.birthdate, '2023-06-15');

        const changed = await gc.updateDog(dog.id, { weightInGrams: 21000 });
        assert.strictEqual(changed.weight, 21000);
        assert.strictEqual(changed.gender, 'female');
        const cleared = await gc.updateDog(dog.id, { gender: null });
        assert.strictEqual(cleared.gender, null);

        const photo = await gc.uploadDogPhoto(dog.id, picture);
        assert.ok(photo.photoAccessList.length > 0);
        assert.strictEqual((await gc.getDog(dog.id)).id, dog.id);
        isArray(await gc.getDogSocialProfiles([dog.id]));

        await gc.setDogPhysioExcluded(dog.id, true);
        await gc.setDogPhysioExcluded(dog.id, false);
        const setting = await gc.getDogPhysioSetting(dog.id);
        assert.strictEqual(setting.excludePhysio, false);

        const created = await gc.createManualActivity({
            activityName: 'Library test walk',
            activityType: 'walking',
            startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
            timezone: 'Etc/UTC',
            durationInSeconds: 600,
            distanceInMeters: 800
        });
        activityId = created.activityId;
        const withDog = () =>
            gc.searchActivities({ dogProfileId: dog.id, limit: 5 });

        await gc.setActivityDogs(activityId, [dog.id]);
        await eventually(withDog, (found) => found.length === 1);
        await eventually(
            () => gc.getDogStats([dog.id]),
            (stats) => stats[0].stats.all.animals.animalProfileGroups.length
        );
        await gc.setActivityDogs(activityId, []);
        await eventually(withDog, (found) => found.length === 0);

        await gc.setDogStatus(dog.id, 'retired');
        assert.strictEqual((await gc.getDog(dog.id)).status, 'retired');
        await gc.setDogStatus(dog.id, 'active');
    } finally {
        if (activityId) {
            await gc.deleteActivity({ activityId });
        }
        await gc.deleteDog(dog.id);
        fs.rmSync(folder, { recursive: true });
    }
    await assert.rejects(gc.getDog(dog.id));
});
