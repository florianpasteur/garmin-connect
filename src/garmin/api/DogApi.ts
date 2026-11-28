import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { toDateString } from '../common/DateUtils';
import { GCActivityId } from '../types/activity';
import {
    Dog,
    DogActivitiesSetting,
    DogBreed,
    DogDatePrecision,
    DogListOptions,
    DogPhoto,
    DogPhysioSetting,
    DogProfileChanges,
    DogProfileInput,
    DogSocialProfile,
    DogStats,
    DogStatsMetric,
    DogStatsOptions,
    DogStatus,
    GCDogId
} from '../types/dog';
import { DogUrls } from '../urls/dog';
import { AchievementsApi } from './AchievementsApi';

const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

/**
 * Dog profiles, their activity statistics and the dogs of an activity.
 *
 * The requests were checked against Garmin Connect through the web app. Dog
 * profiles are served by `gcx.garmin.com`, which has not been called with the
 * token of this library.
 */
export class DogApi extends AchievementsApi {
    protected readonly dogUrls = new DogUrls(this.url);

    /**
     * Lists your dogs
     * @param options - Filter by status, or by a day the dog was active on
     * @returns Dog profiles
     *
     * @example
     * ```js
     * const dogs = await GCClient.getDogs({ status: 'active' });
     * ```
     */
    async getDogs(options: DogListOptions = {}): Promise<Dog[]> {
        const { status, activeOn } = options;
        return this.client.get<Dog[]>(this.dogUrls.DOGS, {
            params: { status, activeOn: activeOn && toDateString(activeOn) }
        });
    }

    /**
     * Retrieves one of your dogs
     * @param dogId - ID of the dog
     * @returns The dog profile
     * @throws Error if the dog does not exist or is not yours
     */
    async getDog(dogId: GCDogId): Promise<Dog> {
        assertDogId(dogId);
        return this.client.get<Dog>(this.dogUrls.DOG(dogId));
    }

