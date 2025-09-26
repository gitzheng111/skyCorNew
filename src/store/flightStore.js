// stores/flightStore.js
import { defineStore } from 'pinia'

export const useFlightStore = defineStore('flight', {
  state: () => ({
    flights: [],
    changeLogs: [] // 变更日志
  }),
  actions: {
    updateFlight(updated) {
      const idx = this.flights.findIndex(f => f.flight_id === updated.flight_id)
      if (idx !== -1) {
        const oldData = { ...this.flights[idx] }
        this.flights[idx] = updated

        this.changeLogs.push({
          flightNumber: updated.flightNumber,
          flightId: updated.flight_id,
          timestamp: new Date().toISOString(),
          before: oldData,
          after: updated
        })
      }
    }
  }
})
