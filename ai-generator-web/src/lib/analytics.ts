export interface AnalyticsStats {
    pass: number;
    fail: number;
    avgWater: number;
    avgAir: number;
    avgDuration: number;
    totalReports: number;
    totalCustomers: number;
    totalConstructions: number;
    recentReports: number;
    previousWeekReports: number;
    weeklyMomentum: number;
    passRate: number;
    failRate: number;
    waterReports: number;
    airReports: number;
    avgDailyReports: number;
}

export interface DailyTrendPoint {
    date: string;
    label: string;
    total: number;
    pass: number;
    fail: number;
}

export interface MethodMixPoint {
    type: 'water' | 'air';
    count: number;
    percentage: number;
}

export interface DurationBucketPoint {
    bucket: 'under15' | '15to30' | '30to60' | 'over60';
    count: number;
}

export interface WeekdayActivityPoint {
    day: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
    total: number;
}

export interface AnalyticsFormRow {
    satisfies: boolean;
    type_id: number;
    examination_duration?: string | null;
    created_at?: string | null;
}

interface ComputeAnalyticsOptions {
    now?: Date;
    totalCustomers?: number;
    totalConstructions?: number;
    daysWindow?: number;
}

interface ComputeAnalyticsResult {
    stats: AnalyticsStats;
    dailyTrend: DailyTrendPoint[];
    methodMix: MethodMixPoint[];
    durationBuckets: DurationBucketPoint[];
    weekdayActivity: WeekdayActivityPoint[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const DEFAULT_DAYS_WINDOW = 30;

const WEEKDAY_KEYS: WeekdayActivityPoint['day'][] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const createInitialStats = (): AnalyticsStats => ({
    pass: 0,
    fail: 0,
    avgWater: 0,
    avgAir: 0,
    avgDuration: 0,
    totalReports: 0,
    totalCustomers: 0,
    totalConstructions: 0,
    recentReports: 0,
    previousWeekReports: 0,
    weeklyMomentum: 0,
    passRate: 0,
    failRate: 0,
    waterReports: 0,
    airReports: 0,
    avgDailyReports: 0,
});

export const createInitialDurationBuckets = (): DurationBucketPoint[] => ([
    { bucket: 'under15', count: 0 },
    { bucket: '15to30', count: 0 },
    { bucket: '30to60', count: 0 },
    { bucket: 'over60', count: 0 },
]);

export const createInitialWeekdayActivity = (): WeekdayActivityPoint[] =>
    WEEKDAY_KEYS.map((day) => ({ day, total: 0 }));

export const parseDurationMinutes = (val?: string | null) => {
    if (!val) return 0;
    const parts = val.split(':').map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return 0;
    const [h, m, s = 0] = parts;
    return h * 60 + m + s / 60;
};

export const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const formatDayLabel = (date: Date) =>
    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;

const createDailyTrendWindow = (now: Date, daysWindow: number): DailyTrendPoint[] => {
    const trend: DailyTrendPoint[] = [];
    for (let i = daysWindow - 1; i >= 0; i -= 1) {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - i);
        trend.push({
            date: toDateKey(date),
            label: formatDayLabel(date),
            total: 0,
            pass: 0,
            fail: 0,
        });
    }
    return trend;
};

export const computeAnalyticsFromForms = (
    forms: AnalyticsFormRow[],
    options: ComputeAnalyticsOptions = {},
): ComputeAnalyticsResult => {
    const now = options.now ?? new Date();
    const daysWindow = options.daysWindow ?? DEFAULT_DAYS_WINDOW;
    const nowMs = now.getTime();
    const totalReports = forms.length;

    let pass = 0;
    let fail = 0;
    let waterDuration = 0;
    let waterCount = 0;
    let airDuration = 0;
    let airCount = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let recentReports = 0;
    let previousWeekReports = 0;
    let waterReports = 0;
    let airReports = 0;

    const dailyTrend = createDailyTrendWindow(now, daysWindow);
    const dailyMap = new Map(dailyTrend.map((point) => [point.date, point]));
    const weekdayActivity = createInitialWeekdayActivity();
    const durationBuckets = createInitialDurationBuckets();

    forms.forEach((form) => {
        if (form.satisfies) pass += 1;
        else fail += 1;

        const minutes = parseDurationMinutes(form.examination_duration);
        if (form.type_id === 1) {
            waterDuration += minutes;
            waterCount += 1;
            waterReports += 1;
        } else if (form.type_id === 2) {
            airDuration += minutes;
            airCount += 1;
            airReports += 1;
        }

        if (minutes > 0) {
            totalDuration += minutes;
            durationCount += 1;
            if (minutes < 15) durationBuckets[0].count += 1;
            else if (minutes < 30) durationBuckets[1].count += 1;
            else if (minutes < 60) durationBuckets[2].count += 1;
            else durationBuckets[3].count += 1;
        }

        if (!form.created_at) return;

        const createdAt = new Date(form.created_at);
        const createdAtMs = createdAt.getTime();
        if (Number.isNaN(createdAtMs)) return;

        if (createdAtMs >= nowMs - WEEK_MS) recentReports += 1;
        else if (createdAtMs >= nowMs - WEEK_MS * 2) previousWeekReports += 1;

        const dayIndex = createdAt.getDay();
        weekdayActivity[dayIndex].total += 1;

        const dateKey = toDateKey(createdAt);
        const trendPoint = dailyMap.get(dateKey);
        if (trendPoint) {
            trendPoint.total += 1;
            if (form.satisfies) trendPoint.pass += 1;
            else trendPoint.fail += 1;
        }
    });

    const avgWater = waterCount ? +(waterDuration / waterCount).toFixed(1) : 0;
    const avgAir = airCount ? +(airDuration / airCount).toFixed(1) : 0;
    const avgDuration = durationCount ? +(totalDuration / durationCount).toFixed(1) : 0;
    const passRate = totalReports ? +((pass / totalReports) * 100).toFixed(1) : 0;
    const failRate = totalReports ? +((fail / totalReports) * 100).toFixed(1) : 0;
    const weeklyMomentum = previousWeekReports > 0
        ? +(((recentReports - previousWeekReports) / previousWeekReports) * 100).toFixed(1)
        : (recentReports > 0 ? 100 : 0);
    const avgDailyReports = +(recentReports / 7).toFixed(1);

    const methodMix: MethodMixPoint[] = [
        {
            type: 'water',
            count: waterReports,
            percentage: totalReports ? +((waterReports / totalReports) * 100).toFixed(1) : 0,
        },
        {
            type: 'air',
            count: airReports,
            percentage: totalReports ? +((airReports / totalReports) * 100).toFixed(1) : 0,
        },
    ];

    return {
        stats: {
            pass,
            fail,
            avgWater,
            avgAir,
            avgDuration,
            totalReports,
            totalCustomers: options.totalCustomers ?? 0,
            totalConstructions: options.totalConstructions ?? 0,
            recentReports,
            previousWeekReports,
            weeklyMomentum,
            passRate,
            failRate,
            waterReports,
            airReports,
            avgDailyReports,
        },
        dailyTrend,
        methodMix,
        durationBuckets,
        weekdayActivity,
    };
};
