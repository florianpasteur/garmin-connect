// Daily health and wellness responses. Fields typed `unknown` were only ever
// seen as `null` (the sampled account has no device), and responses that were
// only seen empty are typed loosely.
import { DateWeight, TotalAverage } from './weight';

/** One day of `usersummary/daily`. Nearly every metric is null without data. */
export interface UserDailySummary {
    userProfileId: number;
    calendarDate: string;
    uuid: string;
    source: string;
    rule: { typeId: number; typeKey: string };
    userDailySummaryId: number;
    durationInMilliseconds: number;
    includesWellnessData: boolean;
    includesActivityData: boolean;
    includesCalorieConsumedData: boolean;
    privacyProtected: boolean;
    netRemainingKilocalories: number;
    totalKilocalories: number | null;
    activeKilocalories: number | null;
    bmrKilocalories: number | null;
    wellnessKilocalories: number | null;
    burnedKilocalories: number | null;
    consumedKilocalories: number | null;
    remainingKilocalories: number | null;
    totalSteps: number | null;
    netCalorieGoal: number | null;
    totalDistanceMeters: number | null;
    wellnessDistanceMeters: number | null;
    dailyStepGoal: number | null;
    highlyActiveSeconds: number | null;
    activeSeconds: number | null;
    sedentarySeconds: number | null;
    sleepingSeconds: number | null;
    moderateIntensityMinutes: number | null;
    vigorousIntensityMinutes: number | null;
    floorsAscended: number | null;
    floorsDescended: number | null;
    intensityMinutesGoal: number | null;
    userFloorsAscendedGoal: number | null;
    minHeartRate: number | null;
    maxHeartRate: number | null;
    restingHeartRate: number | null;
    lastSevenDaysAvgRestingHeartRate: number | null;
    averageStressLevel: number | null;
    maxStressLevel: number | null;
    stressDuration: number | null;
    bodyBatteryChargedValue: number | null;
    bodyBatteryDrainedValue: number | null;
    bodyBatteryHighestValue: number | null;
    bodyBatteryLowestValue: number | null;
    bodyBatteryMostRecentValue: number | null;
    averageSpo2: number | null;
    lowestSpo2: number | null;
    latestSpo2: number | null;
    wellnessStartTimeGmt: string | null;
    wellnessStartTimeLocal: string | null;
    wellnessEndTimeGmt: string | null;
    wellnessEndTimeLocal: string | null;
    lastSyncTimestampGMT: string | null;
    stressQualifier: string | null;
}

export interface StressDay {
    userProfilePK: number;
    calendarDate: string;
    startTimestampGMT: unknown;
    endTimestampGMT: unknown;
    startTimestampLocal: unknown;
    endTimestampLocal: unknown;
    maxStressLevel: unknown;
    avgStressLevel: unknown;
    stressChartValueOffset: unknown;
    stressChartYAxisOrigin: unknown;
    stressValueDescriptorsDTOList: unknown[];
    stressValuesArray: unknown[];
}

/** One day of the Body Battery report */
export interface BodyBatteryReport {
    date: string;
    charged: unknown;
    drained: unknown;
    startTimestampGMT: unknown;
    endTimestampGMT: unknown;
    startTimestampLocal: unknown;
    endTimestampLocal: unknown;
    bodyBatteryValuesArray: Array<Array<number | null>>;
    bodyBatteryValueDescriptorDTOList: unknown;
}

/** Shape unverified: only seen as an empty list */
export type BodyBatteryEvent = Record<string, unknown>;

export interface RespirationDay {
    userProfilePK: number;
    calendarDate: string;
    lowestRespirationValue: unknown;
    highestRespirationValue: unknown;
    avgWakingRespirationValue: unknown;
    avgSleepRespirationValue: unknown;
    respirationValueDescriptorsDTOList: unknown;
    respirationValuesArray: unknown;
    respirationVersion: number;
    /** Day and sleep window timestamps, among other fields */
    [field: string]: unknown;
}

export interface SpO2Day {
    userProfilePK: number;
    calendarDate: string;
    averageSpO2: unknown;
    lowestSpO2: unknown;
    lastSevenDaysAvgSpO2: unknown;
    latestSpO2: unknown;
    avgSleepSpO2: unknown;
    spO2SingleValues: unknown;
    spO2HourlyAverages: unknown;
    /** Timestamps, among other fields */
    [field: string]: unknown;
}

export interface IntensityMinutesDay {
    userProfilePK: number;
    calendarDate: string;
    weeklyModerate: unknown;
    weeklyVigorous: unknown;
    weeklyTotal: unknown;
    weekGoal: number;
    dayOfGoalMet: unknown;
    moderateMinutes: unknown;
    vigorousMinutes: unknown;
    imValuesArray: unknown;
    /** Timestamps, among other fields */
    [field: string]: unknown;
}

export interface FloorsChart {
    startTimestampGMT: unknown;
    endTimestampGMT: unknown;
    startTimestampLocal: unknown;
    endTimestampLocal: unknown;
    floorsValueDescriptorDTOList: unknown[];
    floorValuesArray: unknown[];
}

/** Shape unverified: only seen as an empty list */
export type StepsChartEntry = Record<string, unknown>;

/** Shape unverified: only seen as an empty list */
export type WellnessDailyEvent = Record<string, unknown>;

