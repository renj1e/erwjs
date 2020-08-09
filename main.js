'use strict'

// Import parts of electron to use
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const { exec, spawn } = require('child_process')

// const socketIOClient = require('socket.io-client')
// const ENDPOINT = 'http://127.0.0.1:4001';

// const socket = socketIOClient(ENDPOINT);

Menu.setApplicationMenu(false)
// Allocating os module 
const os = require('os');
var username = os.userInfo(options).username // admin

// socket.emit('FromAPI', os.userInfo(options).username);

// Printing os.userInfo() values 
try { 
  
    // Printing user information 
    var options = { 
        // encoding: 'buffer'
    }; 
  
    // Printing user information 
    console.log(os.userInfo(options), os.networkInterfaces().Ethernet[0].mac); 
    // console.log('os.EOL', os.EOL)
    // console.log('os.arch', os.arch())
    // console.log('os.constants', os.constants)
    // console.log('os.cpus', os.cpus())
    // console.log('os.endianness', os.endianness())
    // console.log('os.freemem', os.freemem())
    // console.log('os.homedir', os.homedir())
    // console.log('os.hostname', os.hostname())
    // console.log('os.loadavg', os.loadavg())
    // console.log('os.networkInterfaces', os.networkInterfaces())
    // console.log('os.platform', os.platform())
    // console.log('os.release', os.release())
    // console.log('os.tmpdir', os.tmpdir())
    // console.log('os.totalmem', os.totalmem())
    // console.log('os.type', os.type())
    // console.log('os.uptime', os.uptime())
    // console.log('os.version', os.version())
} catch (err) { 
    
    // Printing if any exception occurs 
    console.log(": error occured" + err); 
} 

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

// Keep a reference for dev mode
let dev = false

// Broken:
// if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
//   dev = true
// }

if (process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'development') {
  dev = true
}

// Temporary fix broken high-dpi scale factor on Windows (125% scaling)
// info: https://github.com/electron/electron/issues/9691
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', 'true')
  app.commandLine.appendSwitch('force-device-scale-factor', '1')
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/preload.js',
      webSecurity: true
    }
  })

  // and load the index.html of the app.
  let indexPath

  if (dev && process.argv.indexOf('--noDevServer') === -1) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:8080',
      pathname: 'index.html',
      slashes: true
    })
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    })
  }

  mainWindow.loadURL(indexPath)

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Open the DevTools automatically if developing
    if (dev) {
      const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer')

      installExtension(REACT_DEVELOPER_TOOLS)
        .catch(err => console.log('Error loading React DevTools: ', err))
      mainWindow.webContents.openDevTools()
    }
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('ping', '🤘')
    
    ipcMain.on('request', function (event, arg) {
        console.log(arg)
        switch(arg){
          case 'open-excel':            
            openApp('excel')
            break;

          default:

        }
    });
    
    ipcMain.on('screen-share', function (event, arg) {
        const { request, target } = arg
        if(target === username){
          console.log(arg)
          mainWindow.webContents.send('allow-remote', true)
        }
    });

    function openApp(app){
      const bat = spawn('cmd.exe', ['/c', 'C:\\Program Files\\Microsoft Office\\root\\Office16\\'+app+'.EXE']);
      bat.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      bat.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      bat.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
      });
    }

  } );
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
