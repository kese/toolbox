import R from 'ramda'
import * as d3 from './d3'

localStorage.debug = localStorage.xdebug ||
  process.env.DEBUG ||
  localStorage.debug

const stops = [
  '#0000FF',
  '#DC143C',
  '#D2691E',
  '#006400',
  '#A52A2A',
  '#4B0082'
]

const stopCount = stops.length
const colCount = 256
const linScale = d3.scaleLinear().domain([1, colCount])
const colDomain = d3.range(stopCount).map(R.divide(R.__, stopCount - 1))
const colScale = d3.scaleLinear().domain(colDomain).range(stops)

require('debug').colors = d3.range(colCount)
  .map(R.pipe(R.inc, linScale, colScale))
