import { DateTime } from 'luxon';

export function toDateString(date: Date) {
    const offset = date.getTimezoneOffset();
    const offsetDate = new Date(date.getTime() - offset * 60 * 1000);
    const [dateString] = offsetDate.toISOString().split('T');
    return dateString;
}

export function calculateTimeDifference(
    sleepStartTimestampGMT: number,
    sleepEndTimestampGMT: number
): { hours: number; minutes: number } {
    // Calculate time difference in seconds
    const timeDifferenceInSeconds =
        (sleepEndTimestampGMT - sleepStartTimestampGMT) / 1000;

    // Convert time difference to hours and minutes
    const hours = Math.floor(timeDifferenceInSeconds / 3600);
    const minutes = Math.floor((timeDifferenceInSeconds % 3600) / 60);

    return {
        hours,
        minutes
    };
}

/**
 * The wall clock time of `date` in `timezone`, as `YYYY-MM-DDTHH:mm:ss.SSS`.
 * Does not depend on the timezone of the system.
 * @param timezone - IANA name, e.g. `Europe/Paris`
 * @throws RangeError when the timezone is unknown
 */
export function getLocalTimestamp(date: Date, timezone: string): string {
    const local = DateTime.fromJSDate(date).setZone(timezone);
    if (!local.isValid) {
        throw new RangeError('Invalid time zone specified: ' + timezone);
    }
    return local.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS");
}

/**
 * Splits an inclusive date range into consecutive ranges of at most `maxDays`
 * @returns Ranges as YYYY-MM-DD strings, oldest first
 * @throws Error when `start` is after `end`
 */
export function splitDateRange(
    start: Date,
    end: Date,
    maxDays: number
): Array<{ start: string; end: string }> {
    const day = 24 * 60 * 60 * 1000;
    const toUtc = (date: Date) => new Date(toDateString(date)).getTime();
    const format = (time: number) => new Date(time).toISOString().slice(0, 10);
    const last = toUtc(end);
    let first = toUtc(start);
    if (first > last) {
        throw new Error('splitDateRange: start date is after end date');
    }
    const ranges: Array<{ start: string; end: string }> = [];
    while (first <= last) {
        const chunkEnd = Math.min(first + (maxDays - 1) * day, last);
        ranges.push({ start: format(first), end: format(chunkEnd) });
        first = chunkEnd + day;
    }
    return ranges;
}
