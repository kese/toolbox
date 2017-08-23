import os from 'os'
import R from 'ramda'
import createDebug from 'debug'
import createCache from 'lru-cache'

const debug = createDebug('app:kernel:storage:memory')
// use at most 2 GBytes, but not more then 75% of free memory
const max = Math.min(0.75 * os.freemem(), Math.pow(2, 31))

const cache = createCache({ length: R.prop('length'), max })

debug('INIT', max / Math.pow(2, 30), 'GB')

const actions = {
  clear (ctx) {
    cache.reset()
    debug('CLEAR')
  },

  read (ctx, key) {
    const buffer = cache.get(key)
    debug('READ', { key, buffer })
    return buffer
  },

  write (ctx, key, buffer) {
    cache.set(key, buffer)
    debug('WRITE', { key, buffer })
  }
}

export default { actions }
