export function pcb (resolve, reject) {
  return (error, result) => error ? reject(error) : resolve(result)
}

export function cps (fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, pcb(resolve, reject))
  })
}

function pAll (...promises) {
  return Promise.all(promises)
}

async function pAllObj (obj, inplace = false) {
  const promises = Object.keys(obj).map(async function (key) {
    return pAll(key, await obj[key])
  })
  return (await pAll(...promises))
    .reduce(function (result, [key, prop]) {
      return Object.assign(result, { [key]: prop })
    }, inplace ? obj : {})
}

export { pAll, pAllObj }
