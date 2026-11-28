// Types of the logging endpoints: blood pressure, nutrition, cycle tracking and
// glucose. `unknown` marks fields that were only seen as null or empty.

/** Unit accepted by `updateWeight` */
export type WeightUnitKey = 'kg' | 'lbs';

// bloodpressure-service

export interface BloodPressureReading {
    systolic: number;
    diastolic: number;
    pulse: number;
    notes?: string;
}

export interface BloodPressureMeasurement {
    /** Identifies the entry when editing or deleting it */
    version: number;
    systolic: number;
    diastolic: number;
    pulse: number;
    multiMeasurement: boolean;
    notes: string;
    sourceType: string;
    measurementTimestampLocal: string;
    measurementTimestampGMT: string;
    category: string;
    categoryName: string;
}

// bloodpressure-service/bloodpressure/dayview/{date}
export interface BloodPressureDay {
    startDate: string;
    endDate: string;
    bloodPressureMeasurements: BloodPressureMeasurement[];
    totalMeasurementCount: unknown;
    elevatedMeasurementCount: unknown;
}

export interface BloodPressureSummary {
    startDate: string;
    endDate: string;
    highSystolic: number;
    highDiastolic: number;
    lowSystolic: number;
    lowDiastolic: number;
    numOfMeasurements: number;
    category: string;
    categoryName: string;
    measurements: BloodPressureMeasurement[];
}

export interface BloodPressureCategoryStats {
    from: string;
    until: string;
    noOfDaysNormal: number;
    noOfDaysElevated: number;
    noOfDaysStage1: number;
    noOfDaysStage2: number;
    noOfDaysCritical: number;
    categoryCounts: Record<string, number>;
}

// bloodpressure-service/bloodpressure/range/{start}/{end}
export interface BloodPressureRange {
    from: string;
    until: string;
    measurementSummaries: BloodPressureSummary[];
    categoryStats: BloodPressureCategoryStats;
}

// nutrition-service

// nutrition-service/food/logs/{date}
export interface NutritionDailyLog {
    mealDate: string;
    dayStartTime: string;
    dayEndTime: string;
    dailyViewType: string;
    mealDetails: unknown[];
    loggedFoodsWithServingSizes: unknown[];
    micronutrientsSettings: {
        isTrackingEnabled: boolean;
        micronutrients: unknown[];
    };
}

// nutrition-service/meals/{date}
export interface NutritionMeals {
    meals: unknown[];
    dailyViewType: string;
}

// nutrition-service/user/nutritionCurrentStatus
export interface NutritionStatus {
    currentStatus: string;
    hasUsedNutrition: boolean;
    hasUsedMFP: boolean;
}

export interface NutritionFoodSearchOptions {
    /** Offset of the first result, defaults to 0 */
    start?: number;
    /** Page size, defaults to 20 */
    limit?: number;
    /** Country code, sent in upper case, defaults to `US` */
    regionCode?: string;
    /** Language code, sent in lower case, defaults to `en` */
    languageCode?: string;
}

// nutrition-service/food/search
export interface NutritionFoodSearchResult {
    moreDataAvailable: boolean;
    [key: string]: unknown;
}

// periodichealth-service/menstrualcycle

export interface MenstrualCycleDaySummary {
    startDate: string;
    dayInCycle: number;
    periodLength: number;
    currentPhase: number;
    lengthOfCurrentPhase: number;
    daysUntilNextPhase: number;
    predictedCycleLength: number;
    educationContentMod: number;
    cycleType: string;
    feedbackPhrase: string;
    predictedCycle: boolean;
}

// menstrualcycle/dayview/{date}
export interface MenstrualCycleDayView {
    daySummary: MenstrualCycleDaySummary;
    dayLog: unknown;
}

// menstrualcycle/calendar/{start}/{end}
export interface MenstrualCycleCalendar {
    cycleSummaries: Array<{
        startDate: string;
        periodLength: number;
        educationContentMod: number;
        predictedCycle: boolean;
    }>;
    loggedSymptomDays: unknown[];
    loggedOvulationDays: unknown[];
    loggedNoteDays: unknown[];
}

// menstrualcycle/lastconfirmed/{date}
export interface MenstrualCycleLastConfirmed {
    userProfilePk: number;
    periodStartDate: string;
    periodLength: number;
    cycleLength: number;
    reportTimestamp: string;
    educationContentMod: number;
    hasSpecifiedCycleLength: unknown;
    hasSpecifiedPeriodLength: unknown;
    cycleType: string;
    cycleStatus: unknown;
    predictedCycle: boolean;
}

// biometric-service/biometric/glucose/{date}
export interface GlucoseDay {
    glucoseList?: unknown[];
    [key: string]: unknown;
}
