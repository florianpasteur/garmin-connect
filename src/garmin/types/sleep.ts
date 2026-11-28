export interface SleepDTO {
    id: number | null;
    userProfilePK: number;
    calendarDate: string;
    sleepTimeSeconds: number | null;
    napTimeSeconds: number | null;
    sleepWindowConfirmed: boolean | null;
    sleepWindowConfirmationType: string | null;
    sleepStartTimestampGMT: number | null;
    sleepEndTimestampGMT: number | null;
    sleepStartTimestampLocal: number | null;
    sleepEndTimestampLocal: number | null;
    autoSleepStartTimestampGMT: number | null;
    autoSleepEndTimestampGMT: number | null;
    sleepQualityTypePK: number | null;
    sleepResultTypePK: number | null;
    unmeasurableSleepSeconds: number | null;
    deepSleepSeconds: number | null;
    lightSleepSeconds: number | null;
    remSleepSeconds: number | null;
    awakeSleepSeconds: number | null;
    deviceRemCapable: boolean;
    retro: boolean;
    sleepFromDevice?: boolean;
    averageRespirationValue?: number;
    lowestRespirationValue?: number;
    highestRespirationValue?: number;
    awakeCount?: number;
    avgSleepStress?: number;
    ageGroup?: string;
    sleepScoreFeedback?: string;
    sleepScoreInsight?: string;
    sleepScores?: {
        totalDuration: {
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
        };
        stress: {
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
        };
        awakeCount: {
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
        };
        overall: {
            value: number;
            qualifierKey: string;
        };
        remPercentage: {
            value: number;
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
            idealStartInSeconds: number;
            idealEndInSeconds: number;
        };
        restlessness: {
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
        };
        lightPercentage: {
            value: number;
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
            idealStartInSeconds: number;
            idealEndInSeconds: number;
        };
        deepPercentage: {
            value: number;
            qualifierKey: string;
            optimalStart: number;
            optimalEnd: number;
            idealStartInSeconds: number;
            idealEndInSeconds: number;
        };
    };
    sleepVersion?: number;
}

export interface SleepMovement {
    startGMT: string;
    endGMT: string;
    activityLevel: number;
}

export interface SleepLevels {
    startGMT: string;
    endGMT: string;
    activityLevel: number;
}

export interface WellnessEpochRespirationDataDTO {
    startTimeGMT: number;
    respirationValue: number;
}

export interface SleepHeartRate {
    value: number;
    startGMT: number;
}

export interface SleepBodyBattery {
    value: number;
    startGMT: number;
}

export interface SleepData {
    dailySleepDTO: SleepDTO;
    sleepMovement: SleepMovement[];
    remSleepData: boolean | null;
    sleepLevels: SleepLevels[];
    skinTempDataExists?: boolean;
    restlessMomentsCount?: number;
    wellnessEpochRespirationDataDTOList?: WellnessEpochRespirationDataDTO[];
    sleepHeartRate?: SleepHeartRate[];
    sleepBodyBattery?: SleepBodyBattery[];
    avgOvernightHrv?: number;
    hrvStatus?: string;
    bodyBatteryChange?: number;
    restingHeartRate?: number;
}
