import { formatTimeWithColon } from './timeTransfer.js'
import { parse, isValid, differenceInMilliseconds } from 'date-fns';


export function permissionCheck(permission, schedule,country) {
    // console.log('permissionMatched,', permission )
    // console.log('curSchedule',schedule)

    const permissionMatched = permission
    const curSchedule = schedule
    // console.log('permissionMatched,', permissionMatched.departureTime, 'curSchedule', curSchedule.departure_time)

    const permissionDepartureTime = formatTimeWithColon(permissionMatched[0].departureTime);
    const scheduleDepartureTime = formatTimeWithColon(curSchedule.departureTime);
    console.log('permissionDepartureTime',permissionDepartureTime,'scheduleDepartureTime',scheduleDepartureTime)

    const timedDifference = Math.abs( timeToMinutes(permissionDepartureTime)- timeToMinutes(scheduleDepartureTime))
    console.log('timedDifference',timedDifference)
    // console.log('时间差',Math.abs( convertToDate(permissionDepartureTime)- convertToDate(scheduleDepartureTime)))
    if (timedDifference) {
        // console.log('时间未匹配');
        
        // 根据国家规则进行有效性检查
        if (country === '越南') {
            console.log('执行国家判断')
            // 判断计划时间和批复时间是否在24小时范围内
            // const difference = differenceInMilliseconds(permissionDate, scheduleDate);
            // 24小时内有效
            const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
            if (timedDifference*60*1000 <= oneDayInMilliseconds) {
                // console.log('时间在有效范围内，规则验证通过');
                return {result: true ,message: `航班时间在有效范围内`};
            } else {
                return {result: false ,message:`航班时间超出了${country}有效范围)`};
            }
        }
        if (country === '老挝') {
            console.log('执行国家判断')
            // 判断计划时间和批复时间是否在24小时范围内
            // const difference = differenceInMilliseconds(permissionDate, scheduleDate);
            // 24小时内有效
            const oneDayInMilliseconds = 48 * 60 * 60 * 1000;
            if (timedDifference <= oneDayInMilliseconds) {
                // console.log('时间在有效范围内，规则验证通过');
                return {result: true ,message: `航班时间在有效范围内`};
            } else {
                return {result: false ,message:`航班时间超出了${country}有效范围)`};
            }
        }
    }
    return {result: true ,message: `时间匹配正确`}


}
function convertToDate(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
    const today = new Date();
    today.setHours(hours);
    today.setMinutes(minutes);
    today.setSeconds(0);  // 设置秒数为 0
    today.setMilliseconds(0);  // 设置毫秒为 0
    return today;
}
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}