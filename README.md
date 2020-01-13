# AtomMiner Monitor (ammonitor-gui)

AtomMiner Monitor app to monitor remote network atomminer(-cli) process via API

## Clone and Install the dependencies
```bash
git clone https://github.com/atomminer/ammonitor-gui.git
cd ammonitor-gui
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev -m electron
```


### Build release for current OS
```bash
quasar build -m electron
```

### Build release for other platform(s)
Linux
```bash
quasar build -m electron -T linux
```
MacOs
```bash
quasar build -m electron -T darwin
```
Windows
```bash
quasar build -m electron -T win32
```
