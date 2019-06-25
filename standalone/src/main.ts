import { app, BrowserWindow } from 'electron';

let mainWindow: Electron.BrowserWindow | undefined;

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    backgroundColor: '#2e2c29',
    height: 250,
    title: 'WPILib Utility',
    width: 350,
  });

  await mainWindow.loadFile('index.html');

  mainWindow.setMenu(null);

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
