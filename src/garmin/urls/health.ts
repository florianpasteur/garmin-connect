import { UrlClass } from '../UrlClass';

/** Metrics served by `usersummary-service/stats/{metric}/daily` */
export type HealthDailyStatMetric =
    | 'stress'
    | 'heartRate'
    | 'im'
    | 'floors'
    | 'hydration'
    | 'respiration'
    | 'bodybattery';

/**
 * URLs of the health endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 * Dates are YYYY-MM-DD strings.
 */
export class HealthUrls {
    constructor(protected readonly url: UrlClass) {}

    USER_DAILY_SUMMARY(displayName: string) {
        return `${
            this.url.GC_API
        }/usersummary-service/usersummary/daily/${encodeURIComponent(
            displayName
        )}`;
    }

    USER_DAILY_STATS(
        metric: HealthDailyStatMetric,
        start: string,
        end: string
    ) {
        return `${this.url.GC_API}/usersummary-service/stats/${metric}/daily/${start}/${end}`;
    }

    HYDRATION_SUMMARY(date: string) {
        return `${this.url.GC_API}/usersummary-service/usersummary/hydration/daily/${date}`;
    }

    DAILY_STRESS(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/dailyStress/${date}`;
    }

    get BODY_BATTERY_REPORTS() {
        return `${this.url.GC_API}/wellness-service/wellness/bodyBattery/reports/daily`;
    }

    BODY_BATTERY_EVENTS(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/bodyBattery/events/${date}`;
    }

    DAILY_RESPIRATION(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/daily/respiration/${date}`;
    }

    DAILY_SPO2(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/daily/spo2acclimation/${date}`;
    }

    DAILY_INTENSITY_MINUTES(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/daily/im/${date}`;
    }

    DAILY_FLOORS(date: string) {
        return `${this.url.GC_API}/wellness-service/wellness/floorsChartData/daily/${date}`;
    }

    get DAILY_SUMMARY_CHART() {
        return `${this.url.GC_API}/wellness-service/wellness/dailySummaryChart/`;
    }

    DAILY_EVENTS(displayName: string) {
        return `${
            this.url.GC_API
        }/wellness-service/wellness/dailyEvents/${encodeURIComponent(
            displayName
        )}`;
    }

    SLEEP_SCORES(start: string, end: string) {
        return `${this.url.GC_API}/wellness-service/stats/daily/sleep/score/${start}/${end}`;
    }

    HRV(date: string) {
        return `${this.url.GC_API}/hrv-service/hrv/${date}`;
    }

    HRV_RANGE(start: string, end: string) {
        return `${this.url.GC_API}/hrv-service/hrv/daily/${start}/${end}`;
    }

    HEALTH_STATUS(date: string) {
        return `${this.url.GC_API}/healthstatus-service/healthstatus/summary/${date}`;
    }

    SLEEP_STATS(start: string, end: string) {
        return `${this.url.GC_API}/sleep-service/stats/sleep/daily/${start}/${end}`;
    }

    get SLEEP_SUMMARY() {
        return `${this.url.GC_API}/sleep-service/sleep/dailySleep`;
    }

    get SLEEP_SUMMARIES() {
        return `${this.url.GC_API}/sleep-service/sleep/dailySleepSummariesByDate`;
    }

    SLEEP_NAPS(date: string) {
        return `${this.url.GC_API}/sleep-service/sleep/naps/${date}`;
    }

    WEIGHT_RANGE(start: string, end: string) {
        return `${this.url.GC_API}/weight-service/weight/range/${start}/${end}`;
    }

    get LATEST_WEIGHT() {
        return `${this.url.GC_API}/weight-service/weight/latest`;
    }

    get FIRST_WEIGHT() {
        return `${this.url.GC_API}/weight-service/weight/first`;
    }

    WEIGHT_GOALS(start: string, end: string) {
        return `${this.url.GC_API}/goal-service/goal/user/effective/weightgoal/${start}/${end}`;
    }

    get WELLNESS_ACTIVITIES() {
        return `${this.url.GC_API}/wellnessactivity-service/activity/summary/list`;
    }

    LIFESTYLE_LOG(date: string) {
        return `${this.url.GC_API}/lifestylelogging-service/dailyLog/${date}`;
    }

    DOWNLOAD_WELLNESS(date: string) {
        return `${this.url.GC_API}/download-service/files/wellness/${date}`;
    }
}
