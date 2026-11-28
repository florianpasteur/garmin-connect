import { UrlClass } from '../UrlClass';

/**
 * URLs of the logging endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 */
export class LoggingUrls {
    constructor(protected readonly url: UrlClass) {}

    WEIGHT_ENTRY(date: string, samplePk: number) {
        return `${
            this.url.GC_API
        }/weight-service/weight/${date}/byversion/${encodeURIComponent(
            samplePk
        )}`;
    }

    get BLOOD_PRESSURE() {
        return `${this.url.GC_API}/bloodpressure-service/bloodpressure`;
    }

    BLOOD_PRESSURE_RANGE(start: string, end: string) {
        return `${this.BLOOD_PRESSURE}/range/${start}/${end}`;
    }

    BLOOD_PRESSURE_DAY(date: string) {
        return `${this.BLOOD_PRESSURE}/dayview/${date}`;
    }

    BLOOD_PRESSURE_ENTRY(date: string, version: number) {
        return `${this.BLOOD_PRESSURE}/${date}/${encodeURIComponent(version)}`;
    }

    get MANUAL_SLEEP() {
        return `${this.url.GC_API}/sleep-service/sleep/dailySleep`;
    }

    MANUAL_SLEEP_ENTRY(sleepId: number | string) {
        return `${this.MANUAL_SLEEP}/${encodeURIComponent(sleepId)}`;
    }

    SLEEP_NOTE(sleepId: number | string) {
        return `${this.MANUAL_SLEEP_ENTRY(sleepId)}/note`;
    }

    get NAP() {
        return `${this.url.GC_API}/sleep-service/sleep/nap`;
    }

    private get NUTRITION() {
        return `${this.url.GC_API}/nutrition-service`;
    }

    FOOD_LOGS(date: string) {
        return `${this.NUTRITION}/food/logs/${date}`;
    }

    get LOG_FOODS() {
        return `${this.NUTRITION}/food/logs`;
    }

    get QUICK_ADD_FOOD() {
        return `${this.NUTRITION}/food/logs/quickAdd`;
    }

    NUTRITION_MEALS(date: string) {
        return `${this.NUTRITION}/meals/${date}`;
    }

    NUTRITION_SETTINGS(date: string) {
        return `${this.NUTRITION}/settings/${date}`;
    }

    get NUTRITION_STATUS() {
        return `${this.NUTRITION}/user/nutritionCurrentStatus`;
    }

    get FOOD_SEARCH() {
        return `${this.NUTRITION}/food/search`;
    }

    get CUSTOM_FOOD() {
        return `${this.NUTRITION}/customFood`;
    }

    CUSTOM_FOOD_ENTRY(customFoodId: number | string) {
        return `${this.CUSTOM_FOOD}/${encodeURIComponent(customFoodId)}`;
    }

    private get MENSTRUAL_CYCLE() {
        return `${this.url.GC_API}/periodichealth-service/menstrualcycle`;
    }

    MENSTRUAL_CYCLE_DAY_VIEW(date: string) {
        return `${this.MENSTRUAL_CYCLE}/dayview/${date}`;
    }

    MENSTRUAL_CYCLE_SUMMARY(date: string) {
        return `${this.MENSTRUAL_CYCLE}/summary/${date}`;
    }

    MENSTRUAL_CYCLE_CALENDAR(start: string, end: string) {
        return `${this.MENSTRUAL_CYCLE}/calendar/${start}/${end}`;
    }

    MENSTRUAL_CYCLE_LAST_CONFIRMED(date: string) {
        return `${this.MENSTRUAL_CYCLE}/lastconfirmed/${date}`;
    }

    MENSTRUAL_CYCLE_DAILY_LOG(date: string) {
        return `${this.MENSTRUAL_CYCLE}/dailylog/${date}`;
    }

    get GLUCOSE() {
        return `${this.url.GC_API}/biometric-service/biometric/glucose`;
    }

    GLUCOSE_DAY(date: string) {
        return `${this.GLUCOSE}/${date}`;
    }

    GLUCOSE_RANGE(start: string, end: string) {
        return `${this.GLUCOSE}/${start}/${end}`;
    }

    GLUCOSE_ENTRY(glucoseId: number | string) {
        return `${this.GLUCOSE}/${encodeURIComponent(glucoseId)}`;
    }
}
