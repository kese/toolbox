import R from 'ramda'
import { posix as P } from 'path'
import { create } from '@most/create'

const defer = fn => val => setTimeout(() => fn(val))

// TODO: better solve possible interference between init-fns of modules
// and their non-namespaced submodules (hard to track errors)

function pathToArray (path) {
  const sliced = path.slice(1)
  return sliced.length ? sliced.split(P.sep) : []
}

function pathToLens (path) {
  const lenses = pathToArray(path).map(key => {
    return key.startsWith('#')
      ? R.lensIndex(parseInt(key.slice(1)))
      : R.lensProp(key)
  })
  return lenses.length === 0 ? R.identity : R.compose(...lenses)
}

function initModule (path, config, kernel) {
  const context = R.map(fn => fn(path), kernel.methods)
  const { actions, initial, mutators } = kernel
  const { init = R.always({}), boot } = config
  Object.assign(initial, R.over(pathToLens(path), init, initial))
  if (boot) kernel.bootseq.push(() => boot(context))

  R.forEachObjIndexed(function (fn, fnKey) {
    const fnPath = P.resolve(path, fnKey)
    if (actions[fnPath]) throw new Error(`Action «${fnPath}» exists`)
    actions[fnPath] = (...args) => fn(context, ...args)
  }, { ...config.actions })

  R.forEachObjIndexed(function (fn, fnKey) {
    const fnPath = P.resolve(path, fnKey)
    if (mutators[fnPath]) throw new Error(`Mutator «${fnPath}» exists`)
    mutators[fnPath] = fn.bind(config.mutators)
  }, { ...config.mutators })

  R.forEachObjIndexed((moduleConfig, moduleKey) => {
    const { namespaced = true } = moduleConfig
    const modulePath = namespaced ? P.resolve(path, moduleKey) : path
    initModule(modulePath, moduleConfig, kernel)
  }, { ...config.modules })

  return context
}

async function initKernel (config) {
  let push
  const actions = {}
  const bootseq = []
  const initial = {}
  const mutators = {}

  const add = basePath => function (relPath, props) {
    const path = P.resolve(basePath, relPath)
    const lens = pathToLens(path)
    const merge = focus => ({ ...focus, ...props })
    const doAdd = R.over(lens, merge)
    return new Promise(resolve => {
      const doResolve = R.pipe(R.view(lens), resolve)
      push(R.pipe(doAdd, R.tap(doResolve)))
    })
  }

  const get = basePath => function (relPath) {
    const path = P.resolve(basePath, relPath)
    const doGet = R.view(pathToLens(path))
    return new Promise(resolve => {
      push(R.tap(R.pipe(doGet, resolve)))
    })
  }

  const set = basePath => function (relPath, value) {
    const path = P.resolve(basePath, relPath)
    const lens = pathToLens(path)
    const doSet = R.set(lens, value)
    return new Promise(resolve => {
      const doResolve = R.pipe(R.view(lens), resolve)
      push(R.pipe(doSet, R.tap(doResolve)))
    })
  }

  const del = basePath => function (relPath) {
    const path = P.resolve(basePath, relPath)
    const lens = pathToLens(P.dirname(path))
    const doDel = R.over(lens, R.dissoc(P.basename(path)))
    return new Promise(resolve => {
      const doResolve = R.pipe(R.view(lens), resolve)
      push(R.pipe(doDel, R.tap(doResolve)))
    })
  }

  const cd = basePath => function (relPath) {
    const path = P.resolve(basePath, relPath)
    return R.map(fn => fn(path), kernel.methods)
  }

  const commit = basePath => function (relPath, ...args) {
    const path = P.resolve(basePath, relPath)
    const mutator = mutators[path]
    if (!mutator) throw new Error(`Unknown mutator: ${path}`)
    const lens = pathToLens(P.dirname(path))
    const doMutate = R.over(lens, focus => mutator(focus, ...args))
    const doView = R.view(lens)
    return new Promise(resolve => {
      const doResolve = R.tap(R.pipe(doView, resolve))
      push(R.pipe(doMutate, doResolve))
    })
  }

  const invoke = basePath => function (relPath, ...args) {
    const path = P.resolve(basePath, relPath)
    if (!actions[path]) throw new Error(`Unknown action ${path}`)
    return actions[path](...args)
  }

  const listen = basePath => function (relPath) {
    const path = P.resolve(basePath, relPath)
    const view = R.view(pathToLens(path))
    return state$.map(R.tryCatch(view, () => {})).multicast()
  }

  const methods = { add, commit, cd, del, get, invoke, listen, set }
  const kernel = { actions, bootseq, initial, methods, mutators }
  const context = initModule('/', config, kernel)

  const logError = error => console.error(error)
  const onError = R.either(logError, R.nthArg(1))
  const state$ = create(add => (push = defer(add)))
    .scan(R.tryCatch(R.flip(R.call), onError), initial).multicast()

  await Promise.all(bootseq.map(boot => boot()))

  return context
}

export default initKernel
