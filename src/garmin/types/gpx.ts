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

export interface CreatedCourseResponse {
    courseId: number;
    courseName: string;
    description: string | null;
    openStreetMap: boolean;
    matchedToSegments: boolean;
    userProfilePk: number;
    userGroupPk: number | null;
    rulePK: number;
    firstName: string;
    lastName: string | null;
    displayName: string;
    geoRoutePk: number | null;
    sourceTypeId: number;
    sourcePk: number;
    distanceMeter: number;
    elevationGainMeter: number;
    elevationLossMeter: number;

    startPoint: {
        latitude: number;
        longitude: number;
        elevation: number;
        distance: number | null;
        timestamp: number;
    };

    coursePoints: {
        coursePointId: number;
        name: string;
        coursePk: number;
        coursePointType: string;
        lon: number;
        lat: number;
        distance: number;
        elevation: number;
        derivedElevation: number;
        timestamp: number;
        createdDate: string;
        modifiedDate: string;
        uuid: string | null;
        note: string | null;
        cutoffDuration: number | null;
        restDuration: number | null;
    }[];

    boundingBox: {
        center: unknown;
        lowerLeft: {
            latitude: number;
            longitude: number;
        };
        upperRight: {
            latitude: number;
            longitude: number;
        };
        lowerLeftLatIsSet: boolean;
        lowerLeftLongIsSet: boolean;
        upperRightLatIsSet: boolean;
        upperRightLongIsSet: boolean;
    };

    hasShareableEvent: boolean | null;
    hasTurnDetectionDisabled: boolean;
    activityTypePk: number;
    virtualPartnerId: number;
    includeLaps: boolean;
    elapsedSeconds: number | null;
    speedMeterPerSecond: number | null;
    createDate: string;
    updateDate: string;

    courseLines: {
        courseId: number;
        sortOrder: number;
        numberOfPoints: number;
        distanceInMeters: number;
        bearing: number;
        points: unknown;
        coordinateSystem: string | null;
        originalCoordinateSystem: string | null;
    }[];

    coordinateSystem: string;
    targetCoordinateSystem: string;
    originalCoordinateSystem: string;
    consumer: unknown;
    elevationSource: number;
    hasPaceBand: boolean;
    hasPowerGuide: boolean;
    favorite: boolean;
    startNote: string | null;
    finishNote: string | null;
    cutoffDuration: number | null;

    geoPoints: {
        latitude: number;
        longitude: number;
        elevation: number;
        distance: number | null;
        timestamp: number;
    }[];
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

export interface ListCoursesResponse {
    coursesForUser: {
        courseId: number;
        userProfileId: number;
        displayName: string;
        userGroupId: number | null;
        geoRoutePk: number | null;
        activityType: {
            typeId: number;
            typeKey: string;
            parentTypeId: number;
            isHidden: boolean;
            restricted: boolean;
            trimmable: boolean;
        };
        courseName: string;
        courseDescription: string | null;
        createdDate: number;
        updatedDate: number;

        privacyRule: {
            typeId: number;
            typeKey: string;
        };
        distanceInMeters: number;
        elevationGainInMeters: number;
        elevationLossInMeters: number;
        startLatitude: number;
        startLongitude: number;
        speedInMetersPerSecond: number;
        sourceTypeId: number;
        sourcePk: number | null;
        elapsedSeconds: number | null;
        coordinateSystem: string;
        originalCoordinateSystem: string;
        consumer: string;
        elevationSource: number;
        hasShareableEvent: boolean;
        hasPaceBand: boolean;
        hasPowerGuide: boolean;
        favorite: boolean;
        hasTurnDetectionDisabled: boolean;
        curatedCourseId: number | null;
        startNote: string | null;
        finishNote: string | null;
        cutoffDuration: number | null;
        activityTypeId: {
            typeId: number;
            typeKey: string;
            parentTypeId: number;
            isHidden: boolean;
            restricted: boolean;
            trimmable: boolean;
        };
        public: boolean;
        createdDateFormatted: string;
        updatedDateFormatted: string;
        applicationName: string;
        companyName: string;
        companyWebsite: string;
        imageURL: string;
    }[];
}

export type CourseDetailsResponse = {
    courseId: number;
    courseName: string;
    description: string | null;
    openStreetMap: boolean;
    matchedToSegments: boolean;
    userProfilePk: number;
    userGroupPk: number | null;
    rulePK: number;
    firstName: string;
    lastName: string;
    displayName: string;
    geoRoutePk: number;
    sourceTypeId: number;
    sourcePk: number | null;
    distanceMeter: number;
    elevationGainMeter: number;
    elevationLossMeter: number;

    startPoint: {
        latitude: number;
        longitude: number;
        elevation: number;
        distance: number | null;
        timestamp: number | null;
    };

    coursePoints: any | null;

    boundingBox: {
        center: any | null;
        lowerLeft: {
            latitude: number;
            longitude: number;
        };
        upperRight: {
            latitude: number;
            longitude: number;
        };
        lowerLeftLatIsSet: boolean;
        lowerLeftLongIsSet: boolean;
        upperRightLatIsSet: boolean;
        upperRightLongIsSet: boolean;
    };

    hasShareableEvent: boolean;
    hasTurnDetectionDisabled: boolean;
    activityTypePk: number;
    virtualPartnerId: number;
    includeLaps: boolean;
    elapsedSeconds: number | null;
    speedMeterPerSecond: number | null;
    createDate: string;
    updateDate: string;

    courseLines: {
        courseId: number;
        sortOrder: number;
        numberOfPoints: number;
        distanceInMeters: number;
        bearing: number;
        points: any | null;
        coordinateSystem: string | null;
        originalCoordinateSystem: string | null;
    }[];

    coordinateSystem: string;
    targetCoordinateSystem: string;
    originalCoordinateSystem: string;
    consumer: any | null;
    elevationSource: number;
    hasPaceBand: boolean;
    hasPowerGuide: boolean;
    favorite: boolean;
    startNote: string | null;
    finishNote: string | null;
    cutoffDuration: number | null;

    geoPoints: {
        latitude: number;
        longitude: number;
        elevation: number;
        distance: number;
        timestamp: number;
    }[];
};
