import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { SettingsStore } from './electron-settings.js'
import Finder from '../utils/amfinder'

const openAboutWindow = require('about-window').default
const async = require('async');
const getJsonCmdTask = require('../utils/remoteapi').getJsonCmdTask;

// global finder object...when we need it...if we need it
var amfinder = null;

const isDev = !process.env.PROD

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
  global.version = app.getVersion();
}
else {
  // dirty hack. Electron return quasar version in dev environment, which is incorrect
  const appVersion = require('../../package.json').version;
  global.version = appVersion;
}

console.log("Starting v." + global.version)

// would be typically stored in
// ~/.config/Electron/ammonitor-preferences.json
let settings = new SettingsStore({
  configName: 'ammonitor-preferences',
  defaults: {
    darkmode: true,
    windowBounds: { x: 10, y: 10, width: 800, height: 600 },
    lastconnection: "localhost",
    metric: true,
  }
});
console.log("Using settings from: " + settings.path)

global.settings = settings;
global.discoveryRunning = false;

// END INIT

let mainWindow
let workerWindow

var watchingMiners = []

function createBgWindow() {
  // TODO
  // workerWindow = new BrowserWindow({"show": false})
  // workerWindow.on('closed', () => {
  //   console.log('background window closed')
  // });
}

// function updateConnectedMiners() {
//   // if(!watchingMiners.length)
//   //   return;
//   // console.log('updateConnectedMiners')
//   // console.log(watchingMiners)
//   // remoteapi("localhost", async function(m) {
//   //   console.log("remoteapi done with:");
//   //   console.log(m);
//   //   const t = watchingMiners.filter(v => v.addr === arg);
//   //   if(t.length)
//   // });
//   //setTimeout(updateConnectedMiners, 1000);
// }

function createWindow () {
  
  let { x, y, width, height } = settings.get('windowBounds');

  createBgWindow();
  
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: x,
    y: y,
    useContentSize: true,
	  icon: isDev ? './src/assets/am-logo-96.png' : 'img/am-logo-96.png',
    webPreferences: {
      nodeIntegration: true,
      devTools: isDev,
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on( "move", function( event ) {
    let { x, y, width, height } = mainWindow.getBounds();
    settings.set('windowBounds', { x, y, width, height });
  });
}

// https://coursetro.com/posts/code/119/Working-with-Electron-Menus---Tutorial
const isMac = process.platform === 'darwin'
const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { 
        label: 'Dark Mode', 
        type: 'checkbox',
        checked: global.settings.raw().darkmode,
        click: async () => { 
          global.settings.set('darkmode', !global.settings.raw().darkmode);
          mainWindow.webContents.send('ev-darkmode-change') 
        } 
      },
      { type: 'separator' },
      ...(isDev ? [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },] : []),
      { role: 'resetzoom' },
      { role: 'zoomin' },
      { role: 'zoomout' },
    ]
  },
  {
    role: 'help',
    submenu: [
  	  {
  		  label: 'About...',
  		  click: async() => {
  			  //openAboutWindow(require('path').join(__dirname, '../icons/linux-128x128.png'));
  			  openAboutWindow('app-icon.png');
  		  }
  	  }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function logdate() {
  return new Date().toTimeString().split(' ')[0];
}

async function startUpdatingMiner(m) {
  const t = watchingMiners.filter(v => v.addr === m.addr);
  if(!t.length) {
    console.log("stop updating " + m.addr)
    return;
  }

  console.log(logdate() + " updating " + m.addr)
  remoteapi(m.addr, async function(nm) {
    console.log(logdate() + " remoteapi done for " + m.addr);
    m.alive = nm.alive;
    m.status = nm.status;
    m.devlist = nm.devlist;
    m.loglist = nm.loglist;
    setTimeout(startUpdatingMiner, 1000, m);    
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('ev-find-rpi', async function(e, arg) {
  if(!mainWindow)
    return;
  if(!amfinder) {
    try {
      console.log("Satring finder...");
      mainWindow.webContents.send('ev-am-finder-start');
      amfinder = Finder();

      amfinder.on('foundAPI', async function(ip){ 
        console.log("Discovered API on: " + ip.addr); 
        mainWindow.webContents.send('ev-am-finder-gotip', ip);
      })

      var starttm = new Date().getTime();
      amfinder.start(async function(err) {
        var s = "finder finished";
        if(err)
          s += " with error: " + err;
        s += " in " + (new Date().getTime() - starttm) + "ms";
        console.log(s);
        amfinder = null;
        mainWindow.webContents.send('ev-am-finder-finished');
      });
    }
    catch(e) {
      amfinder = null;
      mainWindow.webContents.send('ev-am-finder-finished');
    }
  } 
});

ipcMain.on('ev-start-updating', async function(e, arg) {
  async.parallel([getJsonCmdTask(arg,'status'), getJsonCmdTask(arg,'listdevice'),getJsonCmdTask(arg,'log')], function(err, results) {
    var m = {alive: false, data: null};
    if(!err) {
      m.alive = true;
      m.addr = arg;
      m.data = results;
    }
    mainWindow.webContents.send('ev-api-updated', m);
  });

  // yet another way to get json
  // const { net } = require('electron')
  // const request = net.request({
  //   method: 'POST',
  //   url: a,
  // })

  // request.on('response', (response) => {
  //   var body = ''
  //   response.on('data', (chunk) => {
  //     body += chunk.toString()
  //   })
  //   response.on('end', () => {
  //     // JSON.parse(body)
  //     console.log(logdate() + ' ' + body);
  //   })
  // })
  // request.on('error', (error) => {
  //   console.log(logdate() + ' ' + error);
  // });

  // request.write(JSON.stringify({id: 1,cmd: 'status',params: []}));
  // request.end();
});

ipcMain.on('ev-api-stop-updating', async function(e, arg) {
  console.log(logdate() + ' ev-api-stop-updating ' + arg);
  watchingMiners = watchingMiners.filter(v => v.addr !== arg);
});
