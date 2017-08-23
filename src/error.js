export function wrapError (err, msg) {
  return Object.assign(new Error(msg), { err })
}

export default function (err, msg) {
  throw wrapError(err, msg)
}

export const logError = console.error.bind(console)
