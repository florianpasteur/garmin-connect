export enum GpxActivityType {
    Running = 1,
    Running_Road = 1,
    Running_Trail = 1,
    Cycling = 10,
    Cycling_Road = 10,
    Cycling_Gravel = 143,
    Hiking = 3,
    Other = 4
}

export interface ImportedGpxResponse {
    courseId: number | null;
    courseName: string | null;
    description: string | null;
    openStreetMap: boolean;
    matchedToSegments: boolean;
    userProfilePk: number | null;
    userGroupPk: number | null;
    rulePK: number | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    geoRoutePk: number | null;
    sourceTypeId: number | null;
    sourcePk: number | null;
    distanceMeter: number | null;
    elevationGainMeter: number | null;
    elevationLossMeter: number | null;
    startPoint: string | null;
    coursePoints: CoursePoint[];
    boundingBox: unknown | null;
    hasShareableEvent: boolean | null;
    hasTurnDetectionDisabled: boolean;
    activityTypePk: number | null;
    virtualPartnerId: number | null;
    includeLaps: boolean;
    elapsedSeconds: number | null;
    speedMeterPerSecond: number | null;
    createDate: string | null;
    updateDate: string | null;
    courseLines: CourseLine[];
    coordinateSystem: string | null;
    targetCoordinateSystem: string | null;
    originalCoordinateSystem: string | null;
    consumer: string | null;
    elevationSource: string | null;
    hasPaceBand: boolean;
    hasPowerGuide: boolean;
    favorite: boolean;
    startNote: string | null;
    finishNote: string | null;
    cutoffDuration: number | null;
    geoPoints: GeoPoint[];
}

export interface CourseRequest {
    activityTypePk: GpxActivityType;
    hasTurnDetectionDisabled: boolean;
    geoPoints: GeoPoint[];
    courseLines: [];
    coursePoints: CoursePoint[];
    startPoint: GeoPoint;
    elapsedSeconds: number | null;
    openStreetMap: boolean;
    coordinateSystem: string;
    rulePK: number;
    courseName: string;
    matchedToSegments: boolean;
    includeLaps: boolean;
    hasPaceBand: boolean;
    hasPowerGuide: boolean;
    favorite: boolean;
    speedMeterPerSecond: number | null;
    sourceTypeId: number;
}

export interface CoursePoint {
    coursePointId: number | null;
    name: string | null;
    coursePk: number | null;
    coursePointType: string | null;
    lon: number;
    lat: number;
    distance: number;
    elevation: number | null;
    derivedElevation: number | null;
    timestamp: number | null;
    createdDate: string | null;
    modifiedDate: string | null;
    uuid: string | null;
    note: string | null;
    cutoffDuration: number | null;
    restDuration: number | null;
}

export interface CourseLine {
    courseId: number | null;
    sortOrder: number;
    numberOfPoints: number;
    distanceInMeters: number;
    bearing: number;
    points: unknown | null;
    coordinateSystem: string | null;
    originalCoordinateSystem: string | null;
}

export interface GeoPoint {
    latitude: number;
    longitude: number;
    elevation: number | null;
    distance: number;
    timestamp: number | null;
}
