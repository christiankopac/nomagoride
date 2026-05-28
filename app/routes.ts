import { get, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  schedule: get('/schedule'),
  trip: get('/trip/:tripId'),
  apiStations: get('/api/stations'),
})
