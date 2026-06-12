import { ref } from 'vue'

export function useTaskSelection() {

    const selectAll = ref(false)

    const selectedFlights = ref([])

    const selectedRoutes = ref({})

    const getFlightKey = (flight) =>
        `${flight.flightNumber}-${flight.departure}-${flight.arrival}`

    const handleSelectAll = (checked, taskNeedData) => {

        if (checked) {

            selectedFlights.value =
                taskNeedData.map(f => getFlightKey(f))

            taskNeedData.forEach(flight => {

                const key = getFlightKey(flight)

                selectedRoutes.value[key] =
                    flight.route
                        .filter(r => !r.isValid)
                        .map(r => r.routeCode)

            })

        } else {

            selectedFlights.value = []

            taskNeedData.forEach(flight => {

                const key = getFlightKey(flight)

                selectedRoutes.value[key] = []

            })
        }
    }

    const handleFlightSelect = (
        flight,
        checked,
        taskNeedData
    ) => {

        const key = getFlightKey(flight)

        if (checked) {

            if (!selectedFlights.value.includes(key)) {

                selectedFlights.value.push(key)

            }

            selectedRoutes.value[key] =
                flight.route
                    .filter(r => !r.isValid)
                    .map(r => r.routeCode)

        } else {

            selectedFlights.value =
                selectedFlights.value.filter(
                    f => f !== key
                )

            selectedRoutes.value[key] = []

        }

        updateSelectAllStatus(taskNeedData)
    }

    const handleRouteSelect = (
        flight,
        routes,
        taskNeedData
    ) => {

        const key = getFlightKey(flight)

        selectedRoutes.value[key] = routes

        const totalInvalid =
            flight.route.filter(
                r => !r.isValid
            ).length

        if (routes.length === totalInvalid) {

            if (!selectedFlights.value.includes(key)) {

                selectedFlights.value.push(key)

            }

        } else {

            selectedFlights.value =
                selectedFlights.value.filter(
                    f => f !== key
                )

        }

        updateSelectAllStatus(taskNeedData)
    }

    const updateSelectAllStatus = (
        taskNeedData
    ) => {

        selectAll.value =
            taskNeedData.length > 0 &&
            taskNeedData.every(f =>
                selectedFlights.value.includes(
                    getFlightKey(f)
                )
            )
    }

    return {

        selectAll,

        selectedFlights,

        selectedRoutes,

        getFlightKey,

        handleSelectAll,

        handleFlightSelect,

        handleRouteSelect
    }
}