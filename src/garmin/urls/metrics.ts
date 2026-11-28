import { UrlClass } from '../UrlClass';
import { GCUserHash } from '../types';

/**
 * URLs of the metrics endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 */
export class MetricsUrls {
    constructor(protected readonly url: UrlClass) {}

    private get METRICS() {
        return `${this.url.GC_API}/metrics-service/metrics`;
    }

    private get BIOMETRIC() {
        return `${this.url.GC_API}/biometric-service`;
    }

    private get USER_STATS() {
        return `${this.url.GC_API}/userstats-service`;
    }

    TRAINING_READINESS(date: string) {
        return `${this.METRICS}/trainingreadiness/${date}`;
    }

    TRAINING_STATUS(date: string) {
        return `${this.METRICS}/trainingstatus/aggregated/${date}`;
    }

    VO2_MAX_LATEST(date: string) {
        return `${this.METRICS}/maxmet/latest/${date}`;
    }

    VO2_MAX_DAILY(start: string, end: string) {
        return `${this.METRICS}/maxmet/daily/${start}/${end}`;
    }

    RACE_PREDICTIONS_LATEST(displayName: GCUserHash) {
        return `${this.METRICS}/racepredictions/latest/${encodeURIComponent(
            displayName
        )}`;
    }

    RACE_PREDICTIONS_DAILY(displayName: GCUserHash) {
        return `${this.METRICS}/racepredictions/daily/${encodeURIComponent(
            displayName
        )}`;
    }

    get ENDURANCE_SCORE() {
        return `${this.METRICS}/endurancescore`;
    }

    get HILL_SCORE() {
        return `${this.METRICS}/hillscore`;
    }

    get RUNNING_TOLERANCE() {
        return `${this.METRICS}/runningtolerance/stats`;
    }

    HEAT_ALTITUDE_ACCLIMATION(date: string) {
        return `${this.METRICS}/heataltitudeacclimation/latest/${date}`;
    }

    FITNESS_AGE(date: string) {
        return `${this.url.GC_API}/fitnessage-service/fitnessage/${date}`;
    }

    get LACTATE_THRESHOLD() {
        return `${this.BIOMETRIC}/biometric/latestLactateThreshold`;
    }

    FUNCTIONAL_THRESHOLD_POWER(sport: string) {
        return `${
            this.BIOMETRIC
        }/biometric/latestFunctionalThresholdPower/${encodeURIComponent(
            sport
        )}`;
    }

    get HEART_RATE_ZONES() {
        return `${this.BIOMETRIC}/heartRateZones/`;
    }

    get POWER_ZONES() {
        return `${this.BIOMETRIC}/powerZones/sports/all`;
    }

    CRITICAL_SWIM_SPEED(date: string) {
        return `${this.BIOMETRIC}/criticalSwimSpeed/latest/${date}`;
    }

    USER_STATISTICS(displayName: GCUserHash) {
        return `${this.USER_STATS}/statistics/${encodeURIComponent(
            displayName
        )}`;
    }

    USER_WELLNESS_STATISTICS(displayName: GCUserHash) {
        return `${this.USER_STATS}/wellness/daily/${encodeURIComponent(
            displayName
        )}`;
    }

    PERSONAL_INFORMATION(displayName: GCUserHash) {
        return `${
            this.url.GC_API
        }/userprofile-service/userprofile/personal-information/${encodeURIComponent(
            displayName
        )}`;
    }
}
