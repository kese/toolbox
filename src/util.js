import R from 'ramda'
import camelcase from 'camelcase'
import crypto from 'crypto'

export function sha (arg, len = 32) {
  return crypto.createHash(len > 64 ? 'sha512' : 'sha256')
    .update(arg).digest('hex').slice(0, len)
}

export const bufToStr = buf => Buffer.from(buf).toString()
export const bufToObj = buf => JSON.parse(bufToStr(buf))
export const objToBuf = obj => Buffer.from(JSON.stringify(obj))

export const toDataView = ({ buffer, byteOffset, byteLength }) =>
  new DataView(buffer, byteOffset, byteLength)

const toTypedArray = Type => ({ buffer, byteOffset: off, byteLength: len }) =>
  new Type(buffer, off, len / Type.BYTES_PER_ELEMENT)

export const toFloat32Array = toTypedArray(Float32Array)
export const toUint32Array = toTypedArray(Uint32Array)
export const toUint8Array = toTypedArray(Uint8Array)
export const toUint8ClampedArray = toTypedArray(Uint8ClampedArray)

export function bufferFromTypedArrays (...typedArrays) {
  const data = typedArrays.map(toUint8Array)
  const length = data.map(R.prop('length')).reduce(R.add, 0)
  const [view] = data.reduce(function ([result, offset], values) {
    return result.set(values, offset) || [result, offset + values.length]
  }, [new Uint8Array(length), 0])
  return Buffer.from(view.buffer)
}

export const eqStrings = (a, b) => a.indexOf(b) === b.indexOf(a) === 0

export function toCamelCase (value, ucfirst = false) {
  const lccValue = camelcase(value)
  if (!ucfirst) return lccValue
  return lccValue.charAt(0).toUpperCase() + lccValue.slice(1)
}

export function localizeTime (lang, time) {
  return time.toLocaleString(lang, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  })
}

export const applyMapped = R.curryN(2, function (fn, items, ...args) {
  return R.map(item => fn(item, ...args), items)
})
