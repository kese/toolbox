const noop = () => {}

function prepareOpts (opts) {
  const props = typeof opts === 'function' ? { execute: opts } : opts
  return {
    ...props,
    execute: props.execute || noop,
    finalize: props.finalize || noop,
    rollback: props.rollback || noop
  }
}

async function complete (ctx, failed, error, value, opts) {
  await (failed ? opts.rollback(value) : opts.finalize(value))
  await ctx.commit('leave')
}

async function terminate (ctx, trax, root, opts) {
  if (trax.status === 'failed') {
    await ctx.set('/', { ...root, trax })
  } else await ctx.commit('reset', opts.finalMessage)
}

async function run (ctx, opts) {
  let value, error
  const root = await ctx.get('/')
  const trax = await ctx.commit('enter', opts.startMessage)
  if (trax.status === 'failed') throw new Error('Transaction failed')
  if (trax.locked) throw new Error('Transaction already locked')
  if (trax.total > 1 && opts.start) {
    await ctx.commit('leave')
    throw new Error('Transaction already started')
  }

  const trax$ = ctx.listen('.').skipRepeats().multicast()

  if (root.trax.status === 'idle') { // only first join/start
    trax$.filter(trax => !trax.locked && trax.pending === 0).take(1)
      .tap(() => ctx.commit('lock')).drain()

    trax$.filter(trax => trax.locked && trax.pending === 0).take(1)
      .tap(trax => terminate(ctx, trax, root, opts)).drain()
  }

  trax$.filter(trax => trax.locked && trax.total === trax.pending)
    .map(trax => trax.status === 'failed').take(1)
    .tap(failed => complete(ctx, failed, error, value, opts)).drain()

  try {
    value = await opts.execute()
    setTimeout(() => ctx.commit('leave'))
    return value
  } catch (err) {
    error = err
    setTimeout(() => ctx.commit('abort', opts.errorMessage))
    throw error
  }
}

const actions = {
  start (ctx, args) {
    const opts = { ...prepareOpts(args), start: true }
    return run(ctx, opts)
  },

  join (ctx, args) {
    const opts = prepareOpts(args)
    return run(ctx, opts)
  },

  wait ({ get, invoke }, count) {
    return new Promise(resolve => {
      setTimeout(async function () {
        const pending = await get('pending')
        resolve(pending > count && invoke('wait', count))
      })
    })
  }
}

const mutators = {
  enter (state, startMessage = '') {
    const { status } = state
    if (state.locked || status === 'failed') return state
    const total = state.total + 1
    const pending = state.pending + 1
    const message = (status === 'idle' ? '' : state.message) || startMessage
    return { ...state, total, pending, message, status: 'running' }
  },

  abort (state, errorMessage = '') {
    const pending = state.pending - 1
    const message = state.status === 'failed' ? state.message : errorMessage
    return { ...state, pending, message, status: 'failed' }
  },

  leave (state) {
    const pending = state.pending - 1
    return { ...state, pending }
  },

  lock (state) {
    return { ...state, locked: true, pending: state.total }
  },

  reset (state, message = '') {
    return { total: 0, pending: 0, message, status: 'idle', locked: false }
  }
}

export default { actions, init: mutators.reset, mutators }
