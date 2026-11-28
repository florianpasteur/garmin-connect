export type GCActivityId = number;

/** Top level activity types, the `activityType` filter of `getActivities` */
export enum ActivityType {
    Cycling = 'cycling',
    FitnessEquipment = 'fitness_equipment',
    Walking = 'walking',
    Hiking = 'hiking',
    Other = 'other',
    WaterSport = 'water_sports',
    Running = 'street_running',
    // `Running` above is street running, this is every kind of running
    AllRunning = 'running',
    Swimming = 'swimming',
    MultiSport = 'multi_sport',
    Steps = 'steps',
    Diving = 'diving',
    Safety = 'safety',
    WinterSports = 'winter_sports',
    ParaSports = 'para_sports',
    TeamSports = 'team_sports',
    RacketSports = 'racket_sports'
}

/** Activity subtypes, the `subActivityType` filter of `getActivities` */
export enum ActivitySubType {
    IndoorCardio = 'indoor_cardio', // Maps to FitnessEquipment
    StrengthTraining = 'strength_training', // Maps to FitnessEquipment
    HIIT = 'hiit', // Maps to FitnessEquipment
    Yoga = 'yoga', // Maps to FitnessEquipment
    IndoorCycling = 'indoor_cycling', // Maps to Cycling
    Breathwork = 'breathwork', // Maps to Other
    Surfing = 'surfing', // Maps to WaterSport
    StreetRunning = 'street_running', // Maps to Running
    TrailRunning = 'trail_running', // Maps to Running
    IndoorRunning = 'indoor_running', // Maps to Running
    // Maps to Cycling
    MountainBiking = 'mountain_biking',
    RoadBiking = 'road_biking',
    Cyclocross = 'cyclocross',
    DownhillBiking = 'downhill_biking',
    TrackCycling = 'track_cycling',
    RecumbentCycling = 'recumbent_cycling',
    Bmx = 'bmx',
    GravelCycling = 'gravel_cycling',
    VirtualRide = 'virtual_ride',
    EBikeMountain = 'e_bike_mountain',
    EBikeFitness = 'e_bike_fitness',
    HandCycling = 'hand_cycling',
    IndoorHandCycling = 'indoor_hand_cycling',
    EnduroMtb = 'enduro_mtb',
    EEnduroMtb = 'e_enduro_mtb',
    // Maps to AllRunning
    TrackRunning = 'track_running',
    TreadmillRunning = 'treadmill_running',
    VirtualRun = 'virtual_run',
    ObstacleRun = 'obstacle_run',
    UltraRun = 'ultra_run',
    Canicross = 'canicross',
    // Maps to FitnessEquipment
    Elliptical = 'elliptical',
    StairClimbing = 'stair_climbing',
    IndoorRowing = 'indoor_rowing',
    Pilates = 'pilates',
    IndoorClimbing = 'indoor_climbing',
    Bouldering = 'bouldering',
    OnshoreGrindingV2 = 'onshore_grinding_v2',
    Dance = 'dance',
    JumpRope = 'jump_rope',
    Mobility = 'mobility',
    CrossCountryIndoorSkiing = 'cross_country_indoor_skiing',
    // Maps to Walking
    CasualWalking = 'casual_walking',
    SpeedWalking = 'speed_walking',
    // Maps to Swimming
    LapSwimming = 'lap_swimming',
    OpenWaterSwimming = 'open_water_swimming',
    // Maps to Other
    Mountaineering = 'mountaineering',
    WindKiteSurfing = 'wind_kite_surfing',
    HorsebackRiding = 'horseback_riding',
    DrivingGeneral = 'driving_general',
    Flying = 'flying',
    WhitewaterRaftingKayaking = 'whitewater_rafting_kayaking',
    InlineSkating = 'inline_skating',
    Golf = 'golf',
    HuntingFishing = 'hunting_fishing',
    SkyDiving = 'sky_diving',
    RcDrone = 'rc_drone',
    RockClimbing = 'rock_climbing',
    HangGliding = 'hang_gliding',
    WingsuitFlying = 'wingsuit_flying',
    FloorClimbing = 'floor_climbing',
    StopWatch = 'stop_watch',
    AutoRacing = 'auto_racing',
    ESport = 'e_sport',
    MotorcyclingV2 = 'motorcycling_v2',
    MotocrossV2 = 'motocross_v2',
    AtvV2 = 'atv_v2',
    TransitionV2 = 'transition_v2',
    SwimToBikeTransitionV2 = 'swimToBikeTransition_v2',
    BikeToRunTransitionV2 = 'bikeToRunTransition_v2',
    RunToBikeTransitionV2 = 'runToBikeTransition_v2',
    Hunting = 'hunting',
    Meditation = 'meditation',
    DiscGolf = 'disc_golf',
    Boxing = 'boxing',
    Archery = 'archery',
    MixedMartialArts = 'mixed_martial_arts',
    Overland = 'overland',
    // Maps to Diving
    SingleGasDiving = 'single_gas_diving',
    MultiGasDiving = 'multi_gas_diving',
    GaugeDiving = 'gauge_diving',
    ApneaDiving = 'apnea_diving',
    ApneaHunting = 'apnea_hunting',
    CcrDiving = 'ccr_diving',
    PoolApnea = 'pool_apnea',
    // Maps to Safety
    Assistance = 'assistance',
    IncidentDetected = 'incident_detected',
    FallDetected = 'fall_detected',
    // Maps to WinterSports
    SnowmobilingWs = 'snowmobiling_ws',
    SnowShoeWs = 'snow_shoe_ws',
    SkatingWs = 'skating_ws',
    BackcountrySkiingSnowboardingWs = 'backcountry_skiing_snowboarding_ws',
    SkateSkiingWs = 'skate_skiing_ws',
    CrossCountrySkiingWs = 'cross_country_skiing_ws',
    ResortSkiingSnowboardingWs = 'resort_skiing_snowboarding_ws',
    BackcountrySkiing = 'backcountry_skiing',
    BackcountrySnowboarding = 'backcountry_snowboarding',
    ResortSkiing = 'resort_skiing',
    ResortSnowboarding = 'resort_snowboarding',
    Skijoring = 'skijoring',
    // Maps to ParaSports
    WheelchairPushRun = 'wheelchair_push_run',
    WheelchairPushWalk = 'wheelchair_push_walk',
    // Maps to TeamSports
    Cricket = 'cricket',
    Rugby = 'rugby',
    IceHockey = 'ice_hockey',
    FieldHockey = 'field_hockey',
    Lacrosse = 'lacrosse',
    Volleyball = 'volleyball',
    UltimateDisc = 'ultimate_disc',
    Softball = 'softball',
    Soccer = 'soccer',
    AmericanFootball = 'american_football',
    Basketball = 'basketball',
    Baseball = 'baseball',
    // Maps to RacketSports
    TableTennis = 'table_tennis',
    PlatformTennis = 'platform_tennis',
    Racquetball = 'racquetball',
    Squash = 'squash',
    Badminton = 'badminton',
    Pickleball = 'pickleball',
    Paddelball = 'paddelball',
    TennisV2 = 'tennis_v2',
    // Maps to WaterSport
    BoatingV2 = 'boating_v2',
    FishingV2 = 'fishing_v2',
    KayakingV2 = 'kayaking_v2',
    KiteboardingV2 = 'kiteboarding_v2',
    OffshoreGrindingV2 = 'offshore_grinding_v2',
    PaddlingV2 = 'paddling_v2',
    WhitewaterRaftingV2 = 'whitewater_rafting_v2',
    RowingV2 = 'rowing_v2',
    SailingV2 = 'sailing_v2',
    StandUpPaddleboardingV2 = 'stand_up_paddleboarding_v2',
    SurfingV2 = 'surfing_v2',
    WaterTubing = 'water_tubing',
    WindsurfingV2 = 'windsurfing_v2',
    WakeboardingV2 = 'wakeboarding_v2',
    Wakesurfing = 'wakesurfing',
    Waterskiing = 'waterskiing',
    Snorkeling = 'snorkeling',
    // Maps to Hiking
    Rucking = 'rucking'
}

