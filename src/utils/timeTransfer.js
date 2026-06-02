// timeTransfer.js

import { format, parse, isValid } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import airportTimezone from 'airport-timezone'
import { transferToOutput } from '../utils/airportCodeTool.js'

/**
 * 支持的时间格式
 */
const formatsToTry = [
    'HH:mm:ss',
    'HH:mm'
]

/**
 * 机场时区缓存
 * O(1)查询
 */
const timezoneMap = new Map()

airportTimezone.forEach(item => {
    timezoneMap.set(
        item.code,
        item.timezone
    )
})

/**
 * 获取机场时区
 */
export function getAirportTimeZone(
    airportCode
) {
    if (!airportCode) return null

    return timezoneMap.get(
        airportCode
    )
}

/**
 * 安全时间解析
 */
export function parseTimeSafe(
    timeStr
) {

    if (
        timeStr === null ||
        timeStr === undefined
    ) {
        return null
    }

    const value = String(
        timeStr
    ).trim()

    if (
        !value ||
        value === '--' ||
        value === 'TBD' ||
        value === 'N/A'
    ) {
        return null
    }

    for (const fmt of formatsToTry) {

        const parsed = parse(
            value,
            fmt,
            new Date()
        )

        if (isValid(parsed)) {
            return parsed
        }
    }

    console.warn(
        '[时间解析失败]',
        value
    )

    return null
}

/**
 * 北京时间 -> UTC
 */
export function beijingToUTC(
    beijingTimeStr,
    context = {}
) {

    const parsed =
        parseTimeSafe(
            beijingTimeStr
        )

    if (!parsed) {

        console.warn(
            '[北京时间转UTC失败]',
            {
                value:
                    beijingTimeStr,
                ...context
            }
        )

        return '--:--'
    }

    const utcTime =
        new Date(
            parsed.getTime()
            - 8 * 60 * 60 * 1000
        )

    return format(
        utcTime,
        'HH:mm'
    )
}

/**
 * UTC -> 北京时间
 */
export function utcToBeijing(
    utcTimeStr
) {

    const parsed =
        parseTimeSafe(
            utcTimeStr
        )

    if (!parsed) {
        return '--:--'
    }

    const beijingTime =
        new Date(
            parsed.getTime()
            + 8 * 60 * 60 * 1000
        )

    return format(
        beijingTime,
        'HH:mm'
    )
}

/**
 * 北京时间 -> 当地时间
 */
export function beijingToLocal(
    beijingTimeStr,
    airport
) {

    if (!airport) {
        return '--:--'
    }

    const iataCode =
        transferToOutput(
            airport,
            'IATACode'
        )

    if (!iataCode) {

        console.warn(
            '[机场转换失败]',
            airport
        )

        return '--:--'
    }

    const timezone =
        getAirportTimeZone(
            iataCode
        )

    if (!timezone) {

        console.warn(
            '[机场无时区]',
            {
                airport,
                iataCode
            }
        )

        return '--:--'
    }

    const parsed =
        parseTimeSafe(
            beijingTimeStr
        )

    if (!parsed) {

        console.warn(
            '[北京时间转当地时间失败]',
            {
                airport,
                value:
                    beijingTimeStr
            }
        )

        return '--:--'
    }

    return formatInTimeZone(
        parsed,
        timezone,
        'HH:mm'
    )
}

/**
 * HH:mm -> HHmm
 */
export function formatTimeWithoutColon(
    timeStr
) {

    const parsed =
        parseTimeSafe(
            timeStr
        )

    if (!parsed) {
        return ''
    }

    return format(
        parsed,
        'HHmm'
    )
}

/**
 * HHmm -> HH:mm
 */
export function formatTimeWithColon(
    timeStr
) {

    if (
        !timeStr &&
        timeStr !== 0
    ) {
        return ''
    }

    const value =
        String(timeStr)

    if (
        value.length === 4 &&
        !value.includes(':')
    ) {
        return (
            value.slice(0, 2) +
            ':' +
            value.slice(2)
        )
    }

    if (
        value.length === 8 &&
        value.includes(':')
    ) {
        return value.slice(0, 5)
    }

    return value
}

/**
 * 0800 -> Date
 */
export function strToDate(
    timeStr
) {

    if (!timeStr) {
        return null
    }

    const value =
        String(timeStr)

    if (value.length !== 4) {
        return null
    }

    const hours =
        parseInt(
            value.slice(0, 2),
            10
        )

    const minutes =
        parseInt(
            value.slice(2, 4),
            10
        )

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return null
    }

    const d = new Date()

    d.setHours(
        hours,
        minutes,
        0,
        0
    )

    return d
}

/**
 * 扫描航班时间异常
 */
export function validateFlightTime(
    flights = []
) {

    const errors = []

    flights.forEach(
        flight => {

            if (
                !parseTimeSafe(
                    flight.departureTime
                )
            ) {

                errors.push({
                    flightNumber:
                        flight.flightNumber,
                    field:
                        'departureTime',
                    value:
                        flight.departureTime
                })
            }

            if (
                !parseTimeSafe(
                    flight.arrivalTime
                )
            ) {

                errors.push({
                    flightNumber:
                        flight.flightNumber,
                    field:
                        'arrivalTime',
                    value:
                        flight.arrivalTime
                })
            }
        }
    )

    if (errors.length) {

        console.group(
            '发现异常时间数据'
        )

        console.table(
            errors
        )

        console.groupEnd()
    }

    return errors
}