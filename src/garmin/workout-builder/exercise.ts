import {
    EXERCISE_CATEGORIES,
    EXERCISE_CATEGORY_DISPLAY_NAMES,
    EXERCISES_BY_CATEGORY,
    ExerciseCategory
} from './exercise-catalog';

/**
 * Describes a Garmin strength exercise as returned by the catalog helpers.
 */
export interface ExerciseDefinition {
    /** Garmin parent category, e.g. `DEADLIFT` */
    category: ExerciseCategory | string;
    /** Garmin exercise key, e.g. `BARBELL_DEADLIFT` */
    exerciseName: string;
    /** Human-readable label shown in Garmin Connect */
    displayName: string;
    /** Combined catalog key: `CATEGORY_EXERCISE_NAME` */
    catalogKey: string;
}

/**
 * Target weight for a strength exercise step.
 *
 * @example
 * Weight.kilograms(60)
 * Weight.pounds(135)
 */
export class Weight {
    constructor(
        private readonly value: number,
        private readonly unit: 'kilogram' | 'pound' = 'kilogram'
    ) {}

    static kilograms(kg: number) {
        return new Weight(kg, 'kilogram');
    }

    static pounds(lb: number) {
        return new Weight(lb, 'pound');
    }

    build() {
        return {
            weightValue: this.value,
            weightUnit: { unitKey: this.unit }
        };
    }
}

let displayNameIndex: Map<string, ExerciseDefinition> | undefined;
let exerciseNameIndex: Map<string, ExerciseDefinition> | undefined;
let catalogKeyIndex: Map<string, ExerciseDefinition> | undefined;

function buildIndexes() {
    if (displayNameIndex) {
        return;
    }

    displayNameIndex = new Map();
    exerciseNameIndex = new Map();
    catalogKeyIndex = new Map();

    for (const category of EXERCISE_CATEGORIES) {
        const exercises = EXERCISES_BY_CATEGORY[category];

        for (const [exerciseName, displayName] of Object.entries(exercises)) {
            const definition: ExerciseDefinition = {
                category,
                exerciseName,
                displayName,
                catalogKey: `${category}_${exerciseName}`
            };

            catalogKeyIndex.set(definition.catalogKey, definition);

            const displayKey = displayName.toLowerCase();
            if (!displayNameIndex.has(displayKey)) {
                displayNameIndex.set(displayKey, definition);
            }

            const exerciseKey = exerciseName.toLowerCase();
            if (!exerciseNameIndex.has(exerciseKey)) {
                exerciseNameIndex.set(exerciseKey, definition);
            }
        }
    }
}

function normalizeSearchTerm(term: string) {
    return term
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, ' ');
}

function getExerciseDisplayName(
    category: string,
    exerciseName: string
): string | undefined {
    const exercises = EXERCISES_BY_CATEGORY as Record<
        string,
        Record<string, string>
    >;

    return exercises[category]?.[exerciseName];
}

/**
 * Garmin strength exercise used in workout steps.
 *
 * Each exercise is identified by a **category / exerciseName** pair that Garmin
 * validates when creating workouts. Use the bundled catalog helpers to find
 * valid values instead of guessing strings.
 *
 * @example
 * // Explicit category + exercise name
 * Exercise.of('DEADLIFT', 'BARBELL_DEADLIFT', Weight.kilograms(100))
 *
 * @example
 * // Resolve by display name from the catalog
 * const deadlift = Exercise.resolve('Barbell Deadlift');
 * Exercise.fromDefinition(deadlift!, Weight.kilograms(100))
 *
 * @example
 * // Search the catalog
 * Exercise.find('deadlift').forEach((exercise) => {
 *   console.log(exercise.catalogKey, exercise.displayName);
 * });
 *
 * @example
 * // List all exercises in a category
 * Exercise.listByCategory('BENCH_PRESS').forEach((exercise) => {
 *   console.log(exercise.exerciseName, exercise.displayName);
 * });
 */
export class Exercise {
    constructor(
        private readonly category: string,
        private readonly exerciseName: string,
        private readonly displayName?: string,
        private readonly weight?: Weight
    ) {}

    /**
     * Create an exercise from a Garmin category and exercise name.
     *
     * @param category - Parent category such as `DEADLIFT` or `BENCH_PRESS`
     * @param exerciseName - Exercise key such as `BARBELL_DEADLIFT`
     * @param weight - Optional target weight for the set
     */
    static of(
        category: ExerciseCategory | string,
        exerciseName: string,
        weight?: Weight
    ) {
        const displayName = getExerciseDisplayName(category, exerciseName);
        return new Exercise(category, exerciseName, displayName, weight);
    }

