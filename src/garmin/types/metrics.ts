/*
 * Responses of the training metrics and biometrics endpoints. They were
 * captured on an account without a device: `unknown` marks fields only seen as
 * null, and `Record<string, unknown>` marks responses only seen empty.
 */

/** Shape unverified: only an empty list has been seen */
export type TrainingReadinessEntry = Record<string, unknown>;

export interface TrainingStatusAggregate {
    userId: number;
    mostRecentVO2Max: unknown;
    mostRecentTrainingLoadBalance: unknown;
    mostRecentTrainingStatus: unknown;
    heatAltitudeAcclimationDTO: unknown;
}

export interface Vo2MaxLatest {
    userId: number;
    generic: unknown;
    cycling: unknown;
    heatAltitudeAcclimation: unknown;
}

/** Shape unverified: only an empty list has been seen */
export type Vo2MaxDailyEntry = Record<string, unknown>;

/** Shape unverified: only empty responses have been seen */
export type RacePrediction = Record<string, unknown>;

/** Shape unverified: only an empty response has been seen */
export type EnduranceScore = Record<string, unknown>;

/** Shape unverified: only an empty response has been seen */
export type HillScore = Record<string, unknown>;

export type RunningToleranceAggregation = 'daily' | 'weekly';

/** Shape unverified: only an empty list has been seen */
export type RunningToleranceStat = Record<string, unknown>;

/** Shape unverified: only an empty response has been seen */
export type HeatAltitudeAcclimation = Record<string, unknown>;

export interface FitnessAgeComponent {
    stale: boolean;
    staleInputs: string[];
    /** Only expected with device data */
    value?: unknown;
}

export interface FitnessAgeBmiComponent extends FitnessAgeComponent {
    lastMeasurementDate: string;
}

export interface FitnessAge {
    chronologicalAge: number;
    /** Only expected with device data */
    fitnessAge?: unknown;
    components: {
        vigorousDaysAvg: FitnessAgeComponent;
        rhr: FitnessAgeComponent;
        vigorousMinutesAvg: FitnessAgeComponent;
        bmi: FitnessAgeBmiComponent;
    };
    lastUpdated: string;
}

/** Shape unverified: only an empty list has been seen */
export type LactateThresholdEntry = Record<string, unknown>;

export interface FunctionalThresholdPower {
    userProfilePK: number;
    version: unknown;
    calendarDate: unknown;
    isStale: unknown;
    sequence: unknown;
    sport: unknown;
    functionalThresholdPower: unknown;
    biometricSourceType: unknown;
}

export interface BiometricHeartRateZones {
    trainingMethod: string;
    restingHeartRateUsed: unknown;
    lactateThresholdHeartRateUsed: unknown;
    zone1Floor: number;
    zone2Floor: number;
    zone3Floor: number;
    zone4Floor: number;
    zone5Floor: number;
    maxHeartRateUsed: number;
    restingHrAutoUpdateUsed: boolean;
    sport: string;
    changeState: string;
}

export interface BiometricPowerZones {
    sport: string;
    functionalThresholdPower: number;
    zone1Floor: number;
    zone2Floor: number;
    zone3Floor: number;
    zone4Floor: number;
    zone5Floor: number;
    zone6Floor: number;
    zone7Floor: number;
    userLocalTime: unknown;
}

/** Shape unverified: only an empty response has been seen */
export type CriticalSwimSpeed = Record<string, unknown>;

export interface UserStatisticsActivityType {
    typeId: number;
    typeKey: string;
    [key: string]: unknown;
}

export interface UserStatisticsMetric {
    userProfileId: unknown;
    activityType: UserStatisticsActivityType;
    parentActivityType: UserStatisticsActivityType;
    totalActivities: number;
    totalDistance: number;
    totalDuration: number;
    totalCalories: number;
    totalElevationGain: number;
    visibleCount: number;
}

export interface UserStatistics {
    userProfileId: number;
    statisticsStartDate: unknown;
    statisticsEndDate: unknown;
    userMetrics: UserStatisticsMetric[];
}

export interface UserWellnessStatistics {
    userProfileId: number;
    statisticsStartDate: string;
    statisticsEndDate: string;
    allMetrics: {
        /** Keyed by metric name, e.g. `WELLNESS_RESTING_HEART_RATE` */
        metricsMap: Record<string, Array<Record<string, unknown>>>;
    };
    groupedMetrics: unknown;
}

export interface PersonalInformation {
    userInfo: {
        birthDate: string;
        genderType: unknown;
        email: string;
        locale: string;
        timeZone: string;
        age: number;
        countryCode: string;
    };
    biometricProfile: {
        userId: number;
        height: number | null;
        weight: number;
        vo2Max: unknown;
        vo2MaxCycling: unknown;
        vo2MaxRowing: unknown;
        lactateThresholdHeartRate: unknown;
        activityClass: unknown;
        functionalThresholdPower: unknown;
        criticalSwimSpeed: unknown;
    };
    timeZone: string;
    locale: string;
    birthDate: string;
    gender: unknown;
}
