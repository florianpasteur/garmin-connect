import { GCUserHash } from '../types';
import { UrlClass } from '../UrlClass';

const segment = (value: string | number) => encodeURIComponent(String(value));

/**
 * URLs of the equipment endpoints. Read `this.url.GC_API` inside each getter or
 * method, never in a field initialiser: tests point it at a local server.
 */
export class EquipmentUrls {
    constructor(protected readonly url: UrlClass) {}

    private get gearService() {
        return `${this.url.GC_API}/gear-service`;
    }

    private get deviceService() {
        return `${this.url.GC_API}/device-service`;
    }

    private get courseService() {
        return `${this.url.GC_API}/course-service`;
    }

    private get segmentService() {
        return `${this.url.GC_API}/segment-service`;
    }

    // Gear

    get GEAR_V2() {
        return `${this.gearService}/gear/v2`;
    }

    get GEAR_V2_LIST() {
        return `${this.GEAR_V2}/list`;
    }

    GEAR_V2_BY_ID(gearId: string) {
        return `${this.GEAR_V2}/${segment(gearId)}`;
    }

    GEAR_V2_AVAILABLE(date: string) {
        return `${this.GEAR_V2}/available/${segment(date)}`;
    }

    GEAR_V2_STATUS(gearId: string, status: string) {
        return `${this.GEAR_V2_BY_ID(gearId)}/status/${segment(status)}`;
    }

    GEAR_V2_IMAGE(gearId: string, imageId: string | number) {
        return `${this.GEAR_V2_BY_ID(gearId)}/image/${segment(imageId)}`;
    }

    ACTIVITY_ASSOCIATED_GEAR(activityId: number) {
        return `${this.gearService}/activity/v2/${segment(
            activityId
        )}/associated-gear`;
    }

    get GEAR_TYPES() {
        return `${this.gearService}/gear/types`;
    }

    get GEAR_USAGE_TYPES() {
        return `${this.GEAR_V2}/usagetypes`;
    }

    get USER_GEAR_TYPES() {
        return `${this.GEAR_V2}/user-gear-types`;
    }

    get GEAR_COLLECTIONS() {
        return `${this.gearService}/collection`;
    }

    // Devices

    get DEVICES() {
        return `${this.deviceService}/deviceregistration/devices`;
    }

    get LAST_USED_DEVICE() {
        return `${this.deviceService}/deviceservice/mylastused`;
    }

    ALL_DEVICE_INFO(displayName: GCUserHash) {
        return `${this.deviceService}/deviceservice/device-info/all/${segment(
            displayName
        )}`;
    }

    DEVICE_SETTINGS(deviceId: number | string) {
        return `${
            this.deviceService
        }/deviceservice/device-info/settings/${segment(deviceId)}`;
    }

    SOLAR_DAY(deviceId: number | string, date: string) {
        return `${this.url.GC_API}/web-gateway/solar/${segment(
            deviceId
        )}/${date}/${date}?singleDayView=true`;
    }

    SOLAR_RANGE(deviceId: number | string, start: string, end: string) {
        return `${this.deviceService}/devicemonitoring/solargain/${segment(
            deviceId
        )}/${start}/${end}`;
    }

    // Courses

    get COURSE_FAVORITES() {
        return `${this.courseService}/course/favorites`;
    }

    COURSE_FAVORITE(courseId: number | string) {
        return `${this.COURSE_FAVORITES}/course/${segment(courseId)}`;
    }

    COURSE_FROM_ACTIVITY(activityId: number) {
        return `${this.courseService}/course/convert/activity/${segment(
            activityId
        )}`;
    }

    /** Device id 0 downloads the file instead of targeting a device */
    COURSE_FIT(courseId: number | string) {
        return `${this.courseService}/course/fit/${segment(
            courseId
        )}/0?elevation=true`;
    }

    COURSE_BY_ID(courseId: number | string) {
        return `${this.courseService}/course/${segment(courseId)}`;
    }

    // Pacing and power

    get PACE_BAND_SUMMARIES() {
        return `${this.courseService}/pacebands/summaries`;
    }

    PACE_BAND(paceBandId: number | string) {
        return `${this.courseService}/pacebands/${segment(paceBandId)}`;
    }

    PACE_BAND_DEVICE(paceBandId: number | string, deviceId: number | string) {
        return `${this.PACE_BAND(paceBandId)}/device/${segment(deviceId)}`;
    }

    get POWER_GUIDE_SUMMARIES() {
        return `${this.url.GC_API}/v1/powerguidances/summaries`;
    }

    POWER_GUIDE(powerGuideId: number | string) {
        return `${this.url.GC_API}/v1/powerguidances/${segment(powerGuideId)}`;
    }

    // Segments

    get SEGMENT_CLASSIFICATIONS() {
        return `${this.segmentService}/segment/classifications`;
    }

    SEGMENT(segmentId: string) {
        return `${this.segmentService}/segment/${segment(segmentId)}`;
    }

    SEGMENTS_OF_ACTIVITY(activityId: number) {
        return `${this.segmentService}/segment/list/${segment(activityId)}`;
    }

    SEGMENT_LEADERBOARD_RANK(segmentId: string, displayName: GCUserHash) {
        return `${this.segmentService}/leaderboard/segment/${segment(
            segmentId
        )}/rank/${segment(displayName)}`;
    }

    get SEGMENT_SEARCH() {
        return `${this.segmentService}/segment/filterSegments`;
    }

    get SEGMENT_SURFACE_TYPES() {
        return `${this.segmentService}/segment/surfaceTypes`;
    }
}