export interface IActivity {
    activityId: GCActivityId;
    activityName: string;
    description: unknown;
    startTimeLocal: string;
    startTimeGMT: string;
    activityType: {
        typeId: number;
        typeKey: string;
        parentTypeId: number;
        isHidden: boolean;
        sortOrder: unknown;
        trimmable: boolean;
        restricted: boolean;
    };
    eventType: { typeId: number; typeKey: string; sortOrder: number };
    comments: unknown;
    parentId: unknown;
    distance: number;
    duration: number;
    elapsedDuration: number;
    movingDuration: number;
    elevationGain: number;
    elevationLoss: number;
    averageSpeed: number;
    maxSpeed: number;
    startLatitude: number;
    startLongitude: number;
    hasPolyline: boolean;
    ownerId: number;
    ownerDisplayName: string;
    ownerFullName: string;
    ownerProfileImageUrlSmall: string;
    ownerProfileImageUrlMedium: string;
    ownerProfileImageUrlLarge: string;
    calories: number;
    averageHR: number;
    maxHR: number;
    averageRunningCadenceInStepsPerMinute: number;
    maxRunningCadenceInStepsPerMinute: number;
    averageBikingCadenceInRevPerMinute: unknown;
    maxBikingCadenceInRevPerMinute: unknown;
    averageSwimCadenceInStrokesPerMinute: unknown;
    maxSwimCadenceInStrokesPerMinute: unknown;
    averageSwolf: unknown;
    activeLengths: unknown;
    steps: number;
    conversationUuid: unknown;
    conversationPk: unknown;
    numberOfActivityLikes: unknown;
    numberOfActivityComments: unknown;
    likedByUser: unknown;
    commentedByUser: unknown;
    activityLikeDisplayNames: unknown;
    activityLikeFullNames: unknown;
    activityLikeProfileImageUrls: unknown;
    requestorRelationship: unknown;
    userRoles: string[];
    privacy: { typeId: number; typeKey: string };
    userPro: boolean;
    courseId: unknown;
    poolLength: unknown;
    unitOfPoolLength: unknown;
    hasVideo: boolean;
    videoUrl: unknown;
    timeZoneId: number;
    beginTimestamp: number;
    sportTypeId: number;
    avgPower: unknown;
    maxPower: unknown;
    aerobicTrainingEffect: unknown;
    anaerobicTrainingEffect: unknown;
    strokes: unknown;
    normPower: unknown;
    leftBalance: unknown;
    rightBalance: unknown;
    avgLeftBalance: unknown;
    max20MinPower: unknown;
    avgVerticalOscillation: unknown;
    avgGroundContactTime: unknown;
    avgStrideLength: number;
    avgFractionalCadence: unknown;
    maxFractionalCadence: unknown;
    trainingStressScore: unknown;
    intensityFactor: unknown;
    vO2MaxValue: number;
    avgVerticalRatio: unknown;
    avgGroundContactBalance: unknown;
    lactateThresholdBpm: unknown;
    lactateThresholdSpeed: unknown;
    maxFtp: unknown;
    avgStrokeDistance: unknown;
    avgStrokeCadence: unknown;
    maxStrokeCadence: unknown;
    workoutId: unknown;
    avgStrokes: unknown;
    minStrokes: unknown;
    deviceId: number;
    minTemperature: unknown;
    maxTemperature: unknown;
    minElevation: number;
    maxElevation: number;
    avgDoubleCadence: unknown;
    maxDoubleCadence: number;
    summarizedExerciseSets: unknown;
    maxDepth: unknown;
    avgDepth: unknown;
    surfaceInterval: unknown;
    startN2: unknown;
    endN2: unknown;
    startCns: unknown;
    endCns: unknown;
    summarizedDiveInfo: {
        weight: unknown;
        weightUnit: unknown;
        visibility: unknown;
        visibilityUnit: unknown;
        surfaceCondition: unknown;
        current: unknown;
        waterType: unknown;
        waterDensity: unknown;
        summarizedDiveGases: [];
        totalSurfaceTime: unknown;
    };
    activityLikeAuthors: unknown;
    avgVerticalSpeed: unknown;
    maxVerticalSpeed: number;
    floorsClimbed: unknown;
    floorsDescended: unknown;
    manufacturer: string;
    diveNumber: unknown;
    locationName: string;
    bottomTime: unknown;
    lapCount: number;
    endLatitude: number;
    endLongitude: number;
    endTimeGMT: string;
    minAirSpeed: unknown;
    maxAirSpeed: unknown;
    avgAirSpeed: unknown;
    avgWindYawAngle: unknown;
    minCda: unknown;
    maxCda: unknown;
    avgCda: unknown;
    avgWattsPerCda: unknown;
    flow: unknown;
    grit: unknown;
    jumpCount: unknown;
    caloriesEstimated: unknown;
    caloriesConsumed: unknown;
    waterEstimated: unknown;
    waterConsumed: unknown;
    maxAvgPower_1: unknown;
    maxAvgPower_2: unknown;
    maxAvgPower_5: unknown;
    maxAvgPower_10: unknown;
    maxAvgPower_20: unknown;
    maxAvgPower_30: unknown;
    maxAvgPower_60: unknown;
    maxAvgPower_120: unknown;
    maxAvgPower_300: unknown;
    maxAvgPower_600: unknown;
    maxAvgPower_1200: unknown;
    maxAvgPower_1800: unknown;
    maxAvgPower_3600: unknown;
    maxAvgPower_7200: unknown;
    maxAvgPower_18000: unknown;
    excludeFromPowerCurveReports: unknown;
    totalSets: unknown;
    activeSets: unknown;
    totalReps: unknown;
    minRespirationRate: unknown;
    maxRespirationRate: unknown;
    avgRespirationRate: unknown;
    trainingEffectLabel: unknown;
    activityTrainingLoad: unknown;
    avgFlow: unknown;
    avgGrit: unknown;
    minActivityLapDuration: number;
    avgStress: unknown;
    startStress: unknown;
    endStress: unknown;
    differenceStress: unknown;
    maxStress: unknown;
    aerobicTrainingEffectMessage: unknown;
    anaerobicTrainingEffectMessage: unknown;
    splitSummaries: [];
    hasSplits: boolean;
    maxBottomTime: unknown;
    hasSeedFirstbeatProfile: unknown;
    calendarEventId: unknown;
    calendarEventUuid: unknown;
    avgGradeAdjustedSpeed: unknown;
    avgWheelchairCadence: unknown;
    maxWheelchairCadence: unknown;
    purposeful: boolean;
    manualActivity: boolean;
    autoCalcCalories: boolean;
    elevationCorrected: boolean;
    atpActivity: boolean;
    favorite: boolean;
    decoDive: unknown;
    pr: boolean;
    parent: boolean;
    /** Set once a dog was added to the activity */
    hasDog?: boolean | null;
    /** Dogs of the activity */
    dogProfileIds?: number[] | null;
}

