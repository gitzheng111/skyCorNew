// utils/smartSearcher.vue/useSearchIndex.js

import { computed } from 'vue'

export function useSearchIndex(list) {

    return computed(() =>
        list.value.map(item => {

            const flightNumber =
                item.flightNumber?.toUpperCase() || ''

            const airports =
                `${item.departure || ''}|${item.arrival || ''}`
                    .toUpperCase()

            const aircraft =
                Array.isArray(item.aircraftType)
                    ? item.aircraftType
                        .join('|')
                        .toUpperCase()
                    : (item.aircraftType || '')
                        .toUpperCase()

            const season =
                item.season?.toUpperCase() || ''

            const routes =
                item.matchingRoutes
                    ?.map(r => r.routeCode)
                    .join('|')
                    .toUpperCase() || ''

            const countries =
                item.matchingRoutes
                    ?.flatMap(
                        r => r.overflyCountry || []
                    )
                    .map(
                        c => c.country || ''
                    )
                    .join('|')
                    .toUpperCase() || ''

            const allText = [
                flightNumber,
                airports,
                aircraft,
                season,
                routes,
                countries
            ].join('|')

            return {
                raw: item,
                flightNumber,
                airports,
                aircraft,
                season,
                routes,
                countries,
                allText
            }
        })
    )
}