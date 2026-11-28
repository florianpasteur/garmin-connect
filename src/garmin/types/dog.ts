export type GCDogId = number;

export type DogStatus = 'active' | 'retired';
export type DogGender = 'male' | 'female';
export type DogDatePrecision = 'day' | 'month';
export type DogStatsMetric = 'distance' | 'duration';

export interface DogBreed {
    id: number;
    /** Translation key such as `DOG_BREED_GOLDEN_RETRIEVER` */
    key: string;
}

/** A breed as it appears inside a dog profile */
export interface DogProfileBreed {
    id: number;
    /** English name in capitals, e.g. `GOLDEN RETRIEVER` */
    name: string;
    species: string;
}

export interface Dog {
    id: GCDogId;
    /** `profileId` of the user who owns the profile */
    adminId: number;
    name: string;
    nickname: string | null;
    species: string;
    primaryBreed: DogProfileBreed | null;
    secondaryBreeds: DogProfileBreed[];
    gender: DogGender | 'unknown' | null;
    isNeutered: boolean | null;
    /** In grams */
    weight: number | null;
    /** `YYYY-MM-DD`. With `month` precision the day carries no meaning */
    birthdate: string | null;
    birthdatePrecision: DogDatePrecision | 'year' | null;
    adoptionDate: string | null;
    adoptionDatePrecision: DogDatePrecision | 'year' | null;
    status: DogStatus;
    /** Only on retired dogs */
    retiredAt?: string;
    /** Signed link that expires, missing for a dog without a picture */
    profileImageUrl?: string;
    deviceId: number | string | null;
}

/**
 * Fields of a dog profile. In an update, a field left out keeps its value and
 * `null` clears it.
 */
export interface DogProfileChanges {
    name?: string;
    nickname?: string | null;
    /** ID from `getDogBreeds()` */
    primaryBreedId?: number | null;
    /** IDs from `getDogBreeds()`, an empty array removes them */
    secondaryBreedIds?: number[];
    gender?: DogGender | null;
    isNeutered?: boolean | null;
    weightInGrams?: number | null;
    birthdate?: Date | null;
    /** Defaults to `day` when `birthdate` is given */
    birthdatePrecision?: DogDatePrecision;
    adoptionDate?: Date | null;
    /** Defaults to `day` when `adoptionDate` is given */
    adoptionDatePrecision?: DogDatePrecision;
}

export interface DogProfileInput extends DogProfileChanges {
    name: string;
}

export interface DogListOptions {
    /** Only dogs with this status, all dogs by default */
    status?: DogStatus;
    /** Only dogs that were active on this day */
    activeOn?: Date;
}

export interface DogSocialProfile {
    id: GCDogId;
    name: string;
    profileImageUrl?: string;
}

export interface DogPhotoAccess {
    /** `orig` or `profile` */
    size: string;
    /** Signed link that expires at `expirationDate` */
    url: string;
    expirationDate: string;
}

export interface DogPhoto {
    mediaUuid: string;
    photoAccessList: DogPhotoAccess[];
}

/** Whether the activities with a dog are left out of its physiology metrics */
export interface DogPhysioSetting {
    animalProfileId: GCDogId;
    animalType: 'DOG';
    userId: number;
    excludePhysio: boolean;
}

/** Distances are in centimetres, durations in milliseconds */
export interface DogMetricSummary {
    count: number;
    sum: number;
    avg: number | null;
    min: number | null;
    max: number | null;
}

export interface DogStatsGroup {
    animalProfileId: GCDogId;
    numberOfActivities: number;
    recentActivityStartTimeGmt: string;
    /** In `getDogStats()` only. Centimetres */
    distance?: DogMetricSummary;
    /** In `getDogStats()` only. Milliseconds */
    duration?: DogMetricSummary;
}

export interface DogStats {
    date: string;
    /** 0 in `getDogStats()`, use `numberOfActivities` of each group there */
    countOfActivities: number;
    stats: {
        all: {
            animals: {
                animalProfileGroups: DogStatsGroup[];
            };
            /** In `getDogStatsTotals()` only. Centimetres */
            distance?: DogMetricSummary;
            /** In `getDogStatsTotals()` only. Milliseconds */
            duration?: DogMetricSummary;
        };
    };
}

export interface DogStatsOptions {
    /** First day to include */
    startDate?: Date;
    /** Last day to include */
    endDate?: Date;
}

export interface DogActivitiesSetting {
    userOptionType: 'OPT_IN' | 'OPT_OUT';
    optionalFeatureType: string;
    userOptionalFeaturePK: string;
    userProfilePK: string;
    createDate: string;
    updateDate: string;
}
