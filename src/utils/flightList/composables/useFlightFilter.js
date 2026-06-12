import { computed } from 'vue'

export function useFlightFilter(flights){

    const scheduleList = computed(() =>

        flights.value.filter(
            f=>f.attribution?.toUpperCase()==='SCHEDULED'
        )

    )

    const nonScheduleList = computed(()=>

        flights.value.filter(
            f=>f.attribution?.toUpperCase()==='NONSCHEDULE'
        )

    )

    const applyRequired = computed(()=>{

        const result = []

        flights.value.forEach(flight=>{

            const routes =
                flight.matchingRoutes?.filter(route=>

                    !route.isValid &&
                    (!route.taskKeys?.length)

                )

            if(routes?.length){

                result.push({
                    ...flight,
                    route: routes
                })
            }

        })

        return result

    })

    return {
        scheduleList,
        nonScheduleList,
        applyRequired
    }
}