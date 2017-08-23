import R from 'ramda'
import * as most from 'most'

export const flush = $ => $.chain(most.never)

export const fromEvent = R.curryN(2, most.fromEvent)

export const delta = $ => $.skipRepeats().filter(R.complement(R.isNil))

export const combine = (...streams) => $ => $.combine(Array.of, ...streams)

export function pairwise (zipFn = Array.of) {
  return function ($) {
    const mc$ = $.multicast()
    return mc$.zip(zipFn, mc$.skip(1))
  }
}

export function awaitSafely (promise) {
  return most.fromPromise(promise)
    .recoverWith(function (error) {
      console.error(error)
      return most.never()
    })
}
