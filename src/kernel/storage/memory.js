import os from 'os'
import R from 'ramda'
import createCache from 'lru-cache'

// use at most 2 GBytes, but not more then 75% of free memory
const max = Math.min(0.75 * os.freemem(), Math.pow(2, 31))
const cache = createCache({ length: R.prop('length'), max })

const actions = {
  clear (ctx) {
    cache.reset()
  },

  read (ctx, key) {
    return cache.get(key)
  },

  write (ctx, key, buffer) {
    cache.set(key, buffer)
  }
}

export default { actions }
