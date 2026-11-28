export interface HydrationData {
    userId: number;
    calendarDate: string;
    lastEntryTimestampLocal: string | null;
    valueInML: number | null;
    goalInML: number;
    baseGoalInML: number;
    sweatLossInML: number | null;
    activityIntakeInML: number | null;
    hydrationMeasurementUnit: string;
    hydrationContainers: HydrationContainer[];
    hydrationAutoGoalEnabled: boolean;
}

export interface HydrationContainer {
    name: string | null;
    volume: number;
    unit: string;
}

// hydration/log
export interface WaterIntake {
    userId: number;
    calendarDate: string;
    valueInML: number | null;
    goalInML: number;
    dailyAverageinML: number | null;
    lastEntryTimestampLocal: string | null;
    sweatLossInML: number | null;
    activityIntakeInML: number | null;
}
