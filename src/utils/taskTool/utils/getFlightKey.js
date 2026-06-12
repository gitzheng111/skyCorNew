export const getFlightKey = (flight) =>
    `${flight.flightNumber}-${flight.departure}-${flight.arrival}`