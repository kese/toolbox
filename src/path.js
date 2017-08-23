import R from 'ramda'
import { posix as P } from 'path'

function pathToArray (relPath) { // path must be resolved!
  const path = P.resolve(P.sep, relPath).slice(1)
  return path ? path.split(P.sep) : []
}

function pathToLens (path) {
  const lenses = pathToArray(path).map(key => {
    return key.startsWith('#')
      ? R.lensIndex(parseInt(key.slice(1)))
      : R.lensProp(key)
  })
  return lenses.length === 0 ? R.identity : R.compose(...lenses)
}

export { pathToArray, pathToLens }

export default P
