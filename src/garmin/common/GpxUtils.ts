export function convertGpxImportResponseToGpxSaveRequest(importResponse: any) {
    return {
        activityTypePk: 1,
        hasTurnDetectionDisabled: false,
        geoPoints: importResponse.geoPoints,
        courseLines: [],
        coursePoints: importResponse.coursePoints,
        startPoint: importResponse.geoPoints[0],
        elapsedSeconds: null,
        openStreetMap: false,
        coordinateSystem: 'WGS84',
        rulePK: 2,
        courseName: importResponse.courseName,
        matchedToSegments: false,
        includeLaps: false,
        hasPaceBand: false,
        hasPowerGuide: false,
        favorite: false,
        speedMeterPerSecond: null,
        sourceTypeId: 3
    };
}
