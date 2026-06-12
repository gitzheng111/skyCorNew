// modules/task/utils/buildTaskData.js
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

export function buildTaskData(
    flights,
    selectedRoutes
) {

    const countryMap = new Map()

    flights.forEach(flight => {

        const key =
            `${flight.flightNumber}-${flight.departure}-${flight.arrival}`

        const routeCodes =
            selectedRoutes[key] || []

        const routes =
            flight.route.filter(
                r => routeCodes.includes(r.routeCode)
            )

        routes.forEach(route => {

            const countries =
                route.overflyCountry
                    ?.filter(
                        c => c.needPermit
                    ) || []

            countries.forEach(country => {

                if (!countryMap.has(country.country)) {

                    countryMap.set(
                        country.country,
                        {
                            overflyCountry:
                                country.country,

                            season:
                                flight.season,

                            attribution:
                                flight.attribution,

                            flightList: [],

                            routeList: [],

                            overflyDetails: []
                        }
                    )
                }

                const item =
                    countryMap.get(country.country)

                const exists =
                    item.flightList.some(
                        f =>
                            f.flightNumber ===
                            flight.flightNumber
                    )

                if (!exists) {

                    item.flightList.push({

                        flightNumber:
                            flight.flightNumber,

                        departure:
                            flight.departure,

                        arrival:
                            flight.arrival,

                        startDate:
                            flight.startDate,

                        endDate:
                            flight.endDate,

                        days:
                            flight.days
                    })
                }

                item.routeList.push(route)

                item.overflyDetails.push(
                    ...(country.overflyDetails || [])
                )
            })
        })
    })

    return Array.from(countryMap.values())
}
// const showChooseTask = (data) => {
//     .value = true
//     // selectAll.value = true

// }
const sameAttribution = (flights) => {
    if (!Array.isArray(flights) || flights.length === 0) return true;

    const firstAttr = flights[0].attribution;

    return flights.every(flight => flight.attribution === firstAttr);
};
export function transferToTaskdata(data) {
    try {
        const inputOriginData = data || [];
        console.log('inputOriginData', inputOriginData)
        if (!sameAttribution(inputOriginData)) {
            ElMessageBox.warning(
                '所选航班包含不同属性（定期 / 非定期），请只选择同一属性的航班进行申请。',
                '属性不一致'
            );
            return; //  终止执行
        }
        const result = [];
        inputOriginData.forEach(flight => {
            if (!Array.isArray(flight.matchingRoutes)) return;
            const allRoutesValid = flight.matchingRoutes.every(route => route.isValid === true);
            if (allRoutesValid) {
                // 如果所有航路都可以用，弹出提示
                ElMessage.warning(`航班 ${flight.flightNumber} 的所有航路均已有效，无需申请.`);
                return;
            }
            const allRoutesIsApply = flight.matchingRoutes.every(route => route.taskKeys.length > 0);
            if (allRoutesIsApply) {
                // 如果所有航路都可以用，弹出提示
                ElMessage.warning(`航班 ${flight.flightNumber} 的所有航路有正在申请的任务，请勿重复创建.`);
                return;
            }
            const unappliedRoutes = flight.matchingRoutes.filter(route =>
                route.isValid === false &&
                (!Array.isArray(route.taskKeys) || route.taskKeys.length === 0)
            );
            if (unappliedRoutes.length > 0) {
                result.push({
                    attribution: flight.attribution,
                    flightNumber: flight.flightNumber,
                    days: flight.days,
                    startDate: flight.startDate,
                    endDate: flight.endDate,

                    departure: flight.departure,
                    departureTime: flight.departureTime,
                    arrival: flight.arrival,
                    arrivalTime: flight.arrivalTime,
                    aircraftType: flight.aircraftType,
                    aircraftNumber: flight.aircraftNumber,
                    season: flight.season,
                    route: unappliedRoutes, //  这里包成数组
                });
            }
        });

        return result

    } catch (e) {
        console.error('数据初始化失败:', e)
    }
}

