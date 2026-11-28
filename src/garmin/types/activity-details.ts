import { ActivitySubType, ActivityType, GCActivityId } from './activity';

/** An activity type key: an enum value or any `typeKey` known to Garmin */
export type ActivityTypeKey = ActivityType | ActivitySubType | string;

export interface ActivityChartOptions {
    /** Maximum number of chart samples in the response */
    maxChartSize?: number;
    /** Maximum number of polyline points in the response */
    maxPolylineSize?: number;
}

export interface ActivityMetricDescriptor {
    /** Position of this metric in each `activityDetailMetrics[].metrics` */
    metricsIndex: number;
    key: string;
    unit: {
        id: number;
        key: string;
        factor: number;
    };
}

export interface ActivityPolylinePoint {
    lat: number;
    lon: number;
    altitude: unknown;
    time: number;
    timerStart: boolean;
    timerStop: boolean;
    distanceInMeters: number | null;
    speed: number;
    extendedCoordinate: boolean;
    valid: boolean;
}

export interface ActivityGeoPolyline {
    startPoint: ActivityPolylinePoint;
    endPoint: ActivityPolylinePoint;
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
    polyline: ActivityPolylinePoint[];
}

/** Chart samples and track of an activity */
export interface ActivityChartDetails {
    activityId: GCActivityId;
    measurementCount: number;
    metricsCount: number;
    totalMetricsCount: number;
    metricDescriptors: ActivityMetricDescriptor[];
    activityDetailMetrics: Array<{ metrics: Array<number | null> }>;
    geoPolylineDTO: ActivityGeoPolyline | null;
    heartRateDTOs: unknown;
    pendingData: unknown;
    detailsAvailable: boolean;
}

export interface ActivityLap {
    startTimeGMT: string;
    distance: number;
    duration: number;
    movingDuration: number;
    elapsedDuration: number;
    averageSpeed: number;
    calories: number;
    averageHR?: number;
    maxHR?: number;
    averagePower?: number;
    lapIndex: number;
    intensityType: string;
    messageIndex: number;
    lengthDTOs: unknown[];
}

export interface ActivitySplitEvent {
    startTimeGMT: string;
    startTimeGMTDoubleValue: number;
    sectionTypeDTO: {
        id: number;
        key: string;
        sectionTypeKey: string;
    };
}

export interface ActivitySplits {
    activityId: GCActivityId;
    lapDTOs: ActivityLap[];
    eventDTOs: ActivitySplitEvent[];
}

export interface ActivityTypedSplits {
    activityId: GCActivityId;
    activityUUID: { uuid: string };
    splits: unknown[];
}

export interface ActivitySplitSummaries {
    activityId: GCActivityId;
    activityUUID: { uuid: string };
    splitSummaries: unknown[];
}

/** Only the coordinates have been seen filled in, other fields were null */
export interface ActivityWeather {
    issueDate: unknown;
    temp: unknown;
    apparentTemp: unknown;
    dewPoint: unknown;
    relativeHumidity: unknown;
    windDirection: unknown;
    windDirectionCompassPoint: unknown;
    windSpeed: unknown;
    windGust: unknown;
    latitude: number;
    longitude: number;
    weatherStationDTO: unknown;
    weatherTypeDTO: unknown;
}

/** Time spent in one heart rate or power zone */
export interface ActivityZone {
    zoneNumber: number;
    secsInZone: number;
    zoneLowBoundary: number;
}

export interface ActivityExerciseSets {
    activityId: GCActivityId;
    /** null for activities other than strength training */
    exerciseSets: unknown;
}

export interface ActivityPolyline {
    polyline: number[][];
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
}

export interface ActivitySearchOptions {
    /** Index of the first result, for pagination */
    start?: number;
    /** Maximum number of results */
    limit?: number;
    activityType?: ActivityTypeKey;
    subActivityType?: ActivityTypeKey;
    /** First day to include */
    startDate?: Date;
    /** Last day to include */
    endDate?: Date;
    /** Text to search for */
    search?: string;
    /** Only activities with a dog. Garmin ignores `false` */
    hasDog?: true;
    /** Only activities with this dog */
    dogProfileId?: number;
}

export interface ActivityFirstAndLast {
    firstActivityId: GCActivityId;
    lastActivityId: GCActivityId;
}

export interface ActivityTypeDefinition {
    typeId: number;
    typeKey: string;
    parentTypeId: number;
    isHidden: boolean;
    restricted: boolean;
    trimmable: boolean;
}

export interface ActivityEventType {
    typeId: number;
    typeKey: string;
    sortOrder: number;
}

export interface ActivityPowerCurveEntry {
    duration: number;
    power: number;
    activityId: GCActivityId;
    activityDate: string;
}

export interface ActivityPowerCurve {
    startDate: unknown;
    endDate: unknown;
    entries: ActivityPowerCurveEntry[];
}

export interface ActivityStatsOptions {
    startDate: Date;
    endDate: Date;
    /** How to group the results, e.g. `lifetime` */
    aggregation: string;
    /** Metric to aggregate, e.g. `duration` */
    metric: string;
}

export type ActivityPrivacy = 'private' | 'public' | 'subscribers' | 'groups';

/** Fields to change on an activity, only the ones given are sent */
export interface ActivityUpdate {
    activityName?: string;
    description?: string;
    activityTypeDTO?: {
        typeKey: ActivityTypeKey;
        typeId?: number;
        parentTypeId?: number;
    };
    eventTypeDTO?: {
        typeKey: string;
        typeId?: number;
        sortOrder?: number;
    };
    accessControlRuleDTO?: {
        typeKey: ActivityPrivacy;
        typeId?: number;
    };
    /** Dogs of the activity, see `setActivityDogs`. Send both fields */
    metadataDTO?: {
        hasDog: boolean;
        dogProfileIds: number[];
    };
}

export interface ActivityManualInput {
    activityName: string;
    activityType: ActivityTypeKey;
    startTime: Date;
    /** IANA time zone of the activity, e.g. `Europe/Paris` */
    timezone: string;
    durationInSeconds: number;
    distanceInMeters?: number;
    calories?: number;
    /** Let Garmin compute the calories, defaults to true without `calories` */
    autoCalcCalories?: boolean;
    description?: string;
    /** Defaults to `private` */
    privacy?: ActivityPrivacy;
    /** Event type key, defaults to `uncategorized` */
    eventType?: string;
}
