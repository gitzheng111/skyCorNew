import { ref } from 'vue'
import {
    addFlightsBatchs,
    updateFlightsBatchs,
    deleteFlights,
    deleteFlightsByIds,
    getFlights
} from '@/api'

export function useFlightCrud() {

    const loading = ref(false)

    const addFlight = async (data) => {

        loading.value = true

        try {

            await addFlightsBatchs(data)

            return await getFlights()

        } finally {

            loading.value = false
        }
    }

    const updateFlight = async (data) => {

        loading.value = true

        try {

            await updateFlightsBatchs(data)

            return await getFlights()

        } finally {

            loading.value = false
        }
    }

    const removeFlight = async (id) => {

        await deleteFlights(id)

        return await getFlights()
    }

    const removeFlights = async (ids) => {

        await deleteFlightsByIds(ids)

        return await getFlights()
    }

    return {
        loading,
        addFlight,
        updateFlight,
        removeFlight,
        removeFlights
    }
}