export const generateTaskAttribution = (taskList) => {
    return taskList[0]?.flightList[0]?.attribution.toUpperCase()
}
export const generateTaskSeason = (taskList) => {
    return taskList[0]?.flightList[0]?.season.toUpperCase()
}
export const generateDefaultTaskName = (taskList,curTaskAttrInput) => {
    const timestamp = dayjs().format('YYYYMMDDHHmm')
    console.log('taskLisk', taskList)
    const firstFlightNumber = taskList[0]?.flightList?.[0]?.flightNumber || '未知航班'
    const totalCountry = taskList.length
    const firstCountry = taskList[0]?.overflyCountry
    const attribution = curTaskAttrInput == 'SCHEDULED' ? '定期' : '非定期'
    const totalFlights = taskList.reduce((sum, item) => sum + item.flightList.length, 0)
    return `${timestamp}创建_${firstFlightNumber}等航班_${totalCountry}个国家的${attribution}飞越申请`
}
export const createTask = (data,selectedRoutes,selectedRouteIds) => {
    const showCreateTask = true;
    console.log('输入的data', data);
    selectedRouteIds.value = []
    const applyDataConfirm = data;
    // console.log('applyDataConfirm', applyDataConfirm);
    // console.log('selectedRoutes', selectedRoutes);

    const countryMap = new Map(); // key: countryName -> { flightList: [], routeList: [], overflyDetails: [] }

    try {
        for (const flight of applyDataConfirm) {
            const flightNumber = flight.flightNumber;
            const key = `${flight.flightNumber}-${flight.departure}-${flight.arrival}`
            const routeCodes = selectedRoutes[key] || [];
            if (routeCodes.length === 0) continue;

            // 根据 routeCode 过滤选中的航路
            const selectedRoutesData = flight.route.filter(r => routeCodes.includes(r.routeCode));
            console.log('selectedRoutesData', selectedRoutesData);

            // 遍历每个选中的航路
            for (const route of selectedRoutesData) {
                // 获取当前航路的过境国家
                selectedRouteIds.push(route.route_id)
                const countries = route.overflyCountry.filter(item => item.needPermit == true) || [];
                console.log('countries', countries);

                // 遍历该航路的所有过境国家
                for (const countryObj of countries) {
                    const country = countryObj.country;

                    // 如果国家不存在于 countryMap 中，则初始化数据
                    if (!countryMap.has(country)) {
                        countryMap.set(country, {
                            overflyCountry: country,
                            season: flight.season,
                            flightList: [],
                            overflyDetails: []  // 初始化为空数组
                        });
                    }

                    // 获取当前国家的数据
                    const countryData = countryMap.get(country);

                    // 直接将当前航路的所有 overflyDetails 数据添加到国家下
                    const routeOverflyDetails = countryObj.overflyDetails || [];

                    // 直接合并到 countryData 的 overflyDetails 数组中
                    countryData.overflyDetails.push(...routeOverflyDetails);

                    // 避免重复添加航班
                    const flightExists = countryData.flightList.some(f => f.flightNumber === flight.flightNumber);
                    if (!flightExists) {
                        countryData.flightList.push({
                            startDate: flight.startDate,
                            endDate: flight.endDate,
                            days: flight.days,

                            attribution: flight.attribution,
                            flightNumber: flight.flightNumber,
                            departure: flight.departure,
                            departureTime: flight.departureTime,
                            arrival: flight.arrival,
                            arrivalTime: flight.arrivalTime,
                            aircraftType: flight.aircraftType,
                            // aircraftNumber: flight.aircraftNumber,
                            season: flight.season,
                        });
                    }
                }
            }
        }
    } catch (error) {
        ElMessage.error('提交失败，请重试');
        console.error(error);
    }

    // 将 countryMap 中的数据转为数组，保存到 taskList 中
    const taskList = Array.from(countryMap.values());
    console.log('任务内容（按国家）taskList:', taskList);
    return { showCreateTask, taskList };
};