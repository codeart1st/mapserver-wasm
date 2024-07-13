import Dexie from 'dexie'

export const db = new Dexie('map')
db.version(1).stores({
  cache: '++id, name'
})