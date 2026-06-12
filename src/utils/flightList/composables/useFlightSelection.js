export function useFlightSelection() {

    const selectAll = ref(false)

    const selectedFlights = ref([])

    const selectedRoutes = ref({})

    const getFlightKey = flight =>

        `${flight.flightNumber}-${flight.departure}-${flight.arrival}`

    const handleSelectAll = ()=>{}

    const handleFlightSelect = ()=>{}

    const handleRouteSelect = ()=>{}

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