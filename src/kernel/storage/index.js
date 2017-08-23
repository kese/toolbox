import cache from './cache'
import memory from './memory'
import origin from './origin'
import persistent from './persistent'
import zipFile from './zip-file'

async function doClear (ctx, [tier, ...upper]) {
  if (!tier) return
  return Promise.all([
    ctx.invoke(`${tier}/clear`),
    doClear(ctx, upper)
  ])
}

async function doRead (ctx, [tier, ...lower], key, upper = []) {
  const buf = await ctx.invoke(`${tier}/read`, key)
  if (typeof buf !== 'undefined') {
    await doWrite(ctx, upper, key, buf)
    return buf.buffer ? buf : Buffer.from(buf)
  }
  if (!lower.length) return
  return doRead(ctx, lower, key, [tier].concat(upper))
}

async function doWrite (ctx, [tier, ...upper], key, buffer) {
  if (!tier) return
  return Promise.all([
    ctx.invoke(`${tier}/write`, key, buffer),
    doWrite(ctx, upper, key, buffer)
  ])
}

async function doCall (fn, ctx, rawKey = '', ...args) {
  const [key, tiers] = rawKey.split('@')
  const id = await ctx.get('id')
  const prefixedKey = key.indexOf(id) === 0 ? key : `${id}:${key}`
  return fn(ctx, tiers.split('|'), prefixedKey, ...args)
}

const actions = {
  async clear (...args) {
    return doCall(doClear, ...args)
  },

  async read (...args) {
    return doCall(doRead, ...args)
  },

  async write (...args) {
    return doCall(doWrite, ...args)
  }
}

const modules = { cache, memory, origin, persistent, zipFile }

export default { actions, modules }
