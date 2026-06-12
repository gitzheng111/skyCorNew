import { ref } from 'vue'

export function useTaskBuilder() {

    const taskNeedData = ref([])

    const sameAttribution = (flights) => {

        if (!flights?.length) return true

        const first =
            flights[0].attribution

        return flights.every(
            f => f.attribution === first
        )
    }

    const buildTaskData = (flights) => {

        const result = []

        flights.forEach(flight => {

            if (
                !Array.isArray(
                    flight.matchingRoutes
                )
            ) return

            const unappliedRoutes =
                flight.matchingRoutes.filter(
                    route =>
                        route.isValid === false &&
                        (
                            !route.taskKeys ||
                            route.taskKeys.length === 0
                        )
                )

            if (
                unappliedRoutes.length
            ) {

                result.push({

                    attribution:
                        flight.attribution,

                    flightNumber:
                        flight.flightNumber,

                    days:
                        flight.days,

                    startDate:
                        flight.startDate,

                    endDate:
                        flight.endDate,

                    departure:
                        flight.departure,

                    departureTime:
                        flight.departureTime,

                    arrival:
                        flight.arrival,

                    arrivalTime:
                        flight.arrivalTime,

                    aircraftType:
                        flight.aircraftType,

                    aircraftNumber:
                        flight.aircraftNumber,

                    season:
                        flight.season,

                    route:
                        unappliedRoutes
                })
            }

        })

        taskNeedData.value = result

        return result
    }

    return {

        taskNeedData,

        sameAttribution,

        buildTaskData
    }
}