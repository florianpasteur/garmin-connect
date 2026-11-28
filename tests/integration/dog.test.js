// The replies follow the shapes Garmin Connect answered with; names and IDs are
// made up.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { withGarmin } = require('../helpers/fake-garmin');
const { load } = require('../helpers/dist');

const { GarminConnect } = load();

const date = (day) => new Date(day + 'T12:00:00');

const PROFILES = '/gcx/family-api/profile-service/profile';
const ANIMALS = '/animal-service/animal';
const STATS = '/fitnessstats-service/activity-animal/dog/stats';
const SETTING =
    '/userprofile-service/userprofile/optional-feature/dog-activities';

const breed = { id: 105, name: 'GOLDEN RETRIEVER', species: 'dog' };

const dog = {
    id: 7,
    adminId: 1,
    name: 'Biscuit',
    nickname: null,
    species: 'dog',
    primaryBreed: breed,
    secondaryBreeds: [],
    gender: 'male',
    isNeutered: true,
    weight: 30000,
    birthdate: '2022-04-01',
    birthdatePrecision: 'month',
    adoptionDate: null,
    adoptionDatePrecision: null,
    status: 'active',
    profileImageUrl: 'https://example.com/biscuit.jpg',
    deviceId: null
};

const summary = {
    count: 2,
    sum: 830000,
    avg: 415000,
    min: 320000,
    max: 510000
};

const sent = (calls) => calls().map((r) => [r.method, r.path]);

/** Asserts that `call` rejects and that nothing was sent */
async function checkRejected(call, message) {
    await withGarmin({}, async ({ gc, requests }) => {
        await assert.rejects(call(gc), message);
        assert.strictEqual(requests.length, 0);
    });
}

test('dog profiles are served by the gcx host of the domain', () => {
    const china = new GarminConnect(
        { username: 'user', password: 'password' },
        'garmin.cn'
    );
    assert.strictEqual(china.url.GCX_API, 'https://gcx.garmin.cn');
    const world = new GarminConnect({
        username: 'user',
        password: 'password'
    });
    assert.strictEqual(world.url.GCX_API, 'https://gcx.garmin.com');
});

test('getDogs lists all dogs with the token of the client', () =>
    withGarmin({ [`GET ${PROFILES}/pets`]: [dog] }, async ({ gc, calls }) => {
        assert.deepStrictEqual(await gc.getDogs(), [dog]);
        assert.deepStrictEqual(calls()[0].query, {});
        assert.strictEqual(
            calls()[0].headers.authorization,
            'Bearer test-token'
        );
    }));

test('getDogs filters by status and day', () =>
    withGarmin({ [`GET ${PROFILES}/pets`]: [] }, async ({ gc, calls }) => {
        await gc.getDogs({
            status: 'retired',
            activeOn: date('2026-03-09')
        });
        assert.deepStrictEqual(calls()[0].query, {
            status: 'retired',
            activeOn: '2026-03-09'
        });
    }));

test('getDog reads one dog', () =>
    withGarmin({ [`GET ${PROFILES}/pets/7`]: dog }, async ({ gc }) => {
        assert.deepStrictEqual(await gc.getDog(7), dog);
    }));

test('getDog rejects for a deleted dog', () =>
    withGarmin({}, async ({ gc }) => {
        await assert.rejects(gc.getDog(7), /404/);
    }));

test('getDogBreeds returns a list ordered by ID', () =>
    withGarmin(
        {
            [`GET ${PROFILES}/pets/dog/breeds`]: {
                105: 'DOG_BREED_GOLDEN_RETRIEVER',
                2: 'DOG_BREED_ENGLISH_POINTER',
                41: 'DOG_BREED_BERNESE_MOUNTAIN_DOG'
            }
        },
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.getDogBreeds(), [
                { id: 2, key: 'DOG_BREED_ENGLISH_POINTER' },
                { id: 41, key: 'DOG_BREED_BERNESE_MOUNTAIN_DOG' },
                { id: 105, key: 'DOG_BREED_GOLDEN_RETRIEVER' }
            ]);
        }
    ));