export interface IActivityDetails {
    activityId: number;
    activityUUID: {
        uuid: string;
    };
    activityName: string;
    userProfileId: number;
    isMultiSportParent: boolean;
    activityTypeDTO: {
        typeId: number;
        typeKey: string;
        parentTypeId: number;
        isHidden: boolean;
        restricted: boolean;
        trimmable: boolean;
    };
    eventTypeDTO: {
        typeId: number;
        typeKey: string;
        sortOrder: number;
    };
    accessControlRuleDTO: {
        typeId: number;
        typeKey: string;
    };
    timeZoneUnitDTO: {
        unitId: number;
        unitKey: string;
        factor: number;
        timeZone: string;
    };
    metadataDTO: {
        isOriginal: boolean;
        deviceApplicationInstallationId: number;
        agentApplicationInstallationId?: null;
        agentString?: null;
        fileFormat: {
            formatId: number;
            formatKey: string;
        };
        associatedCourseId?: null;
        lastUpdateDate: string;
        uploadedDate: string;
        videoUrl?: null;
        hasDog?: boolean;
        dogProfileIds?: number[];
        hasPolyline: boolean;
        hasChartData: boolean;
        hasHrTimeInZones: boolean;
        hasPowerTimeInZones: boolean;
        userInfoDto: {
            userProfilePk: number;
            displayname: string;
            fullname: string;
            profileImageUrlLarge?: null;
            profileImageUrlMedium: string;
            profileImageUrlSmall: string;
            userPro: boolean;
        };
        childIds?: null[] | null;
        childActivityTypes?: null[] | null;
        sensors?:
            | {
                  manufacturer: string;
                  serialNumber: number;
                  sku: string;
                  fitProductNumber: number;
                  sourceType: string;
                  antplusDeviceType: string;
                  softwareVersion: number;
                  batteryStatus: string;
              }[]
            | null;
        activityImages?:
            | {
                  imageId: string;
                  url: string;
                  smallUrl: string;
                  mediumUrl: string;
                  expirationTimestamp?: null;
                  latitude?: null;
                  longitude?: null;
                  photoDate?: null;
              }[]
            | null;
        manufacturer: string;
        diveNumber?: null;
        lapCount: number;
        associatedWorkoutId: number;
        isAtpActivity?: null;
        deviceMetaDataDTO: {
            deviceId: string;
            deviceTypePk: number;
            deviceVersionPk: number;
        };
        hasIntensityIntervals: boolean;
        hasSplits: boolean;
        eBikeMaxAssistModes?: null;
        eBikeBatteryUsage?: null;
        eBikeBatteryRemaining?: null;
        eBikeAssistModeInfoDTOList?: null;
        calendarEventInfo?: null;
        personalRecord: boolean;
        gcj02: boolean;
        runPowerWindDataEnabled?: null;
        autoCalcCalories: boolean;
        favorite: boolean;
        manualActivity: boolean;
        trimmed: boolean;
        elevationCorrected: boolean;
    };
    summaryDTO: {
        startTimeLocal: string;
        startTimeGMT: string;
        startLatitude: number;
        startLongitude: number;
        distance: number;
        duration: number;
        movingDuration: number;
        elapsedDuration: number;
        elevationGain: number;
        elevationLoss: number;
        maxElevation: number;
        minElevation: number;
        averageSpeed: number;
        averageMovingSpeed: number;
        maxSpeed: number;
        calories: number;
        averageHR: number;
        maxHR: number;
        averageRunCadence: number;
        maxRunCadence: number;
        averageTemperature: number;
        maxTemperature: number;
        minTemperature: number;
        groundContactTime: number;
        groundContactBalanceLeft: number;
        strideLength: number;
        verticalOscillation: number;
        trainingEffect: number;
        anaerobicTrainingEffect: number;
        aerobicTrainingEffectMessage: string;
        anaerobicTrainingEffectMessage: string;
        verticalRatio: number;
        endLatitude: number;
        endLongitude: number;
        maxVerticalSpeed: number;
        minActivityLapDuration: number;
    };
    locationName: string;
    splitSummaries?:
        | {
              distance: number;
              duration: number;
              movingDuration: number;
              elapsedDuration: number;
              elevationGain: number;
              elevationLoss: number;
              averageSpeed: number;
              averageMovingSpeed: number;
              maxSpeed: number;
              calories: number;
              averageHR: number;
              maxHR: number;
              averageRunCadence: number;
              maxRunCadence: number;
              averageTemperature: number;
              maxTemperature: number;
              minTemperature: number;
              groundContactTime: number;
              groundContactBalanceLeft: number;
              strideLength: number;
              verticalOscillation: number;
              verticalRatio: number;
              totalExerciseReps: number;
              splitType: string;
              noOfSplits: number;
              maxElevationGain: number;
              averageElevationGain: number;
              maxDistance: number;
          }[]
        | null;
}
