import * as d3 from './d3'

const { round } = Math

const spectralStops = [
  '#8000FF',
  '#0000FF',
  '#00FFFF',
  '#00FF00',
  '#FFFF00',
  '#FF8000',
  '#FF0000',
  '#800000'
].map(d3.color)

function d3ToUintRGBA ({ r, g, b, opacity }) {
  const bytes = [round(r), round(g), round(b), round(opacity * 255)]
  return (new Uint32Array(Uint8Array.of(...bytes).buffer))[0]
}

function uintARGBToD3 (intVal) {
  const opacity = ((intVal & 0xff000000) >>> 24) / 255
  const red = (intVal & 0xff0000) >> 16
  const green = (intVal & 0x00ff00) >> 8
  const blue = intVal & 0x0000ff
  return d3.rgb(red, green, blue, opacity)
}

export {
  spectralStops,
  uintARGBToD3,
  d3ToUintRGBA
}
