import { UrlClass } from '../UrlClass';

/**
 * URLs of the achievements endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 */
export class AchievementsUrls {
    constructor(protected readonly url: UrlClass) {}

    PERSONAL_RECORDS(displayName: string) {
        return `${
            this.url.GC_API
        }/personalrecord-service/personalrecord/prs/${encodeURIComponent(
            displayName
        )}`;
    }

    PERSONAL_RECORD_TYPES(displayName: string) {
        return `${
            this.url.GC_API
        }/personalrecord-service/personalrecordtype/prtypes/${encodeURIComponent(
            displayName
        )}`;
    }

    get GOALS() {
        return `${this.url.GC_API}/goal-service/goal/goals`;
    }

    get CREATE_GOAL() {
        return `${this.url.GC_API}/goal-service/goal/goal`;
    }

    GOAL(goalId: number | string) {
        return `${this.CREATE_GOAL}/${encodeURIComponent(goalId)}`;
    }

    EFFECTIVE_GOAL(goalType: string, date: string) {
        return `${
            this.url.GC_API
        }/goal-service/goal/user/effective/${encodeURIComponent(
            goalType
        )}/${date}`;
    }

    EFFECTIVE_GOALS(date: string) {
        return `${this.url.GC_API}/goal-service/goal/user/effective/${date}`;
    }

    DAILY_STEP_GOAL(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/wellness-goals/consolidated/steps/${date}`;
    }

    DAILY_WELLNESS_GOAL(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/wellness-goals/consolidated/${date}`;
    }

    get EARNED_BADGES() {
        return `${this.url.GC_API}/badge-service/badge/earned`;
    }

    get AVAILABLE_BADGES() {
        return `${this.url.GC_API}/badge-service/badge/available`;
    }

    BADGE_CHALLENGES(list: 'available' | 'completed' | 'non-completed') {
        return `${this.url.GC_API}/badgechallenge-service/badgeChallenge/${list}`;
    }

    get AVAILABLE_VIRTUAL_CHALLENGES() {
        return `${this.url.GC_API}/badgechallenge-service/virtualChallenge/available`;
    }

    JOIN_BADGE_CHALLENGE(challengeUuid: string, date: string) {
        return `${
            this.url.GC_API
        }/badgechallenge-service/badgeChallenge/${encodeURIComponent(
            challengeUuid
        )}/optIn/${date}`;
    }

    AD_HOC_CHALLENGES(list: 'historical' | 'nonCompleted') {
        return `${this.CREATE_AD_HOC_CHALLENGE}/${list}`;
    }

    get CREATE_AD_HOC_CHALLENGE() {
        return `${this.url.GC_API}/adhocchallenge-service/adHocChallenge`;
    }

    get CREATE_MULTI_DAY_ACTIVITY() {
        return `${this.url.GC_API}/multidayactivity-service/multi-day-activity`;
    }

    get MULTI_DAY_ACTIVITIES() {
        return `${this.CREATE_MULTI_DAY_ACTIVITY}/list`;
    }

    MULTI_DAY_ACTIVITY(multiDayActivityId: number | string) {
        return `${this.CREATE_MULTI_DAY_ACTIVITY}/${encodeURIComponent(
            multiDayActivityId
        )}`;
    }

    MULTI_DAY_ACTIVITY_ACTIVITIES(multiDayActivityId: number | string) {
        return `${this.MULTI_DAY_ACTIVITY(multiDayActivityId)}/activities`;
    }
}
