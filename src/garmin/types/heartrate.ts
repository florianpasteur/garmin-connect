export interface HeartRateValueDescriptor {
    key: string;
    index: number;
}

export interface HeartRateEntry {
    timestamp: number;
    heartrate: number;
}

export interface HeartRate {
    userProfilePK: number;
    calendarDate: string;
    startTimestampGMT: string | null;
    endTimestampGMT: string | null;
    startTimestampLocal: string | null;
    endTimestampLocal: string | null;
    maxHeartRate: number | null;
    minHeartRate: number | null;
    restingHeartRate: number | null;
    lastSevenDaysAvgRestingHeartRate: number | null;
    heartRateValueDescriptors: HeartRateValueDescriptor[] | null;
    heartRateValues: HeartRateEntry[][] | null;
}
