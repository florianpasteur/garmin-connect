export interface YearCalendar {
    startDayOfJanuary: number;
    leapYear: boolean;
    yearItems: Array<{
        date: string;
        display: number;
    }>;
    yearSummaries: Array<{
        activityTypeId: number;
        numberOfActivities: number;
        totalDistance: number;
        totalDuration: number;
        totalCalories: number;
    }>;
}

export interface MonthCalendar {
    year: number;
    month: number;
    numOfDaysInMonth: number;
    numOfDaysInPrevMonth: number;
    startDayOfMonth: number;
    calendarItems: Array<{
        id: number;
        groupId: number | null;
        trainingPlanId: number | null;
        activityTypeId: number | null;
        wellnessActivityUuid: string | null;
        duration: number | null;
        distance: number | null;
        calories: number | null;
        floorsClimbed: number | null;
        avgRespirationRate: number | null;
        unitOfPoolLength: string | null;
        courseId: number | null;
        courseName: string | null;
        sportTypeKey: string | null;
        url: string | null;
        isStart: boolean | null;
        recurrenceId: number | null;
        isParent: boolean | null;
        parentId: number | null;
        userBadgeId: number | null;
        badgeCategoryTypeId: number | null;
        badgeCategoryTypeDesc: string | null;
        badgeAwardedDate: string | null;
        badgeViewed: boolean | null;
        hideBadge: boolean | null;
        startTimestampLocal: string | null;
        diveNumber: number | null;
        maxDepth: number | null;
        avgDepth: number | null;
        surfaceInterval: number | null;
        elapsedDuration: number | null;
        lapCount: number | null;
        bottomTime: number | null;
        atpPlanId: number | null;
        workoutId: number | null;
        protectedWorkoutSchedule: boolean;
        activeSets: number | null;
        strokes: number | null;
        noOfSplits: number | null;
        maxGradeValue: object | null;
        totalAscent: number | null;
        differenceStress: number | null;
        climbDuration: number | null;
        maxSpeed: number | null;
        averageHR: number | null;
        activeSplitSummaryDuration: number | null;
        activeSplitSummaryDistance: number | null;
        maxSplitDistance: number | null;
        maxSplitSpeed: number | null;
        location: string | null;
        shareableEventUuid: string | null;
        splitSummaryMode: string | null;
        workoutUuid: string | null;
        napStartTimeLocal: string | null;
        beginPackWeight: number | null;
        hasSplits: boolean | null;
        shareableEvent: boolean;
        primaryEvent: boolean | null;
        autoCalcCalories: boolean | null;
        subscribed: boolean | null;
        phasedTrainingPlan: boolean | null;
        decoDive: boolean | null;
        itemType: string;
        title: string | null;
        // Formatted as 'YYYY-MM-DD'
        date: string;
        weight?: number | null;
        difference?: number | null;
        isRace?: boolean | null;
        eventTimeLocal?: {
            startTimeHhMm: string;
            timeZoneId: string;
        } | null;
        completionTarget?: {
            value: number;
            unit: string;
            unitType: string;
        } | null;
    }>;
}

export interface WeekCalendar {
    startDate: string;
    endDate: string;
    numOfDaysInMonth: number;
    calendarItems: Array<{
        id: number;
        groupId: number | null;
        trainingPlanId: number | null;
        activityTypeId: number | null;
        wellnessActivityUuid: string | null;
        duration: number | null;
        distance: number | null;
        calories: number | null;
        floorsClimbed: number | null;
        avgRespirationRate: number | null;
        unitOfPoolLength: string | null;
        courseId: number | null;
        courseName: string | null;
        sportTypeKey: string | null;
        url: string | null;
        isStart: boolean | null;
        recurrenceId: number | null;
        isParent: boolean | null;
        parentId: number | null;
        userBadgeId: number | null;
        badgeCategoryTypeId: number | null;
        badgeCategoryTypeDesc: string | null;
        badgeAwardedDate: string | null;
        badgeViewed: boolean | null;
        hideBadge: boolean | null;
        startTimestampLocal: string | null;
        diveNumber: number | null;
        maxDepth: number | null;
        avgDepth: number | null;
        surfaceInterval: number | null;
        elapsedDuration: number | null;
        lapCount: number | null;
        bottomTime: number | null;
        atpPlanId: number | null;
        workoutId: number | null;
        protectedWorkoutSchedule: boolean;
        activeSets: number | null;
        strokes: number | null;
        noOfSplits: number | null;
        maxGradeValue: object | null;
        totalAscent: number | null;
        differenceStress: number | null;
        climbDuration: number | null;
        maxSpeed: number | null;
        averageHR: number | null;
        activeSplitSummaryDuration: number | null;
        activeSplitSummaryDistance: number | null;
        maxSplitDistance: number | null;
        maxSplitSpeed: number | null;
        location: string | null;
        shareableEventUuid: string | null;
        splitSummaryMode: string | null;
        workoutUuid: string | null;
        napStartTimeLocal: string | null;
        beginPackWeight: number | null;
        hasSplits: boolean | null;
        shareableEvent: boolean;
        primaryEvent: boolean | null;
        autoCalcCalories: boolean | null;
        subscribed: boolean | null;
        phasedTrainingPlan: boolean | null;
        decoDive: boolean | null;
        itemType: string;
        title: string | null;
        // Formatted as 'YYYY-MM-DD'
        date: string;
        weight?: number | null;
        difference?: number | null;
        isRace?: boolean | null;
        eventTimeLocal?: {
            startTimeHhMm: string;
            timeZoneId: string;
        } | null;
        completionTarget?: {
            value: number;
            unit: string;
            unitType: string;
        } | null;
    }>;
}
