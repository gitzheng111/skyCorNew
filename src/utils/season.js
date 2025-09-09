
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'

export const getLastSunday = (year, month) => {
    const lastDay = new Date(year, month, 0);
    for (let day = lastDay.getDate(); day > 0; day--) {
        const currentDate = new Date(year, month - 1, day);
        if (currentDate.getDay() === 0) return currentDate;
    }
    throw new Error("No Sunday found in the month");
};


export const seasonCalculate = (date) => {
    const year = date.getFullYear();
    const todayTime = date.getTime();

    const marchLastSunday = getLastSunday(year, 3);
    const octoberLastSunday = getLastSunday(year, 10);
    const nextMarchLastSunday = getLastSunday(year + 1, 3);

    // 夏秋航季区间
    const summerStart = marchLastSunday.getTime();
    const summerEnd = new Date(octoberLastSunday.getTime() - 24 * 60 * 60 * 1000).getTime();

    // 冬春航季区间
    const winterStart = octoberLastSunday.getTime();
    const winterEnd = new Date(nextMarchLastSunday.getTime() - 24 * 60 * 60 * 1000).getTime();

    let currentSeason, nextSeason, currentSeasonEnd;

    if (todayTime >= summerStart && todayTime <= summerEnd) {
        // 当前为夏秋航季
        currentSeason = {
            label: `${year}年夏秋季`,
            code: `${year}S`,
            en: `${year}Summer`,
            seasonStart:formatDate(summerStart),
            seasonEnd:formatDate(summerEnd)
        };
        nextSeason = {
            label: `${year}年冬春季`,
            code: `${year}W`,
            en: `${year}Winter`,
            seasonStart:formatDate(winterStart),
            seasonEnd:formatDate(winterEnd)
        };
        currentSeasonEnd = summerEnd;
    } else {
        // 当前为冬春航季，判断是跨年情况
        const isEarlyYear = todayTime < summerStart; // 当前日期小于当年3月最后周日
        const winterYear = isEarlyYear ? year - 1 : year;

        currentSeason = {
            label: `${winterYear}年冬春季`,
            code: `${winterYear}W`,
            en: `${winterYear}Winter`,
            seasonStart:formatDate(winterStart),
            seasonEnd:formatDate(winterEnd)
        };
        nextSeason = {
            label: `${year}年夏秋季`,
            code: `${year}S`,
            en: `${year}Summer`,
            seasonStart:formatDate(summerStart),
            seasonEnd:formatDate(summerEnd)
        };
        currentSeasonEnd = winterEnd;
    }

    // 计算剩余天数（向上取整）
    const oneDayMs = 24 * 60 * 60 * 1000;
    const remainDays = Math.ceil((currentSeasonEnd - todayTime) / oneDayMs);

    return {
        current: currentSeason,
        next: nextSeason,
        remainDays,
    };
};

const today = new Date()

function formatDate(timestamp) {
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0'); // 月份从0开始
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`; // 可以改成 yyyy-mm-dd
}

export const currentSeasonData = seasonCalculate(today)