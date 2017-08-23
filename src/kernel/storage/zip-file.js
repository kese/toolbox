import R from 'ramda'
import yauzl from 'yauzl'
import { fromEvent } from 'most'
import createDebug from 'debug'
import { pcb } from '../../promise'

const debug = createDebug('app:kernel:storage:zipFile')

const openOptions = { lazyEntries: true, autoClose: false }

const openHandle = fileName => new Promise((resolve, reject) => {
  yauzl.open(fileName, openOptions, pcb(resolve, reject))
})

const openReadStream = (handle, entry) => new Promise((resolve, reject) => {
  handle.openReadStream(entry, pcb(resolve, reject))
})

const isPending = handle => new Promise((resolve, reject) => {
  handle.reader.pend.wait(pcb(resolve, reject))
})

async function readEntry (handle, entry) {
  const stream = await openReadStream(handle, entry)
  const chunks = await fromEvent('data', stream)
    .until(fromEvent('end', stream))
    .map(Array.of).reduce(R.concat, [])
  return Buffer.concat(chunks)
}

async function readPath (ctx, path) {
  const { entries, entryCount, handle } = await ctx.get('.')
  const entry = R.path(path, entries)
  if (entry) return readEntry(handle, entry)
  if (handle.entryCount === entryCount) return
  if (!handle.reader.pend.pending) handle.readEntry()
  await isPending(handle)
  return readPath(ctx, path)
}

const actions = {
  clear: () => {},

  async read (ctx, key) {
    const path = key.split(':').pop().split('/')
    debug('READ', path)
    const buf = await readPath(ctx, path)
    debug(buf ? 'HIT' : 'MISS', key)
    return buf
  },

  async open (ctx, fileName) {
    debug('OPEN', fileName)
    let current, update
    await ctx.invoke('/trax/join', {
      errorMessage: 'openingZipFileFailed',
      async execute () {
        current = await ctx.get('.')
        const handle = await openHandle(fileName)
        handle.on('entry', entry => ctx.commit('addEntry', entry))
        update = { entries: {}, entryCount: 0, fileName, handle }
        await ctx.set('.', update)
      },
      finalize () {
        if (current.handle) current.handle.close()
      },
      rollback () {
        if (update) update.handle.close()
      }
    })
  },

  write: (ctx, val) => val
}

const mutators = {
  addEntry (state, entry) {
    debug('ENTRY', entry)
    const entryCount = state.entryCount + 1
    if (entry.fileName.slice(-1) === '/') return { ...state, entryCount }
    const entryPath = entry.fileName.split('/')
    const entries = R.assocPath(entryPath, entry, state.entries)
    return { ...state, entryCount, entries }
  }
}

export default { actions, mutators }