test('createDog sends the name only when nothing else is given', () =>
    withGarmin({ [`POST ${PROFILES}/pets`]: dog }, async ({ gc, calls }) => {
        assert.deepStrictEqual(await gc.createDog({ name: 'Biscuit' }), dog);
        assert.deepStrictEqual(calls()[0].body, { name: 'Biscuit' });
    }));

test('createDog converts the weight and the dates', () =>
    withGarmin({ [`POST ${PROFILES}/pets`]: dog }, async ({ gc, calls }) => {
        await gc.createDog({
            name: 'Biscuit',
            nickname: 'Bis',
            primaryBreedId: 105,
            secondaryBreedIds: [41],
            gender: 'male',
            isNeutered: false,
            weightInGrams: 30000,
            birthdate: date('2022-04-17'),
            birthdatePrecision: 'month',
            adoptionDate: date('2022-06-05')
        });
        assert.deepStrictEqual(calls()[0].body, {
            name: 'Biscuit',
            nickname: 'Bis',
            primaryBreedId: 105,
            secondaryBreedIds: [41],
            gender: 'male',
            isNeutered: false,
            weight: 30000,
            birthdate: '2022-04-01',
            birthdatePrecision: 'month',
            adoptionDate: '2022-06-05',
            adoptionDatePrecision: 'day'
        });
    }));

test('createDog needs a name', async () => {
    await checkRejected((gc) => gc.createDog({}), /Missing name/);
    await checkRejected((gc) => gc.createDog(), /Missing name/);
});

test('updateDog sends the changed fields only', () =>
    withGarmin({ [`PUT ${PROFILES}/pets/7`]: dog }, async ({ gc, calls }) => {
        await gc.updateDog(7, { weightInGrams: 29500 });
        assert.deepStrictEqual(calls()[0].body, { weight: 29500 });
    }));

test('updateDog sends null to clear fields', () =>
    withGarmin({ [`PUT ${PROFILES}/pets/7`]: dog }, async ({ gc, calls }) => {
        await gc.updateDog(7, {
            nickname: null,
            weightInGrams: null,
            birthdate: null,
            secondaryBreedIds: []
        });
        assert.deepStrictEqual(calls()[0].body, {
            nickname: null,
            weight: null,
            birthdate: null,
            birthdatePrecision: null,
            secondaryBreedIds: []
        });
    }));

test('updateDog rejects incomplete changes', async () => {
    await checkRejected((gc) => gc.updateDog(0, { name: 'a' }), /dogId/);
    await checkRejected((gc) => gc.updateDog(7, {}), /Missing changes/);
    await checkRejected(
        (gc) => gc.updateDog(7, { birthdatePrecision: 'day' }),
        /birthdatePrecision needs birthdate/
    );
});

test('setDogStatus sends the status in lower case', () =>
    withGarmin(
        { [`PUT ${PROFILES}/pets/7/status`]: () => ({}) },
        async ({ gc, calls }) => {
            await gc.setDogStatus(7, 'retired');
            assert.deepStrictEqual(calls()[0].body, { status: 'retired' });
        }
    ));

test('setDogStatus rejects other values', () =>
    checkRejected((gc) => gc.setDogStatus(7, 'RETIRED'), /Invalid status/));

test('deleteDog sends a real DELETE', () =>
    withGarmin(
        { [`DELETE ${PROFILES}/pets/7`]: () => ({}) },
        async ({ gc, calls }) => {
            await gc.deleteDog(7);
            assert.deepStrictEqual(sent(calls), [
                ['DELETE', `${PROFILES}/pets/7`]
            ]);
            assert.strictEqual(
                calls()[0].headers['x-http-method-override'],
                undefined
            );
        }
    ));

