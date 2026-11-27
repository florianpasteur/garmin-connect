import { UrlClass } from '../UrlClass';
import { WorkoutFileType } from '../types/training';

/**
 * URLs of the training endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 */
export class TrainingUrls {
    constructor(protected readonly url: UrlClass) {}

    private get WORKOUT_SERVICE() {
        return `${this.url.GC_API}/workout-service`;
    }

    private get CALENDAR_SERVICE() {
        return `${this.url.GC_API}/calendar-service`;
    }

    private get TRAINING_PLAN_SERVICE() {
        return `${this.url.GC_API}/trainingplan-service/trainingplan`;
    }

    WORKOUT_COPY(workoutId: number | string) {
        return `${this.WORKOUT_SERVICE}/workout/copy/${encodeURIComponent(
            workoutId
        )}`;
    }

    WORKOUT_FILE(type: WorkoutFileType, workoutId: number | string) {
        return `${this.WORKOUT_SERVICE}/workout/${type}/${encodeURIComponent(
            workoutId
        )}`;
    }

    get WORKOUT_TYPES() {
        return `${this.WORKOUT_SERVICE}/workout/types`;
    }

    get SCHEDULED_WORKOUTS() {
        return `${this.WORKOUT_SERVICE}/schedule/workoutScheduleByPeriod`;
    }

    SCHEDULED_WORKOUT(scheduleId: number | string) {
        return `${this.WORKOUT_SERVICE}/schedule/${encodeURIComponent(
            scheduleId
        )}`;
    }

    get DEVICE_MESSAGES() {
        return `${this.url.GC_API}/devicemessage-service/devicemessage/messages`;
    }

    get CALENDAR_NOTES() {
        return `${this.CALENDAR_SERVICE}/note`;
    }

    CALENDAR_NOTE(noteId: number | string) {
        return `${this.CALENDAR_NOTES}/${encodeURIComponent(noteId)}`;
    }

    get CALENDAR_EVENTS() {
        return `${this.CALENDAR_SERVICE}/events`;
    }

    get UPCOMING_EVENTS() {
        return `${this.CALENDAR_EVENTS}/upcoming`;
    }

    get PRIMARY_EVENT() {
        return `${this.CALENDAR_SERVICE}/event/primary`;
    }

    CALENDAR_EVENT(eventId: number | string) {
        return `${this.CALENDAR_SERVICE}/event/${encodeURIComponent(eventId)}`;
    }

    get TRAINING_PLANS() {
        return `${this.TRAINING_PLAN_SERVICE}/plans`;
    }

    TRAINING_PLAN(planId: number | string) {
        return `${this.TRAINING_PLAN_SERVICE}/${encodeURIComponent(planId)}`;
    }

    ADAPTIVE_TRAINING_PLAN(planId: number | string) {
        return `${this.TRAINING_PLAN_SERVICE}/fbt-adaptive/${encodeURIComponent(
            planId
        )}`;
    }

    PHASED_TRAINING_PLAN(planId: number | string) {
        return `${this.TRAINING_PLAN_SERVICE}/phased/${encodeURIComponent(
            planId
        )}`;
    }
}
