import { remote } from 'electron'

const win = remote.getCurrentWindow()

const showOpenDialog = options => new Promise(resolve => {
  return remote.dialog.showOpenDialog(win, options, resolve)
})

const showSaveDialog = options => new Promise(resolve => {
  return remote.dialog.showSaveDialog(win, options, resolve)
})

async function letUserOpenFile (options) {
  try {
    const [fileName] = await showOpenDialog(options)
    return fileName
  } catch (error) {} // swallow null errors
}

async function letUserSaveFile (options) {
  try {
    const fileName = await showSaveDialog(options)
    return fileName
  } catch (error) {} // swallow null errors
}

export { letUserOpenFile, letUserSaveFile, showOpenDialog, showSaveDialog }
