import Hammer from 'hammerjs'

const defaults = { domEvents: true }

function setup ({ data, elm }) {
  const { hammer } = data
  hammer.manager = new Hammer.Manager(elm, { ...defaults, ...hammer })
}

function create (empty, node) {
  if (node.data.hammer) setup(node)
}

function update (prev, next) {
  if (next.data.hammer) {
    setup(next)
    destroy(prev) // dom events need to be unbound!!
  } else if (prev.data.hammer) {
    next.data.hammer = prev.data.hammer
  }
}

function destroy ({ data }) {
  if (data.hammer) data.hammer.manager.destroy()
}

export default { create, update, destroy }