    /**
     * Lists the breeds a dog profile can have
     * @returns Breeds ordered by ID
     */
    async getDogBreeds(): Promise<DogBreed[]> {
        const breeds = await this.client.get<Record<string, string>>(
            this.dogUrls.DOG_BREEDS
        );
        return Object.keys(breeds)
            .map((id) => ({ id: Number(id), key: breeds[id] }))
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Creates a dog profile. This modifies the account.
     * @param profile - Only the name is required
     * @returns The new dog
     *
     * @example
     * ```js
     * const dog = await GCClient.createDog({
     *     name: 'Biscuit',
     *     gender: 'male',
     *     weightInGrams: 30000,
     *     birthdate: new Date(2022, 3, 1),
     *     birthdatePrecision: 'month'
     * });
     * ```
     */
    async createDog(profile: DogProfileInput): Promise<Dog> {
        if (!profile || !profile.name) {
            throw new Error('Missing name');
        }
        return this.client.post<Dog>(this.dogUrls.DOGS, toDogRequest(profile));
    }

    /**
     * Changes a dog profile. A field left out keeps its value and `null` clears
     * it. This modifies the account.
     * @param dogId - ID of the dog
     * @param changes - Fields to change
     * @returns The changed dog
     */
    async updateDog(dogId: GCDogId, changes: DogProfileChanges): Promise<Dog> {
        assertDogId(dogId);
        const request = toDogRequest(changes || {});
        if (!Object.keys(request).length) {
            throw new Error('Missing changes');
        }
        return this.client.put<Dog>(this.dogUrls.DOG(dogId), request);
    }

    /**
     * Retires a dog or makes it active again. This modifies the account.
     * @param dogId - ID of the dog
     * @param status - `active` or `retired`
     */
    async setDogStatus(dogId: GCDogId, status: DogStatus): Promise<void> {
        assertDogId(dogId);
        if (status !== 'active' && status !== 'retired') {
            throw new Error(`Invalid status: ${status}`);
        }
        await this.client.put<void>(this.dogUrls.DOG_STATUS(dogId), { status });
    }

    /**
     * Deletes a dog profile. This modifies the account and cannot be undone.
     * @param dogId - ID of the dog
     */
    async deleteDog(dogId: GCDogId): Promise<void> {
        assertDogId(dogId);
        // This service answers 405 to the method override used by `delete`
        await this.client.deleteRequest<void>(this.dogUrls.DOG(dogId));
    }

    /**
     * Sets the profile picture of a dog. This modifies the account.
     * @param dogId - ID of the dog
     * @param filePath - Path to a JPEG, PNG or GIF file
     * @returns Links to the stored picture, they expire
     * @throws Error if the file has another extension
     */
    async uploadDogPhoto(dogId: GCDogId, filePath: string): Promise<DogPhoto> {
        assertDogId(dogId);
        if (!filePath) {
            throw new Error('Missing filePath');
        }
        const extension = path.extname(filePath).toLowerCase();
        if (PHOTO_EXTENSIONS.indexOf(extension) === -1) {
            throw new Error(
                'uploadDogPhoto - The file must be a JPEG, PNG or GIF'
            );
        }

        const form = new FormData();
        form.append('photo', fs.createReadStream(filePath), {
            filename: path.basename(filePath)
        });
        return this.client.post<DogPhoto>(this.dogUrls.DOG_PHOTO(dogId), form, {
            headers: {
                'Content-Type': form.getHeaders()['content-type']
            }
        });
    }

    /**
     * Retrieves the public profile (name and picture) of dogs
     * @param dogIds - IDs of the dogs
     * @returns Public profiles
     */
    async getDogSocialProfiles(dogIds: GCDogId[]): Promise<DogSocialProfile[]> {
        assertDogIds(dogIds);
        return this.client.get<DogSocialProfile[]>(
            this.dogUrls.SOCIAL_DOGS(dogIds)
        );
    }

    /**
     * Retrieves the totals of all activities done with a dog
     * @param metrics - `distance` (in centimetres) and `duration` (in
     * milliseconds), both by default
     * @returns Totals, and the number of activities of each dog
     */
    async getDogStatsTotals(
        metrics: DogStatsMetric[] = ['distance', 'duration']
    ): Promise<DogStats> {
        if (!metrics.length) {
            throw new Error('Missing metrics');
        }
        return this.client.get<DogStats>(
            this.dogUrls.DOG_STATS_LIFETIME(metrics)
        );
    }

    /**
     * Retrieves distance and duration per dog, for a date range if given
     * @param dogIds - IDs of the dogs
     * @param options - First and last day to include
     * @returns Statistics, one entry per period Garmin returns
     */
    async getDogStats(
        dogIds: GCDogId[],
        options: DogStatsOptions = {}
    ): Promise<DogStats[]> {
        assertDogIds(dogIds);
        const { startDate, endDate } = options;
        return this.client.post<DogStats[]>(
            this.dogUrls.DOG_STATS_BULK,
            dogIds,
            {
                params: {
                    startDate: startDate && toDateString(startDate),
                    endDate: endDate && toDateString(endDate)
                }
            }
        );
    }

    /**
     * Sets which dogs took part in an activity, replacing the ones set before.
     * This modifies the account.
     *
     * Garmin accepts IDs of dogs that do not exist, so take them from
     * `getDogs()`.
     *
     * @param activityId - The ID of the activity
     * @param dogIds - Dogs of the activity, an empty array removes them
     * @param hasDog - Pass true with an empty array to record a dog that has
     * no profile
     *
     * @example
     * ```js
     * await GCClient.setActivityDogs(activityId, [dog.id]);
     * await GCClient.setActivityDogs(activityId, []); // no dog
     * ```
     */
    async setActivityDogs(
        activityId: GCActivityId,
        dogIds: GCDogId[],
        hasDog: boolean = !!dogIds && dogIds.length > 0
    ): Promise<void> {
        if (!dogIds) {
            throw new Error('Missing dogIds');
        }
        if (!hasDog && dogIds.length) {
            throw new Error('hasDog cannot be false with dogs');
        }
        // Garmin ignores `dogProfileIds` sent without `hasDog`
        await this.updateActivity(activityId, {
            metadataDTO: { hasDog, dogProfileIds: dogIds }
        });
    }

    /**
     * Lists the physiology settings of dogs
     * @param dogIds - Dogs to look up, all dogs with a setting by default
     * @returns Settings, dogs without one are left out
     */
    async getDogPhysioSettings(
        dogIds?: GCDogId[]
    ): Promise<DogPhysioSetting[]> {
        if (dogIds && !dogIds.length) {
            return [];
        }
        return this.client.post<DogPhysioSetting[]>(
            this.dogUrls.ANIMAL_SEARCH,
            { animalType: 'DOG', animalProfileIds: dogIds }
        );
    }

    /**
     * Retrieves the physiology setting of a dog
     * @param dogId - ID of the dog
     * @returns The setting, or null when none was saved
     */
    async getDogPhysioSetting(
        dogId: GCDogId
    ): Promise<DogPhysioSetting | null> {
        assertDogId(dogId);
        return this.getOptional<DogPhysioSetting>(this.dogUrls.ANIMAL(dogId));
    }

    /**
     * Chooses whether activities with a dog are left out of its physiology
     * metrics. This modifies the account.
     * @param dogId - ID of one of your dogs
     * @param excludePhysio - True to leave them out
     */
    async setDogPhysioExcluded(
        dogId: GCDogId,
        excludePhysio: boolean
    ): Promise<void> {
        const current = await this.getDogPhysioSetting(dogId);
        const setting: DogPhysioSetting = {
            animalProfileId: dogId,
            animalType: 'DOG',
            userId: await this.getProfileId(),
            excludePhysio
        };
        // Creating a setting that already exists fails
        if (current) {
            await this.client.put<void>(this.dogUrls.ANIMAL(dogId), setting);
        } else {
            await this.client.post<void>(this.dogUrls.ANIMALS, setting);
        }
    }

    /**
     * Retrieves whether the dog activities feature is turned on
     * @returns The setting, or null when it was never saved
     */
    async getDogActivitiesSetting(): Promise<DogActivitiesSetting | null> {
        return this.getOptional<DogActivitiesSetting>(
            this.dogUrls.DOG_ACTIVITIES_SETTING
        );
    }

    /**
     * Turns the dog activities feature on or off. This modifies the account.
     * @param optIn - True to turn it on
     * @returns The saved setting
     */
    async setDogActivitiesOptIn(optIn: boolean): Promise<DogActivitiesSetting> {
        if (typeof optIn !== 'boolean') {
            throw new Error('Missing optIn');
        }
        const choice = optIn ? 'OPT-IN' : 'OPT-OUT';
        return this.client.post<DogActivitiesSetting>(
            `${this.dogUrls.DOG_ACTIVITIES_SETTING}/${choice}`,
            null
        );
    }
}

function assertDogId(dogId: GCDogId): void {
    if (!dogId) {
        throw new Error('Missing dogId');
    }
}

function assertDogIds(dogIds: GCDogId[]): void {
    if (!dogIds || !dogIds.length) {
        throw new Error('Missing dogIds');
    }
}

/** Request body of a profile. Fields left out are not sent, `null` is */
function toDogRequest(profile: DogProfileChanges): Record<string, unknown> {
    const {
        weightInGrams,
        birthdate,
        birthdatePrecision,
        adoptionDate,
        adoptionDatePrecision,
        ...fields
    } = profile;
    const request: Record<string, unknown> = {
        ...fields,
        weight: weightInGrams,
        ...toDogDate('birthdate', birthdate, birthdatePrecision),
        ...toDogDate('adoptionDate', adoptionDate, adoptionDatePrecision)
    };
    Object.keys(request).forEach((key) => {
        if (request[key] === undefined) {
            delete request[key];
        }
    });
    return request;
}

/** A date and its precision, which Garmin expects together */
function toDogDate(
    field: 'birthdate' | 'adoptionDate',
    date: Date | null | undefined,
    precision: DogDatePrecision | undefined
): Record<string, unknown> {
    const precisionField = `${field}Precision`;
    if (date === undefined) {
        if (precision) {
            throw new Error(`${precisionField} needs ${field}`);
        }
        return {};
    }
    if (date === null) {
        return { [field]: null, [precisionField]: null };
    }
    const day = toDateString(date);
    return {
        // The web app sends the first of the month when only the month is known
        [field]: precision === 'month' ? `${day.slice(0, 7)}-01` : day,
        [precisionField]: precision || 'day'
    };
}
