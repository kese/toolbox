import { remote } from 'electron'

const win = remote.getCurrentWindow()

const showOpenDialog = options => remote.dialog.showOpenDialog(win, options)

const showSaveDialog = options => remote.dialog.showSaveDialog(win, options)

async function letUserOpenFile (options) {
  try {
    const { filePaths: [fileName] } = await showOpenDialog(options)
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
