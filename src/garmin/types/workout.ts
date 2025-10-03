export interface Workout {
    workoutId: number;
    ownerId: number;
    workoutName: string;
    description: string | null;
    updateDate: string;
    createdDate: string;
    sportType: {
        sportTypeId: number;
        sportTypeKey: string;
        displayOrder: number;
    };
    trainingPlanId: number | null;
    author: {
        userProfilePk: number;
        displayName: string;
        fullName: string;
        profileImgNameLarge: string | null;
        profileImgNameMedium: string | null;
        profileImgNameSmall: string | null;
        userPro: boolean;
        vivokidUser: boolean;
    };
    estimatedDurationInSecs: number;
    estimatedDistanceInMeters: number;
    estimateType: string;
    estimatedDistanceUnit: {
        unitId: number;
        unitKey: string;
        factor: {
            source: string;
            parsedValue: number;
        };
    };
    poolLength: {
        source: string;
        parsedValue: number;
    };
    poolLengthUnit: {
        unitId: number | null;
        unitKey: string | null;
        factor: {
            source: string;
            parsedValue: number;
        } | null;
    };
    workoutProvider: unknown | null;
    workoutSourceId: unknown | null;
    consumer: unknown | null;
    atpPlanId: unknown | null;
    workoutNameI18nKey: string | null;
    descriptionI18nKey: string | null;
    workoutThumbnailUrl: string | null;
    shared: boolean;
    estimated: boolean;
}
