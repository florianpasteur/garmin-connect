import { IWorkoutDetail, IWorkoutStep } from '../types';

type SectionName = 'Warmup' | 'Main Set' | 'Cooldown';

/**
 * Convert a Garmin workout detail into an intervals.icu workout description string.
 * The workout name is omitted so it can be set separately on the intervals.icu event.
 */
export function toIntervalsIcuDescription(workout: IWorkoutDetail): string {
    const steps =
        workout.workoutSegments?.flatMap((segment) => segment.workoutSteps) ??
        [];
    const lines: string[] = [];
    let currentSection: SectionName | null = null;

    for (const step of steps) {
        if (isRepeatStep(step)) {
            if (lines.length > 0 && lines[lines.length - 1] !== '') {
                lines.push('');
            }
            const iterations = step.numberOfIterations ?? 1;
            lines.push(`Main Set ${iterations}x`);
            for (const child of step.workoutSteps ?? []) {
                lines.push(formatExecutableStep(child));
            }
            lines.push('');
            currentSection = null;
            continue;
        }

        const section = sectionForStep(step);
        if (section !== currentSection) {
            if (lines.length > 0 && lines[lines.length - 1] !== '') {
                lines.push('');
            }
            lines.push(section);
            currentSection = section;
        }
        lines.push(formatExecutableStep(step));
    }

    // Trim trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
    }

    return lines.join('\n');
}

function isRepeatStep(step: IWorkoutStep): boolean {
    return (
        step.type === 'WorkoutRepeatStepDTO' ||
        (Array.isArray(step.workoutSteps) && step.workoutSteps.length > 0)
    );
}

function sectionForStep(step: IWorkoutStep): SectionName {
    const key = step.stepType?.stepTypeKey;
    if (key === 'warmup') return 'Warmup';
    if (key === 'cooldown') return 'Cooldown';
    return 'Main Set';
}

function formatExecutableStep(step: IWorkoutStep): string {
    const parts: string[] = [];

    const cue = buildCue(step);
    if (cue) parts.push(cue);

    const duration = formatDuration(step);
    if (duration) parts.push(duration);

    const target = formatTarget(step);
    if (target) parts.push(target);

    const secondary = formatSecondaryTarget(step);
    if (secondary) parts.push(secondary);

    if (parts.length === 0) {
        return '- free';
    }

    return `- ${parts.join(' ')}`;
}

function buildCue(step: IWorkoutStep): string | null {
    const notes: string[] = [];

    if (step.description) {
        notes.push(step.description.trim());
    }

    if (step.exerciseName) {
        const exercise = [step.category, step.exerciseName]
            .filter(Boolean)
            .join(' ');
        const weight =
            step.weightValue != null
                ? ` ${step.weightValue}${
                      step.weightUnit?.unitKey
                          ? ` ${step.weightUnit.unitKey}`
                          : ''
                  }`
                : '';
        notes.push(`${exercise}${weight}`.trim());
    }

    const endKey = step.endCondition?.conditionTypeKey;
    if (endKey === 'calories' && step.endConditionValue != null) {
        notes.push(`${step.endConditionValue} calories`);
    } else if (endKey === 'heart.rate' && step.endConditionValue != null) {
        const compare =
            step.endConditionCompare === 'gt'
                ? '>'
                : step.endConditionCompare === 'lt'
                ? '<'
                : '';
        notes.push(`HR ${compare}${step.endConditionValue} bpm`.trim());
    } else if (endKey === 'reps' && step.endConditionValue != null) {
        notes.push(`${step.endConditionValue} reps`);
    }

    return notes.length > 0 ? notes.join(' ') : null;
}

function formatDuration(step: IWorkoutStep): string | null {
    const key = step.endCondition?.conditionTypeKey;
    const value = step.endConditionValue;

    if (key === 'time' && value != null) {
        return formatTimeSeconds(value);
    }
    if (key === 'distance' && value != null) {
        return formatDistanceMeters(value);
    }
    if (key === 'lap.button') {
        return 'lap press';
    }

    // calories / heart.rate / reps are expressed as cue text instead
    return null;
}

