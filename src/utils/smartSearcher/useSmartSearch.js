// utils/smartSearcher.vue/useSmartSearch.js

export function useSmartSearch() {

    const weight = {
        flightNumber: 100,
        airports: 90,
        routes: 80,
        countries: 70,
        aircraft: 60,
        season: 50
    }

    function calculateScore(
        item,
        keyword
    ) {

        let score = 0

        if (
            item.flightNumber.includes(keyword)
        ) {
            score += weight.flightNumber
        }

        if (
            item.airports.includes(keyword)
        ) {
            score += weight.airports
        }

        if (
            item.routes.includes(keyword)
        ) {
            score += weight.routes
        }

        if (
            item.countries.includes(keyword)
        ) {
            score += weight.countries
        }

        if (
            item.aircraft.includes(keyword)
        ) {
            score += weight.aircraft
        }

        if (
            item.season.includes(keyword)
        ) {
            score += weight.season
        }

        return score
    }

    function search(
        indexedList,
        keyword
    ) {

        if (!keyword?.trim()) {
            return indexedList.map(
                i => i.raw
            )
        }

        const raw =
            keyword.toUpperCase()

        const isOr =
            raw.includes(',')

        const tokens =
            raw
                .replace(/,/g, ' ')
                .split(/\s+/)
                .filter(Boolean)

        return indexedList
            .map(index => {

                let score = 0

                const matched = isOr
                    ? tokens.some(token => {
                        const s =
                            calculateScore(
                                index,
                                token
                            )

                        score += s

                        return s > 0
                    })
                    : tokens.every(token => {
                        const s =
                            calculateScore(
                                index,
                                token
                            )

                        score += s

                        return s > 0
                    })

                if (!matched) {
                    return null
                }

                return {
                    score,
                    item: index.raw
                }

            })
            .filter(Boolean)
            .sort(
                (a, b) =>
                    b.score - a.score
            )
            .map(
                i => i.item
            )
    }

    return {
        search
    }
}