    /**
     * Create an exercise from a catalog key such as `DEADLIFT_BARBELL_DEADLIFT`.
     */
    static fromCatalogKey(catalogKey: string, weight?: Weight) {
        buildIndexes();
        const definition = catalogKeyIndex!.get(catalogKey);

        if (!definition) {
            throw new Error(
                `Unknown exercise catalog key "${catalogKey}". Use Exercise.find() to search the catalog.`
            );
        }

        return Exercise.fromDefinition(definition, weight);
    }

    /** Alias for {@link Exercise.of} */
    static custom(
        category: ExerciseCategory | string,
        exerciseName: string,
        weight?: Weight
    ) {
        return Exercise.of(category, exerciseName, weight);
    }

    /** Create an exercise from a catalog definition */
    static fromDefinition(definition: ExerciseDefinition, weight?: Weight) {
        return new Exercise(
            definition.category,
            definition.exerciseName,
            definition.displayName,
            weight
        );
    }

    /**
     * Resolve an exercise by display name, exercise name, or catalog key.
     *
     * Matching is case-insensitive. Display names must match exactly.
     */
    static resolve(name: string): ExerciseDefinition | undefined {
        buildIndexes();

        const trimmed = name.trim();
        const normalized = normalizeSearchTerm(trimmed);

        return (
            catalogKeyIndex!.get(trimmed) ??
            displayNameIndex!.get(normalized) ??
            exerciseNameIndex!.get(normalized.replace(/\s+/g, '_'))
        );
    }

    /**
     * Search exercises by display name, exercise name, or catalog key.
     *
     * Returns all catalog entries that contain the search term.
     */
    static find(term: string): ExerciseDefinition[] {
        buildIndexes();

        const normalized = normalizeSearchTerm(term);
        if (!normalized) {
            return [];
        }

        const matches = new Map<string, ExerciseDefinition>();

        for (const definition of Array.from(catalogKeyIndex!.values())) {
            if (
                definition.displayName.toLowerCase().includes(normalized) ||
                definition.exerciseName.toLowerCase().includes(normalized) ||
                definition.catalogKey.toLowerCase().includes(normalized) ||
                definition.category.toLowerCase().includes(normalized)
            ) {
                matches.set(definition.catalogKey, definition);
            }
        }

        return Array.from(matches.values()).sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
        );
    }

    /** List all exercises in a category */
    static listByCategory(
        category: ExerciseCategory | string
    ): ExerciseDefinition[] {
        const exercises = (
            EXERCISES_BY_CATEGORY as Record<string, Record<string, string>>
        )[category];

        if (!exercises) {
            return [];
        }

        return Object.entries(exercises)
            .map(([exerciseName, displayName]) => ({
                category,
                exerciseName,
                displayName,
                catalogKey: `${category}_${exerciseName}`
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    /** List all supported Garmin exercise categories */
    static categories(): ExerciseCategory[] {
        return [...EXERCISE_CATEGORIES];
    }

    /** Get the display label for a category */
    static getCategoryDisplayName(category: ExerciseCategory | string) {
        return (
            EXERCISE_CATEGORY_DISPLAY_NAMES[category as ExerciseCategory] ??
            category
        );
    }

    /** Cardio warm-up exercise (`CARDIO` / `CARDIO`) */
    static cardio() {
        return Exercise.of('CARDIO', 'CARDIO');
    }

    /** Barbell deadlift (`DEADLIFT` / `BARBELL_DEADLIFT`) */
    static barbellDeadlift(weight?: Weight) {
        return Exercise.of('DEADLIFT', 'BARBELL_DEADLIFT', weight);
    }

    /** Barbell bench press (`BENCH_PRESS` / `BARBELL_BENCH_PRESS`) */
    static barbellBenchPress(weight?: Weight) {
        return Exercise.of('BENCH_PRESS', 'BARBELL_BENCH_PRESS', weight);
    }

    /** Barbell back squat (`SQUAT` / `BARBELL_BACK_SQUAT`) */
    static barbellSquat(weight?: Weight) {
        return Exercise.of('SQUAT', 'BARBELL_BACK_SQUAT', weight);
    }

    getCategory() {
        return this.category;
    }

    getExerciseName() {
        return this.exerciseName;
    }

    getDisplayName() {
        return (
            this.displayName ??
            getExerciseDisplayName(this.category, this.exerciseName)
        );
    }

    getCatalogKey() {
        return `${this.category}_${this.exerciseName}`;
    }

    build() {
        return {
            category: this.category,
            exerciseName: this.exerciseName,
            ...(this.weight?.build() ?? {
                weightValue: null,
                weightUnit: null
            })
        };
    }
}

export {
    EXERCISE_CATEGORIES,
    EXERCISE_CATEGORY_DISPLAY_NAMES,
    EXERCISES_BY_CATEGORY,
    ExerciseCategory
};
