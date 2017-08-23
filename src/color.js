import R from 'ramda'
import * as d3 from './d3'

const spectralStops = [
  '#8000FF',
  '#0000FF',
  '#00FFFF',
  '#00FF00',
  '#FFFF00',
  '#FF8000',
  '#FF0000',
  '#800000'
]

const toRGBABytes = R.pipe(d3.color, function ({ r, g, b, opacity }) {
  return Uint8Array.of(r, g, b, opacity * 255)
})

function createPalette (colorCount, colorStops) {
  const ratio = (colorCount - 1) / (colorStops.length - 1)
  const domain = d3.range(colorStops.length).map(R.multiply(ratio))
  const getColor = d3.scaleLinear().domain(domain).range(colorStops)
  return d3.range(colorCount).map(getColor)
}

function createSpectralPalette (colorCount) {
  return createPalette(colorCount, spectralStops)
}

export {
  createPalette,
  createSpectralPalette,
  toRGBABytes
}

// export function createLogColors (count, range) {
//   const domain = d3.range(range.length).map(R.divide(R.__, range.length - 1))
//   const linScale = d3.scaleLinear().domain(domain).range(range)
//   const logScale = d3.scaleLog().domain([1, count])
//   return d3.range(count).map(R.pipe(R.inc, logScale, linScale, toRGBABytes))
// }
