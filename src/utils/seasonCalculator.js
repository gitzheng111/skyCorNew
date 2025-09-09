// src/utils/seasonCalculator.js
/**
 * 航季计算工具模块
 * 实现功能：根据民航局规范计算航季切换日期
 */

/**
 * 获取指定年月最后一个星期日
 * @param {number} year - 年份（如2025）
 * @param {number} month - 自然月（1-12）
 * @returns {Date} 最后一个周日的日期对象
 */
export const calculateSeasons = (year) => {
    const seasons = []
    // 计算夏秋航季（3月最后一个周日 - 10月最后一个周日）
    const summerStart = getLastSunday(year, 3)
    const summerEnd = getLastSunday(year, 10)

    // 计算冬春航季（10月最后一个周日 - 次年3月最后一个周日）
    const winterStart = summerEnd
    const winterEnd = getLastSunday(year + 1, 3)

    seasons.push({
        key: `S${year}`,
        label: `${year}夏秋航季`,
        start: summerStart,
        end: summerEnd
    }, {
        key: `W${year}`,
        label: `${year}冬春航季`,
        start: winterStart,
        end: winterEnd
    })

    return seasons
}
export const getLastSunday = (year, month) => {
    const lastDay = new Date(year, month, 0) // 获取当月最后一天‌:ml-citation{ref="8" data="citationList"}
    console.log('lastDay in getLastSunday',year,month,lastDay)
    for (let day = lastDay.getDate(); day > 0; day--) {
        const currentDate = new Date(year, month - 1, day)
        if (currentDate.getDay() === 0) return currentDate // 0表示周日‌:ml-citation{ref="8" data="citationList"}
    }
}

/**
 * 判断日期是否在航季范围内
 * @param {Date} targetDate - 待判断日期
 * @param {string} seasonKey - 航季标识（如2025S）
 */
export const isInSeason = (targetDate, seasonKey) => {
    const year = parseInt(seasonKey.slice(0, 4))
    const seasonType = seasonKey.slice(4)

    const summerStart = getLastSunday(year, 3)
    const summerEnd = getLastSunday(year, 10)
    const winterEnd = getLastSunday(year + 1, 3)

    return seasonType === 'S' ?
        targetDate >= summerStart && targetDate <= summerEnd :
        targetDate > summerEnd && targetDate <= winterEnd
}
