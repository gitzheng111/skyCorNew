import dayjs from 'dayjs'

export function generateTaskName(taskList, attribution) {

    const timestamp =
        dayjs().format('YYYYMMDDHHmm')

    const firstFlight =
        taskList?.[0]?.flightList?.[0]?.flightNumber

    const countryCount =
        taskList?.length || 0

    return `${timestamp}_${firstFlight}_${countryCount}国飞越申请`
}