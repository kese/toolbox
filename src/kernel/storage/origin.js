import createDebug from 'debug'

const debug = createDebug('app:kernel:storage:origin')

const tiers = 'cache|zipFile'

const actions = {
  clear (ctx) {
    return ctx.invoke('../clear', `@${tiers}`)
  },

  async read (ctx, key) {
    const buf = await ctx.invoke('../read', `${key}@${tiers}`)
    debug('READ', { key, buf })
    return buf
  },

  async write (ctx, key, buf) {
    const result = await ctx.invoke('../write', `${key}@${tiers}`, buf)
    debug('WRITE', { key, buf })
    return result
  }
}

export default { actions }