/** Shape unverified: only seen as `204 No Content` */
export type HrvDay = Record<string, unknown>;

/** The HRV response of one request. Its shape is unverified. */
export interface HrvRangePeriod {
    startDate: string;
    endDate: string;
    data: unknown;
}

/** Shape unverified: only seen as `204 No Content` */
export type HealthStatusSummary = Record<string, unknown>;

export interface SleepStatsOverall {
    averageSleepSeconds: number | null;
    averageLocalSleepStartTime: number | null;
    averageLocalSleepEndTime: number | null;
    averageSpO2: unknown;
    meanAvgHeartRate: unknown;
    averageRespiration: unknown;
    averageBodyBatteryChange: unknown;
    averageSleepScore: unknown;
    averageSleepNeed: unknown;
    averageRestingHeartRate: unknown;
    averageSkinTempF: unknown;
    averageSkinTempC: unknown;
}

export interface SleepStatsValues {
    totalSleepTimeInSeconds: number | null;
    localSleepStartTimeInMillis: number | null;
    localSleepEndTimeInMillis: number | null;
    gmtSleepStartTimeInMillis: number | null;
    gmtSleepEndTimeInMillis: number | null;
    remTime: unknown;
    deepTime: unknown;
    lightTime: unknown;
    awakeTime: unknown;
    restingHeartRate: unknown;
    avgHeartRate: unknown;
    respiration: unknown;
    spO2: unknown;
    sleepScore: unknown;
    sleepScoreQuality: unknown;
    sleepNeed: unknown;
    bodyBatteryChange: unknown;
    hrvStatus: unknown;
    hrv7dAverage: unknown;
    avgOvernightHrv: unknown;
    skinTempF: unknown;
    skinTempC: unknown;
}

export interface SleepStatsNight {
    calendarDate: string;
    values: SleepStatsValues;
}

/** Response of one `stats/sleep/daily` request, at most 28 days */
export interface SleepStatsResponse {
    overallStats: SleepStatsOverall;
    individualStats: SleepStatsNight[];
}

/** The averages Garmin computed for one requested period */
export interface SleepStatsPeriod {
    startDate: string;
    endDate: string;
    overallStats: SleepStatsOverall;
}

/** Sleep statistics merged from one or more requests */
export interface SleepStatsReport {
    /** The nights of every period, oldest period first */
    individualStats: SleepStatsNight[];
    /** One entry per request: the averages are never combined */
    periods: SleepStatsPeriod[];
}

/** Shape unverified: only seen as an empty list */
export type SleepScoreStat = Record<string, unknown>;

/** Shape unverified: only seen as an empty list */
export type SleepNap = Record<string, unknown>;

/** Shape unverified: only seen as an empty list */
export type StressDailyStat = Record<string, unknown>;

/** Shape unverified: only seen as an empty list */
export type RestingHeartRateDailyStat = Record<string, unknown>;

export interface IntensityMinutesDailyStat {
    calendarDate: string;
    weeklyGoal: number;
    moderateValue: unknown;
    vigorousValue: unknown;
}

export interface FloorsDailyStat {
    calendarDate: string;
    values: {
        wellnessUserFloorsAscendedGoal: unknown;
        wellnessFloorsAscended: unknown;
        wellnessFloorsDescended: unknown;
    };
}

/** Shape unverified: only seen as an empty list */
export type HydrationDailyStat = Record<string, unknown>;

/** Shape unverified: only seen as an empty list */
export type RespirationDailyStat = Record<string, unknown>;

/** Shape unverified: only seen as an empty list */
export type BodyBatteryDailyStat = Record<string, unknown>;

export interface WeightRangeDay {
    summaryDate: string;
    numOfWeightEntries: number;
    /** Weights are in grams */
    minWeight: number;
    maxWeight: number;
    latestWeight: DateWeight;
    allWeightMetrics: DateWeight[];
}

export interface WeightRange {
    dailyWeightSummaries: WeightRangeDay[];
    totalAverage: TotalAverage;
    previousDateWeight: unknown;
    nextDateWeight: unknown;
}

/** A single weigh-in, as returned by `weight/latest` and `weight/first` */
export interface WeightSample
    extends Pick<
        DateWeight,
        | 'date'
        | 'weight'
        | 'bmi'
        | 'bodyFat'
        | 'bodyWater'
        | 'boneMass'
        | 'muscleMass'
        | 'physiqueRating'
        | 'visceralFat'
        | 'metabolicAge'
        | 'sourceType'
        | 'timestampGMT'
    > {
    version: number;
    caloricIntake: unknown;
}

export interface WeightGoal {
    userGoalPk: number;
    userProfilePk: number;
    userGoalCategory: string;
    userGoalType: string;
    startDate: string;
    endDate: unknown;
    goalName: unknown;
    goalValue: number;
    updateDate: string;
    createDate: string;
    rulePk: unknown;
    activityTypePk: number;
    trackingPeriodType: string;
}

export interface WeightGoals {
    userGoals: WeightGoal[];
    userGoalRanges: unknown;
}

/** Shape unverified: only seen as an empty list */
export type WellnessActivitySummary = Record<string, unknown>;

export interface LifestyleLog {
    calendarDate: string;
    dailyLogsReport: unknown;
    completionStats: Array<{
        calendarDate: string;
        totalTracking: number;
        completedTracking: number;
    }>;
}
