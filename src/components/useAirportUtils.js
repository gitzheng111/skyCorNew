// component/useAirportUtils.js
import { ref } from 'vue'

export function useAirportSearch(airportCodeDataRef) {
  const createFilter = (queryString) => {
    return (airport) => {
      const query = queryString.toLowerCase()
      return (
        airport.IATACode?.toLowerCase().includes(query) ||
        airport.ICAOCode?.toLowerCase().includes(query) ||
        airport.chineseName?.includes(queryString) ||
        airport.englishName?.toLowerCase().includes(query)
      )
    }
  }

  const airportSearch = (queryString, cb) => {
    const results = queryString
      ? airportCodeDataRef.value.filter(createFilter(queryString))
      : airportCodeDataRef.value
    cb(results)
  }

  return {
    airportSearch
  }
}