test('uploadDogPhoto sends the file as `photo`', async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'garmin-dog-'));
    const file = path.join(folder, 'biscuit.JPG');
    fs.writeFileSync(file, 'picture bytes');
    const reply = {
        mediaUuid: 'abc',
        photoAccessList: [
            {
                size: 'orig',
                url: 'https://example.com/biscuit.jpg',
                expirationDate: '2026-01-02T00:00:00Z'
            }
        ]
    };
    try {
        await withGarmin(
            { [`POST ${PROFILES}/pet/7/photo`]: reply },
            async ({ gc, calls }) => {
                assert.deepStrictEqual(await gc.uploadDogPhoto(7, file), reply);
                const [{ headers, rawBody }] = calls();
                assert.match(headers['content-type'], /^multipart\/form-data/);
                assert.match(rawBody, /name="photo"; filename="biscuit.JPG"/);
                assert.match(rawBody, /Content-Type: image\/jpeg/);
                assert.match(rawBody, /picture bytes/);
            }
        );
    } finally {
        fs.rmSync(folder, { recursive: true });
    }
});

test('uploadDogPhoto rejects other files before sending', async () => {
    await checkRejected(
        (gc) => gc.uploadDogPhoto(7, 'notes.txt'),
        /JPEG, PNG or GIF/
    );
    await checkRejected((gc) => gc.uploadDogPhoto(7), /Missing filePath/);
});

test('getDogSocialProfiles repeats the id parameter', () =>
    withGarmin(
        { [`GET ${PROFILES}/social/pets`]: [{ id: 7, name: 'Biscuit' }] },
        async ({ gc, calls }) => {
            await gc.getDogSocialProfiles([7, 8]);
            assert.strictEqual(calls()[0].search, '?id=7&id=8');
        }
    ));

test('getDogStatsTotals asks for distance and duration', () =>
    withGarmin(
        { [`GET ${STATS}/lifetime`]: { countOfActivities: 3 } },
        async ({ gc, calls }) => {
            await gc.getDogStatsTotals();
            await gc.getDogStatsTotals(['duration']);
            assert.deepStrictEqual(
                calls().map((r) => r.search),
                ['?metric=distance&metric=duration', '?metric=duration']
            );
        }
    ));

test('getDogStatsTotals needs a metric', () =>
    checkRejected((gc) => gc.getDogStatsTotals([]), /Missing metrics/));

test('getDogStats posts the IDs with the date range', () => {
    const reply = [
        {
            date: '2026-01-03',
            countOfActivities: 0,
            stats: {
                all: {
                    animals: {
                        animalProfileGroups: [
                            {
                                animalProfileId: 7,
                                numberOfActivities: 2,
                                recentActivityStartTimeGmt:
                                    '2026-01-02T17:05:00.000Z',
                                distance: summary,
                                duration: summary
                            }
                        ]
                    }
                }
            }
        }
    ];
    return withGarmin(
        { [`POST ${STATS}/bulk`]: reply },
        async ({ gc, calls }) => {
            assert.deepStrictEqual(
                await gc.getDogStats([7], {
                    startDate: date('2026-01-01'),
                    endDate: date('2026-01-03')
                }),
                reply
            );
            await gc.getDogStats([7, 8]);
            assert.deepStrictEqual(
                calls().map((r) => [r.body, r.query]),
                [
                    [[7], { startDate: '2026-01-01', endDate: '2026-01-03' }],
                    [[7, 8], {}]
                ]
            );
        }
    );
});

test('getDogStats needs dogs', () =>
    checkRejected((gc) => gc.getDogStats([]), /Missing dogIds/));

const ACTIVITY = '/activity-service/activity/42';

test('setActivityDogs sends both metadata fields', () =>
    withGarmin({ [`PUT ${ACTIVITY}`]: () => ({}) }, async ({ gc, calls }) => {
        await gc.setActivityDogs(42, [7]);
        await gc.setActivityDogs(42, []);
        await gc.setActivityDogs(42, [], true);
        assert.deepStrictEqual(
            calls().map((r) => r.body),
            [
                {
                    activityId: 42,
                    metadataDTO: { hasDog: true, dogProfileIds: [7] }
                },
                {
                    activityId: 42,
                    metadataDTO: { hasDog: false, dogProfileIds: [] }
                },
                {
                    activityId: 42,
                    metadataDTO: { hasDog: true, dogProfileIds: [] }
                }
            ]
        );
    }));

