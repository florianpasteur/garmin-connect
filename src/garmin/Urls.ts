import { GCActivityId, GCUserHash, GCWorkoutId } from './types';

export const GC_MODERN = 'https://connect.garmin.com/modern';
export const GARMIN_SSO_ORIGIN = 'https://sso.garmin.com';
export const GARMIN_SSO = `${GARMIN_SSO_ORIGIN}/sso`;
export const BASE_URL = `${GC_MODERN}/proxy`;
export const SIGNIN_URL = `${GARMIN_SSO}/signin`;
export const LOGIN_URL = `${GARMIN_SSO}/login`;

export const ACTIVITY_SERVICE = `${BASE_URL}/activity-service`;
export const ACTIVITYLIST_SERVICE = `${BASE_URL}/activitylist-service`;
export const CURRENT_USER_SERVICE = `${GC_MODERN}/currentuser-service/user/info`;
export const DEVICE_SERVICE = `${BASE_URL}/device-service`;
export const DOWNLOAD_SERVICE = `${BASE_URL}/download-service`;
export const USERPROFILE_SERVICE = `${BASE_URL}/userprofile-service`;
export const WELLNESS_SERVICE = `${BASE_URL}/wellness-service`;
export const WORKOUT_SERVICE = `${BASE_URL}/workout-service`;
export const UPLOAD_SERVICE = `${BASE_URL}/upload-service`;

export const USER_SETTINGS = `${USERPROFILE_SERVICE}/userprofile/user-settings/`;

export enum ExportFileType {
    tcx = 'tcx',
    gpx = 'gpx',
    kml = 'kml',
    zip = 'zip'
}

export enum UploadFileType {
    tcx = 'tcx',
    gpx = 'gpx',
    fit = 'fit'
}

export const activity = (id: GCActivityId) =>
    `${ACTIVITY_SERVICE}/activity/${id}`;

export const image = (id: GCActivityId) =>
    `${ACTIVITY_SERVICE}/activity/${id}/image`;

export const weather = (id: GCActivityId) => `${activity(id)}/weather`;

export const activityDetails = (id: GCActivityId) => `${activity(id)}/details`;

export const activities = () =>
    `${ACTIVITYLIST_SERVICE}/activities/search/activities`;

export const dailyHeartRate = (userHash: GCUserHash) =>
    `${WELLNESS_SERVICE}/wellness/dailyHeartRate/${userHash}`;

export const dailySleep = () => `${WELLNESS_SERVICE}/wellness/dailySleep`;

export const dailySleepData = (userHash: GCUserHash) =>
    `${WELLNESS_SERVICE}/wellness/dailySleepData/${userHash}`;

export const dailySummaryChart = (userHash: GCUserHash) =>
    `${WELLNESS_SERVICE}/wellness/dailySummaryChart/${userHash}`;

export const deviceInfo = (userHash: GCUserHash) =>
    `${DEVICE_SERVICE}/deviceservice/device-info/all/${userHash}`;

export const schedule = (id: GCActivityId) =>
    `${WORKOUT_SERVICE}/schedule/${id}`;

export const userInfo = () => CURRENT_USER_SERVICE;

export const socialProfile = (userHash: GCUserHash) =>
    `${USERPROFILE_SERVICE}/socialProfile/${userHash}`;

export const userSettings = () => USER_SETTINGS;

export const originalFile = (id: GCActivityId) =>
    `${DOWNLOAD_SERVICE}/files/activity/${id}`;

/**
 *
 * @param id {string}
 * @param type "tcx" | "gpx" | "kml"
 * @return {`${string}/export/${string}/activity/${string}`}
 */
export const exportFile = (id: GCActivityId, type: ExportFileType) =>
    `${DOWNLOAD_SERVICE}/export/${type}/activity/${id}`;

export const workout = (id?: GCWorkoutId) => {
    if (id) {
        return `${WORKOUT_SERVICE}/workout/${id}`;
    }
    return `${WORKOUT_SERVICE}/workout`;
};

export const workouts = () => `${WORKOUT_SERVICE}/workouts`;

export const socialConnections = (userHash: GCUserHash) =>
    `${USERPROFILE_SERVICE}/socialProfile/connections/${userHash}`;

export const newsFeed = () =>
    `${ACTIVITYLIST_SERVICE}/activities/subscriptionFeed`;

export const upload = (format: UploadFileType) =>
    `${UPLOAD_SERVICE}/upload/${format}`;
