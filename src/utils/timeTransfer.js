// timeTransfer.js
import { format, parse, isValid } from 'date-fns'; // 需要安装 date-fns 处理日期格式
import { toZonedTime, formatInTimeZone, getTimezoneOffset } from 'date-fns-tz'; // 引入 date-fns-tz 库

import transferTimezone from 'airport-timezone';
import { transferToOutput } from '../utils/airportCodeTool.js'
// console.log('transferTimezone', transferTimezone)
const formatsToTry = ['HH:mm:ss', 'HH:mm'];

// 获取机场时区--
const getAirportTimeZone = (airportCode) => {
    try {
        var areaInfo = transferTimezone.filter(function (airport) {
            // console.log('timezone', airportCode);

            return airport.code === airportCode;
        })[0];
        // console.log('areaInfo', areaInfo);

        const timezone = areaInfo.timezone
        // console.log('timezone', timezone);
        return timezone;
    } catch (error) {
        console.error("Error getting airport timezone", error);
    }
}
// 获取北京时间（GMT+8）对应的 UTC 时间
export function beijingToUTC(beijingTimeStr) {
    // 解析北京时间字符串
    // console.log('beijingTimeStr', beijingTimeStr)
    let beijingTime = null;

    for (const fmt of formatsToTry) {
        beijingTime = parse(beijingTimeStr, fmt, new Date());
        if (isValid(beijingTime)) break;
    }

    // console.log('beijingTime', beijingTime)
    if (!isValid(beijingTime)) {
        throw new Error('Invalid Beijing time format');

    }
    const utcTime = new Date(beijingTime.getTime() - 8 * 60 * 60 * 1000); // 北京时间减去8小时获得UTC时间
    return format(utcTime, 'HH:mm'); // 返回UTC时间，08:00格式
}

// 获取UTC时间转换为北京时间（GMT+8）
export function utcToBeijing(utcTimeStr) {
    // 解析UTC时间字符串
    const utcTime = parse(utcTimeStr, 'HH:mm', new Date());
    if (!isValid(utcTime)) {
        throw new Error('Invalid UTC time format');
    }
    const beijingTime = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000); // UTC时间加上8小时获得北京时间
    return format(beijingTime, 'HH:mm'); // 返回北京时间，08:00格式
}
// 获取北京时间转为本地时间（考虑夏令时和冬令时）
export function beijingToLocal(beijingTimeStr, airport) {
    // 获取机场时区
    const transferARP = transferToOutput(airport, 'IATACode')
    const timeZone = getAirportTimeZone(transferARP);
    if (!timeZone) {
        throw new Error('Unable to get the time zone for airport');
    }
    let beijingTime = null;
    // 将北京时间转换为 UTC 时间
    for (const fmt of formatsToTry) {
        beijingTime = parse(beijingTimeStr, fmt, new Date());
        if (isValid(beijingTime)) break;
    }
    // const utcTime = new Date(beijingTime.getTime() - 8 * 60 * 60 * 1000); // 北京时间减去8小时获得UTC时间
    // console.log('beijingTime', beijingTime,'timeZone',timeZone)
    // 将UTC时间转换为本地时区时间
    const UTC = toZonedTime(beijingTime, 'Asia/Shanghai'); // 根据时区转换时间
    // console.log('UTC',UTC)
    const localTime = formatInTimeZone(UTC, timeZone, 'HH:mm')
    const offsetLocal = getTimezoneOffset(timeZone, UTC);
    // console.log('offsetLocal',offsetLocal)

    const offsetBeijing = getTimezoneOffset('Asia/Shanghai', UTC);
    // console.log('offsetLocal',offsetBeijing)

    const timeOffsetInMinutes = offsetLocal - offsetBeijing;

    // console.log('timeOffset',timeOffsetInMinutes)

    return localTime;
}


// 转换为没有冒号的08:00格式
export function formatTimeWithoutColon(timeStr) {
    // 解析时间字符串并转换为没有冒号的格式
    const time = parse(timeStr, 'HH:mm', new Date());
    if (!isValid(time)) {
        throw new Error('Invalid time format');
    }
    return format(time, 'HHmm'); // 返回时间格式为0800
}

// 转换为带冒号的08:00格式
export function formatTimeWithColon(timeStr) {
    // console.log('输入的timeStr', timeStr);
    if (timeStr && timeStr.length === 4) {
        return timeStr.slice(0, 2) + ':' + timeStr.slice(2);
    }
    // 假设输入的时间格式是 "HH:mm:ss"，如果是 "HH:mm" ，需要处理
    if (timeStr && timeStr.length === 8 && timeStr.includes(':')) {
        return timeStr.slice(0, 5); // 提取前5个字符（"HH:mm"）
    }

    return timeStr

    // const time = parse(timeStr, 'HH:mm:ss', new Date());
    // if (!isValid(time)) {
    //     throw new Error('Invalid time format');
    // }
    // return format(time, 'HH:mm'); // 返回时间格式为 HH:mm
}

// 根据国家转化成不同格式
export const formatDateToCountry = (inputDate, country, place) => {
    // console.log('输入的内容',inputDate, country, place)
    const parseDate = (dateString) => {
        let formattedDate = dateString;
        if (formattedDate.includes("/")) {
            // 尝试处理日期格式为 yyyy/mm/dd 或 dd/mm/yyyy
            formattedDate = formattedDate.replace(/\//g, '-');
        }
        // 如果日期是以横杠分隔的（yyyy-mm-dd 或 dd-mm-yyyy）
        else if (formattedDate.includes("-")) {
        } else {
            return null;
        }

        // 尝试将字符串转换为 Date 对象
        const date = new Date(formattedDate);
        return isNaN(date.getTime()) ? null : date;
    };
    const date = parseDate(inputDate);
    // console.log('date',date)

    if (!date) {
        throw new Error("无效的日期格式");
    }
    const day = String(date.getDate()).padStart(2, '0'); // 日，补充 0
    const monthInt = date.getMonth()//整数月份
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月，补充 0

    const year = date.getFullYear(); // 年
    const shortYear = String(year).slice(2); // 只保留两位年份
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // if (month < 0 || month > 11) {
    //     throw new Error("无效的月份");
    // }


    if (country === '越南' ) {
        if(place==='blank'){
            return `${day}${monthNames[monthInt].slice(0, 3)}${shortYear}`;
        }if(place==='outside'){
            return `${day}/${month}/${shortYear}`;
        }
    } else if (country === '马来西亚' || country === '老挝'|| country === '菲律宾'||country === '俄罗斯') {
        if(place==='blank'){
          // 马来西亚/老挝格式：30Sep25

            return `${day}${monthNames[monthInt].slice(0, 3)}${shortYear}`;
        }  if(place==='outside'){
            console.log('打印',`${day}${monthNames[monthInt].toUpperCase()}${shortYear}`)

            return `${day}${monthNames[monthInt].toUpperCase()}${shortYear}`;
        }
    } else if (country === '柬埔寨' ) {
      
        if(place==='blank'){
            return `${shortYear}${month}${day}`;
        }  
    } else if (country === '哈萨克斯坦' ) {
        if(place==='blank'){
            return `${year}${month}${day}`;
        }  
        if(place==='outside'){
            return `${shortYear}-${month}-${day}`;
        }  
    } 
    else if (country === '蒙古' ) {
        if(place==='blank'){
            return `${day}${monthNames[monthInt].toUpperCase()}${year}`;
        }  
        if(place==='outside'){
            return `${day}${monthNames[monthInt].toUpperCase()}${year}`;
        }  
    } 
};