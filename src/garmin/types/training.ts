/** File formats `downloadWorkout` can ask for */
export type WorkoutFileType = 'FIT';

/** One entry of a `WorkoutTypes` list, e.g. a step type or a target type */
export type WorkoutTypeOption = Record<string, unknown>;

/** The lookup tables used to build workouts */
export interface WorkoutTypes {
    workoutStepTypes: WorkoutTypeOption[];
    workoutSportTypes: WorkoutTypeOption[];
    workoutConditionTypes: WorkoutTypeOption[];
    workoutIntensityTypes: WorkoutTypeOption[];
    workoutTargetTypes: WorkoutTypeOption[];
    workoutEquipmentTypes: WorkoutTypeOption[];
    workoutStrokeTypes: WorkoutTypeOption[];
    workoutSwimInstructionTypes: WorkoutTypeOption[];
    workoutDrillTypes: WorkoutTypeOption[];
}

/** An entry of the scheduled workouts of a period. Its fields are unverified. */
export type ScheduledWorkoutSummary = Record<string, unknown>;

/**
 * One workout placed on one calendar day. The shape is unverified: only the
 * members Garmin's web app sends back when rescheduling are named.
 */
export interface ScheduledWorkout {
    /** Formatted as 'YYYY-MM-DD' */
    calendarDate?: string;
    workout?: {
        workoutId?: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

/** A calendar note. The response shape is unverified. */
export interface CalendarNote {
    id?: number;
    [key: string]: unknown;
}

/** A calendar event, such as a race. Its fields are unverified. */
export type CalendarEvent = Record<string, unknown>;

export interface TrainingPlanList {
    /** Element shape unverified */
    trainingPlanList: Array<Record<string, unknown>>;
    searchFilter: {
        ownerId: number;
        start: number;
        limit: number;
        [key: string]: unknown;
    };
}

/** A single training plan. The response shape is unverified. */
export type TrainingPlanDetail = Record<string, unknown>;
