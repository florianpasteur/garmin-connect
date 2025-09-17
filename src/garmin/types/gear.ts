export interface GearData {
    gearPk: number;
    uuid: string;
    userProfilePk: number;
    gearMakeName: string;
    gearModelName: string;
    gearTypeName: string | 'Shoes' | 'Bike' | 'Other';
    gearStatusName: string | 'active' | 'retired';
    displayName: string | null;
    customMakeModel: string;
    imageNameLarge: string | null;
    imageNameMedium: string | null;
    imageNameSmall: string | null;
    dateBegin: string; // ISO 8601 date string
    dateEnd: string | null; // ISO 8601 date string or null
    maximumMeters: number;
    notified: boolean;
    createDate: string; // ISO 8601 date string
    updateDate: string; // ISO 8601 date string
}
