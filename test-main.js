const electron = require('electron')
console.log('electron type:', typeof electron)
console.log('electron keys:', Object.keys(electron).slice(0, 10))
console.log('app:', typeof electron.app)
if (electron.app) {
  console.log('isPackaged:', electron.app.isPackaged)
  electron.app.on('ready', () => {
    console.log('app ready, isPackaged:', electron.app.isPackaged)
    electron.app.quit()
  })
}