test('setActivityDogs rejects contradictions', async () => {
    await checkRejected((gc) => gc.setActivityDogs(42), /Missing dogIds/);
    await checkRejected(
        (gc) => gc.setActivityDogs(42, [7], false),
        /hasDog cannot be false/
    );
    await checkRejected(
        (gc) => gc.setActivityDogs(0, [7]),
        /Missing activityId/
    );
});

test('searchActivities passes the dog filters', () =>
    withGarmin(
        { 'GET /activitylist-service/activities/search/activities': [] },
        async ({ gc, calls }) => {
            await gc.searchActivities({ hasDog: true, dogProfileId: 7 });
            assert.deepStrictEqual(calls()[0].query, {
                hasDog: 'true',
                dogProfileId: '7'
            });
        }
    ));

test('getDogPhysioSettings searches with or without IDs', () =>
    withGarmin({ [`POST ${ANIMALS}/search`]: [] }, async ({ gc, calls }) => {
        await gc.getDogPhysioSettings();
        await gc.getDogPhysioSettings([7]);
        assert.deepStrictEqual(await gc.getDogPhysioSettings([]), []);
        assert.deepStrictEqual(
            calls().map((r) => r.body),
            [
                { animalType: 'DOG' },
                { animalType: 'DOG', animalProfileIds: [7] }
            ]
        );
    }));

test('getDogPhysioSetting returns null when none was saved', () =>
    withGarmin({ [`GET ${ANIMALS}/7`]: () => ({}) }, async ({ gc }) => {
        assert.strictEqual(await gc.getDogPhysioSetting(7), null);
    }));

const setting = {
    animalProfileId: 7,
    animalType: 'DOG',
    userId: 1,
    excludePhysio: true
};

test('setDogPhysioExcluded creates a missing setting', () =>
    withGarmin(
        {
            [`GET ${ANIMALS}/7`]: () => ({}),
            [`POST ${ANIMALS}`]: setting
        },
        async ({ gc, calls }) => {
            await gc.setDogPhysioExcluded(7, true);
            assert.deepStrictEqual(sent(calls), [
                ['GET', `${ANIMALS}/7`],
                ['POST', ANIMALS]
            ]);
            assert.deepStrictEqual(calls()[1].body, setting);
        }
    ));

test('setDogPhysioExcluded changes an existing setting', () =>
    withGarmin(
        {
            [`GET ${ANIMALS}/7`]: setting,
            [`PUT ${ANIMALS}/7`]: () => ({})
        },
        async ({ gc, calls }) => {
            await gc.setDogPhysioExcluded(7, false);
            assert.deepStrictEqual(calls()[1].method, 'PUT');
            assert.deepStrictEqual(calls()[1].body, {
                ...setting,
                excludePhysio: false
            });
        }
    ));

test('getDogActivitiesSetting reads the opt in', () =>
    withGarmin(
        { [`GET ${SETTING}`]: { userOptionType: 'OPT_IN' } },
        async ({ gc }) => {
            assert.deepStrictEqual(await gc.getDogActivitiesSetting(), {
                userOptionType: 'OPT_IN'
            });
        }
    ));

test('setDogActivitiesOptIn posts the choice', () =>
    withGarmin(
        {
            [`POST ${SETTING}/OPT-IN`]: { userOptionType: 'OPT_IN' },
            [`POST ${SETTING}/OPT-OUT`]: { userOptionType: 'OPT_OUT' }
        },
        async ({ gc, calls }) => {
            await gc.setDogActivitiesOptIn(true);
            await gc.setDogActivitiesOptIn(false);
            assert.deepStrictEqual(sent(calls), [
                ['POST', `${SETTING}/OPT-IN`],
                ['POST', `${SETTING}/OPT-OUT`]
            ]);
        }
    ));

test('setDogActivitiesOptIn needs a choice', () =>
    checkRejected((gc) => gc.setDogActivitiesOptIn(), /Missing optIn/));
