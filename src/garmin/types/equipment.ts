import { GCUserProfileId } from './index';

/** An item of `gear-service/gear/v2/list`. The legacy shape is `GearData` */
export interface GearV2Item {
    uuid: string;
    userProfilePk: GCUserProfileId;
    gearType: string;
    status: string;
    name: string;
    brand: string;
    usageType: string;
    firstUseDate: string;
    numActivitiesLinked: number;
    durationUsedSeconds: number;
    distanceUsedMeters: number;
    daysUsed: number;
    processing: boolean;
    createdDate: string;
    maxUsageDistanceMeters?: number;
}

export interface GearTypeDefinition {
    gearTypePk: number;
    gearTypeName: string;
    createDate: string;
    updateDate: string;
}

export interface GearUserTypes {
    activeGearTypes: string[];
    retiredGearTypes: string[];
}

export interface DeviceLastUsed {
    userDeviceId: number;
    userProfileNumber: number;
    applicationNumber: number;
    lastUsedDeviceApplicationKey: string;
    lastUsedDeviceName: string;
    lastUsedDeviceUploadTime: number;
    imageUrl: string;
    released: boolean;
}

export interface SegmentClassification {
    typeId: number;
    typeKey: string;
    sortOrder: number;
    parentTypeId: number;
}

/** Only `geoPoints` is known by name, and only as an empty array */
export interface SegmentDetails {
    geoPoints: unknown[];
    [key: string]: unknown;
}

/**
 * Body of the segment search. Only the names `limit` and `showFavorites` are
 * known; their types and the other filters are unverified.
 */
export interface SegmentSearchFilters {
    limit?: number;
    showFavorites?: boolean;
    [filter: string]: unknown;
}
