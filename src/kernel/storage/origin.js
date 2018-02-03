const tiers = 'cache|zipFile'

const actions = {
  clear (ctx) {
    return ctx.invoke('../clear', `@${tiers}`)
  },

  read (ctx, key) {
    return ctx.invoke('../read', `${key}@${tiers}`)
  },

  write (ctx, key, buf) {
    return ctx.invoke('../write', `${key}@${tiers}`, buf)
  }
}

export default { actions }