function formatTimeSeconds(totalSeconds: number): string {
    const seconds = Math.round(totalSeconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    // Prefer bare minutes when exact: "5m" not "5m0s"
    if (h === 0 && m > 0 && s === 0) return `${m}m`;
    if (h > 0 && m === 0 && s === 0) return `${h}h`;
    if (h > 0 && m > 0 && s === 0) return `${h}h${m}m`;
    if (h === 0 && m > 0 && s > 0) return `${m}m${s}s`;
    if (h === 0 && m === 0) return `${s}s`;
    return parts.join('');
}

function formatDistanceMeters(meters: number): string {
    if (meters >= 1000 && meters % 1000 === 0) {
        return `${meters / 1000}km`;
    }
    if (meters >= 1000) {
        const km = meters / 1000;
        const rounded = Math.round(km * 1000) / 1000;
        return `${rounded}km`;
    }
    return `${Math.round(meters)}mtr`;
}

function formatTarget(step: IWorkoutStep): string | null {
    const key = step.targetType?.workoutTargetTypeKey;
    if (!key || key === 'no.target') {
        return null;
    }

    if (key === 'pace.zone') {
        return formatPaceTarget(step.targetValueOne, step.targetValueTwo);
    }
    if (key === 'heart.rate.zone') {
        return formatHrTarget(
            step.zoneNumber,
            step.targetValueOne,
            step.targetValueTwo
        );
    }
    if (key === 'power.zone') {
        return formatPowerTarget(
            step.zoneNumber,
            step.targetValueOne,
            step.targetValueTwo
        );
    }
    if (key === 'cadence') {
        return formatCadenceTarget(step.targetValueOne, step.targetValueTwo);
    }

    return null;
}

function formatSecondaryTarget(step: IWorkoutStep): string | null {
    const key = step.secondaryTargetType?.workoutTargetTypeKey;
    if (!key || key === 'no.target') return null;

    if (key === 'cadence') {
        return formatCadenceTarget(
            step.secondaryTargetValueOne,
            step.secondaryTargetValueTwo
        );
    }
    if (key === 'heart.rate.zone') {
        return formatHrTarget(
            step.secondaryZoneNumber,
            step.secondaryTargetValueOne,
            step.secondaryTargetValueTwo
        );
    }
    if (key === 'power.zone') {
        return formatPowerTarget(
            step.secondaryZoneNumber,
            step.secondaryTargetValueOne,
            step.secondaryTargetValueTwo
        );
    }
    if (key === 'pace.zone') {
        return formatPaceTarget(
            step.secondaryTargetValueOne,
            step.secondaryTargetValueTwo
        );
    }

    return null;
}

/** Garmin pace targets are stored as meters/second. */
function formatPaceTarget(
    valueOne: number | null | undefined,
    valueTwo: number | null | undefined
): string | null {
    if (valueOne == null && valueTwo == null) return null;

    const slow = valueOne != null ? metersPerSecondToPacePerKm(valueOne) : null;
    const fast = valueTwo != null ? metersPerSecondToPacePerKm(valueTwo) : null;

    if (slow && fast && slow !== fast) {
        // intervals.icu: slower-faster/km Pace
        return `${slow}-${fast}/km Pace`;
    }
    return `${slow ?? fast}/km Pace`;
}

function metersPerSecondToPacePerKm(mps: number): string {
    if (mps <= 0) return '0:00';
    const secondsPerKm = Math.round(1000 / mps);
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = secondsPerKm % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatHrTarget(
    zoneNumber: number | null | undefined,
    valueOne: number | null | undefined,
    valueTwo: number | null | undefined
): string | null {
    if (zoneNumber != null) {
        return `Z${zoneNumber} HR`;
    }
    if (valueOne != null && valueTwo != null && valueOne !== valueTwo) {
        const low = Math.min(valueOne, valueTwo);
        const high = Math.max(valueOne, valueTwo);
        return `${Math.round(low)}-${Math.round(high)}bpm`;
    }
    if (valueOne != null) return `${Math.round(valueOne)}bpm`;
    if (valueTwo != null) return `${Math.round(valueTwo)}bpm`;
    return null;
}

function formatPowerTarget(
    zoneNumber: number | null | undefined,
    valueOne: number | null | undefined,
    valueTwo: number | null | undefined
): string | null {
    if (zoneNumber != null) {
        return `Z${zoneNumber}`;
    }
    if (valueOne != null && valueTwo != null && valueOne !== valueTwo) {
        const low = Math.min(valueOne, valueTwo);
        const high = Math.max(valueOne, valueTwo);
        return `${Math.round(low)}-${Math.round(high)}w`;
    }
    if (valueOne != null) return `${Math.round(valueOne)}w`;
    if (valueTwo != null) return `${Math.round(valueTwo)}w`;
    return null;
}

function formatCadenceTarget(
    valueOne: number | null | undefined,
    valueTwo: number | null | undefined
): string | null {
    if (valueOne != null && valueTwo != null && valueOne !== valueTwo) {
        const low = Math.min(valueOne, valueTwo);
        const high = Math.max(valueOne, valueTwo);
        return `${Math.round(low)}-${Math.round(high)}rpm`;
    }
    if (valueOne != null) return `${Math.round(valueOne)}rpm`;
    if (valueTwo != null) return `${Math.round(valueTwo)}rpm`;
    return null;
}
