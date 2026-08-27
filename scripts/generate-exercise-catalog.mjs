import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const exercisesJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'exercises.json'), 'utf8')
);
const propertiesText = fs.readFileSync(
    path.join(__dirname, 'exercise_types.properties'),
    'utf8'
);

const EXCLUDED_PREFIXES = [
    'activities_with_no_exercise_types',
    'category_type_',
    'exercise_picker.',
    'exercise_type_',
    'muscle_type_',
    'primary_muscle',
    'secondary_muscles',
    'untargeted_muscles',
    'current_selection',
    'cardio_steps_instructions'
];

const categories = Object.keys(exercisesJson.categories).sort(
    (a, b) => b.length - a.length
);

const displayNames = new Map();
const categoryDisplayNames = new Map();

for (const line of propertiesText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
        continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
        continue;
    }

    const key = trimmed.slice(0, separator);
    const value = trimmed.slice(separator + 1);

    if (key.startsWith('category_type_')) {
        categoryDisplayNames.set(key.slice('category_type_'.length), value);
        continue;
    }

    if (EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        continue;
    }

    displayNames.set(key, value);
}

function splitCatalogKey(catalogKey) {
    for (const category of categories) {
        const prefix = `${category}_`;
        if (catalogKey.startsWith(prefix)) {
            return {
                category,
                exerciseName: catalogKey.slice(prefix.length)
            };
        }
    }

    return null;
}

function humanizeExerciseName(exerciseName) {
    return exerciseName
        .replace(/^_(\d)/, '$1')
        .split('_')
        .map((part) =>
            /^\d/.test(part)
                ? part
                : part.charAt(0) + part.slice(1).toLowerCase()
        )
        .join(' ');
}

const byCategory = {};

for (const category of Object.keys(exercisesJson.categories).sort()) {
    const exerciseEntries = exercisesJson.categories[category].exercises ?? {};
    byCategory[category] = {};

    for (const exerciseName of Object.keys(exerciseEntries).sort()) {
        const catalogKey = `${category}_${exerciseName}`;
        byCategory[category][exerciseName] =
            displayNames.get(catalogKey) ?? humanizeExerciseName(exerciseName);
    }
}

for (const [catalogKey, displayName] of displayNames.entries()) {
    const split = splitCatalogKey(catalogKey);
    if (!split) {
        continue;
    }

    const { category, exerciseName } = split;
    if (!byCategory[category]) {
        byCategory[category] = {};
    }

    if (!byCategory[category][exerciseName]) {
        byCategory[category][exerciseName] = displayName;
    }
}

const categoryList = Object.keys(byCategory).sort();
const exerciseCount = categoryList.reduce(
    (total, category) => total + Object.keys(byCategory[category]).length,
    0
);

const output = `/* eslint-disable */
/**
 * AUTO-GENERATED FILE — do not edit directly.
 *
 * Regenerate with:
 *   node scripts/generate-exercise-catalog.mjs
 *
 * Source data:
 * - scripts/exercises.json (Garmin exercise structure)
 * - scripts/exercise_types.properties (Garmin display names)
 */
export const EXERCISE_CATEGORY_DISPLAY_NAMES = ${JSON.stringify(
    Object.fromEntries(
        categoryList.map((category) => [
            category,
            categoryDisplayNames.get(category) ?? humanizeExerciseName(category)
        ])
    ),
    null,
    4
)} as const;

export const EXERCISE_CATEGORIES = ${JSON.stringify(
    categoryList,
    null,
    4
)} as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

/**
 * Garmin exercise catalog.
 *
 * Keys are Garmin categories (e.g. \`DEADLIFT\`).
 * Values map exercise names (e.g. \`BARBELL_DEADLIFT\`) to display labels.
 */
export const EXERCISES_BY_CATEGORY = ${JSON.stringify(
    byCategory,
    null,
    4
)} as const;
`;

fs.writeFileSync(
    path.join(root, 'src/garmin/workout-builder/exercise-catalog.ts'),
    output
);

console.log(
    `Generated ${exerciseCount} exercises across ${categoryList.length} categories`
);
