import R from 'ramda'
import { fromEvent } from 'most'
import { EventEmitter } from 'events'
import { init, h as hs } from 'snabbdom'
import props from 'snabbdom/modules/props'
import style from 'snabbdom/modules/style'
import clazz from 'snabbdom/modules/class'
import data from 'snabbdom/modules/dataset'
import attrs from 'snabbdom/modules/attributes'
import events from 'snabbdom/modules/eventlisteners'
import hammer from './hammer'

const patch = init([attrs, clazz, data, events, hammer, props, style])

document.addEventListener('dragover', ev => ev.preventDefault())
document.addEventListener('drop', ev => ev.preventDefault())

const keys = [
  'div', 'span', 'input', 'button', 'img', 'option', 'select',
  'ul', 'li', 'section', 'header', 'footer', 'br',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'sup', 'sub',
  'audio', 'video', 'a', 'b', 'em', 'i', 'label',
  'canvas', 'svg', 'path', 'g', 'rect', 'circle'
]

const hk = key => function (sel, ...args) {
  args.unshift(...R.is(String, sel) ? [key + sel] : [key, sel])
  return hs(...args)
}

const h = keys.reduce((fn, key) => (fn[key] = hk(key)) && fn, hs)

function render (ctx, view, elm) {
  const $ = view(ctx).multicast()
  $.startWith(elm).zip(patch, $).drain()
}

function watch ({ types, hammer }) {
  const handlers = {}
  const streams = {}
  const emitter = new EventEmitter()
  types.forEach(function (type) {
    handlers[type] = payload => emitter.emit(type, payload)
    streams[`${type}$`] = fromEvent(type, emitter)
  })
  const nodeData = { hammer, on: handlers }
  return { nodeData, streams }
}

export { h, render, watch }
