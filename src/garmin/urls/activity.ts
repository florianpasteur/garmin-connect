import { GCActivityId } from '../types/activity';
import { UrlClass } from '../UrlClass';

/**
 * URLs of the activity endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 */
export class ActivityUrls {
    constructor(protected readonly url: UrlClass) {}

    ACTIVITY_DETAILS(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/details`;
    }

    ACTIVITY_SPLITS(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/splits`;
    }

    ACTIVITY_TYPED_SPLITS(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/typedsplits`;
    }

    ACTIVITY_SPLIT_SUMMARIES(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/split_summaries`;
    }

    ACTIVITY_WEATHER(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/weather`;
    }

    ACTIVITY_HEART_RATE_ZONES(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/hrTimeInZones`;
    }

    ACTIVITY_POWER_ZONES(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/powerTimeInZones`;
    }

    ACTIVITY_EXERCISE_SETS(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/exerciseSets`;
    }

    ACTIVITY_WORKOUTS(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(activityId)}/workouts`;
    }

    ACTIVITY_POLYLINE(activityId: GCActivityId) {
        return `${this.url.ACTIVITY_BY_ID(
            activityId
        )}/polyline/full-resolution`;
    }

    ACTIVITY_PHOTO(activityId: GCActivityId, imageId: string) {
        return `${this.url.ACTIVITY_IMAGE(activityId)}/${encodeURIComponent(
            imageId
        )}`;
    }

    get FIRST_AND_LAST_ACTIVITY() {
        return `${this.url.GC_API}/activitylist-service/activities/first-last`;
    }

    get CREATE_ACTIVITY() {
        return `${this.url.GC_API}/activity-service/activity`;
    }

    get ACTIVITY_TYPES() {
        return `${this.url.GC_API}/activity-service/activity/activityTypes`;
    }

    get EVENT_TYPES() {
        return `${this.url.GC_API}/activity-service/activity/eventTypes`;
    }

    get POWER_CURVE() {
        return `${this.url.GC_API}/fitnessstats-service/powerCurve`;
    }
}
