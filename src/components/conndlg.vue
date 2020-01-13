<template>
  <div>

  <q-dialog v-model="shouldShow" persistent full-height transition-show="scale" transition-hide="scale" style="width:70%;max-width:80vw;" ref="dlgConn">
      <q-card class="column full-height" style="width:100%">
        <q-card-section class="row" style="padding:0.8em;">
          <div class="text-h6"><q-icon name="img:statics/icons/favicon-96x96.png" style="margin-top:-4px;"/> Connect to miner</div>
          <q-space />
          <q-btn flat icon="close" color="primary" class="smallbtnicon" v-close-popup>
            <q-tooltip :delay="tooltipDelay">Close</q-tooltip>
          </q-btn>
        </q-card-section>

        <q-separator />

        <q-card-section style="width:100%;padding-top:0">
          <q-select
            dense
            label="IP or Network name of the running miner"
            v-model="txtMinerIpPort"
            use-input
            hide-selected
            fill-input
            hide-dropdown-icon
            bottom-slots
            input-debounce="0"
            ref="cIpPortMiner"
            autofocus-filter
            :options="options"
            @filter="filterFn"
          >
            <template v-slot:prepend>
              <q-icon name="account_tree" @click.stop />
            </template>
            <template v-slot:append>
              <q-btn flat dense icon="star" @click.stop="saveConnection(txtMinerIpPort)" class="smallbtnicon_half">
                <q-tooltip :delay="tooltipDelay">Save</q-tooltip>
              </q-btn>
              <q-btn flat dense icon="open_in_browser" @click.stop="" class="smallbtnicon_half rotate90">
                <q-tooltip :delay="tooltipDelay">Connect</q-tooltip>
              </q-btn>
            </template>
            <template v-slot:hint>
              Ex: <i><b>127.0.0.1</b></i> or <i><b>localhost</b></i> or <i><b>127.0.0.1:19456 </b></i> when API is set to run on a different port
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No results
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>
  
        <q-card-section style="width:100%;padding-bottom:0">
          <q-tabs
            v-model="tabConnections"
            align="left"
            inline-label
            dense
            indicator-color="primary"
            :breakpoint="0"
          >
            <q-tab style="text-transform:none;" name="recent" label="Recent Connections" />
            <q-tab style="text-transform:none;" name="saved" label="Saved Connections" />
            <q-tab style="text-transform:none;" name="discovery" label="Discovery" />
          </q-tabs>
        </q-card-section>

        <q-card-section class="col" style="padding-bottom:0">
          <q-tab-panels
            v-model="tabConnections"
            animated
            transition-prev="jump-up"
            transition-next="jump-up"
            class="full-height"
          >
            <q-tab-panel name="recent" style="padding:0;">
              <div style="width:100%" class="scroll full-height">
                <div v-if="historyDevices.length==0" style="padding-top:0.8em">
                  <div>No recent connections:</div>
                  <div>
                    <a href="#" @click.stop="tabConnections='saved'" class="doc-link">
                      Connect to a saved miner
                    </a>
                  </div>
                  <div>
                    <a href="#" @click.stop="tabConnections='discovery';startDiscovery()" class="doc-link">
                      Scan network for running miners...
                    </a>
                  </div>
                </div>
                <q-list v-else dense class="scroll full-height miniscroll">
                  <q-item clickable v-ripple v-for="(dev,idx) in historyDevices" :key="idx" @click="connectTo(dev.addr,dev.name)">
                    <q-item-section>
                      <q-item-label >{{ formataddr(dev.addr, dev.name) }}</q-item-label>
                      <q-item-label caption>Last used {{ timeDifference(dev.lastused) }}</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <div>
                        <q-btn flat dense icon="delete" @click.stop="deleteRecentConnection(dev.addr)" class="smallbtnicon">
                          <q-tooltip :delay="tooltipDelay">Delete</q-tooltip>
                        </q-btn>
                        <q-btn flat dense icon="open_in_browser" @click.stop="connectTo(dev.addr)" class="smallbtnicon rotate90">
                          <q-tooltip :delay="tooltipDelay">Connect</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>                 
                </q-list>
              </div>
            </q-tab-panel>

            <q-tab-panel name="saved" style="padding:0;">
              <div style="width:100%" class="scroll full-height">
                <q-list dense class="scroll full-height miniscroll">

                  <q-item clickable v-ripple v-for="dev in savedDevices" :key="dev.id" @click="connectTo(dev.addr, dev.name)">
                    <q-item-section v-if="dev.name.length>0">
                      <q-item-label >{{dev.name}}</q-item-label>
                      <q-item-label caption>{{ formataddr(dev.addr) }}</q-item-label>
                    </q-item-section>
                    <q-item-section v-else>
                      <q-item-label >{{ formataddr(dev.addr) }}</q-item-label>
                    </q-item-section>

                    <q-item-section side top>
                      <div>
                        <q-btn flat dense icon="edit" @click.stop="editConnection(dev.id)" class="smallbtnicon">
                          <q-tooltip :delay="tooltipDelay">Edit</q-tooltip>
                        </q-btn>
                        <q-btn flat dense icon="delete" @click.stop="deleteSavedConnection(dev.id)" class="smallbtnicon">
                          <q-tooltip :delay="tooltipDelay">Delete</q-tooltip>
                        </q-btn>
                        <q-btn flat dense icon="open_in_browser" @click.stop="connectTo(dev.addr, dev.name)" class="smallbtnicon rotate90">
                          <q-tooltip :delay="tooltipDelay">Connect</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                  
                </q-list>
              </div>
            </q-tab-panel>

            <q-tab-panel name="discovery" style="padding:0;">
              <div class="row">
                <div class="col12 full-width" v-if="networkScanInProgress">
                  <div style="padding: 0px 16px">Network miner(s) discovery is in progress...</div>
                  <q-linear-progress indeterminate />
                </div>
                <div class="col12 full-width" v-else>
                  <div style="padding: 0px 16px; font-weight:700;">
                    <a href="#" @click.stop="startDiscovery" class="doc-link">
                      <q-icon name="search" />
                      Scan network for running miners...
                    </a>
                  </div>
                  <q-linear-progress reverse :value="0" />
                </div>
              </div>
              <div class="row">
                <div class="col12 full-width">
                  <q-list dense class="scroll miniscroll">
                    <q-item clickable v-ripple v-for="dev in discoveredDevices" :key="dev.id" @click="txtMinerIpPort=dev.addr">
                      <q-item-section avatar style="min-width:1px;">
                        <q-icon :name="dev.isrpi ? 'fab fa-raspberry-pi' : 'fas fa-desktop'" class="smallbtnicon" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{dev.addr}}</q-item-label>
                        <q-item-label caption>Running {{dev.version}} for <i>{{ readableTimeFromSeconds(dev.uptime) }}</i></q-item-label>
                      </q-item-section>
                      <q-item-section side top>
                        <div>
                          <q-btn flat dense icon="star" @click.stop="saveConnection(dev.addr)" class="smallbtnicon">
                            <q-tooltip :delay="tooltipDelay">Save</q-tooltip>
                          </q-btn>
                          <q-btn flat dense icon="open_in_browser" @click.stop="connectTo(dev.addr)" class="smallbtnicon rotate90">
                            <q-tooltip :delay="tooltipDelay">Connect</q-tooltip>
                          </q-btn>
                        </div>
                      </q-item-section>
                      <q-menu context-menu touch-position auto-close ref="discoveryItemMenu" >
                        <q-list dense style="min-width: 100px" >
                          <q-item clickable v-close-popup @click="saveConnection(dev.addr)">
                            <q-item-section>Save</q-item-section>
                          </q-item>
                          <q-item clickable v-close-popup @click="connectTo(dev.addr)">
                            <q-item-section>Connect</q-item-section>
                          </q-item>
                        </q-list>
                      </q-menu>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-card-actions align="center">
          <div style="width:100%"><q-separator style="width:100%" /></div>
          <div><q-btn flat label="Connect" color="primary" :disable="txtMinerIpPort.length==0" v-close-popup @click="onConnect(null)" /></div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dlgSave" transition-show="scale" transition-hide="scale" ref="dlgConnSave">
      <q-card class="" style="width: 300px">
        <q-card-section>
          <div class="text-h6">{{ saveAction }} Connection</div>
        </q-card-section>

        <q-card-section>
          <q-input 
            v-model="saveName" 
            label="Connection Name (optional)" 
            stack-label 
            dense 
            autofocus 
            clearable
            clear-icon="close" 
          />
          <q-input 
            v-model="saveAddr" 
            label="IP or Address" 
            stack-label 
            dense 
            clearable
            clear-icon="close"
            :rules="[val => val && val.trim().length > 0 || 'Field is required']"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="">
          <q-btn flat label="Save" color="primary" @click="onSave" />
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>

</template>

<script>
export default {
  name: 'condlg',
  data() {
    return {
      dlgSave: false,
      tooltipDelay: 600, // for convenience only
      txtMinerIpPort: null,
      options: [],
      historyDevices: [],
      savedDevices: [],
      discoveredDevices: [],
      tabConnections: null,
      networkScanInProgress: false,
      saveId: 0,
      saveName: "",
      saveAddr: "",
    }
  },
  props: ['visible'],
  model: {
    prop: 'visible',
    event: 'visiblechange'
  },
  computed: {
    shouldShow: {
      get: function() {
        return this.visible
      },
      set: function(value) {
        this.$emit('visiblechange', value)
      }
    },
    saveAction() { 
      return this.saveId ? 'Edit' : "Save";
    }
  },
  watch: {
    'tabConnections' (val) {
      this.$q.electron.remote.getGlobal('settings').set("lastConnActiveTab", val);
    },
    'visible' (val) {
      if(val)
        this.tabConnections = 'recent';
    }
  },
  created() {
    const settings = this.$q.electron.remote.getGlobal('settings');

    this.tabConnections = settings.raw().lastConnActiveTab;
    if(!this.tabConnections) // probably first run or settings were deleted or corrupted
      this.tabConnections = "discovery";

    this.txtMinerIpPort = settings.raw().lastconnection;
    if(!this.txtMinerIpPort) {
      this.txtMinerIpPort = "localhost";
      settings.set("lastconnection", "localhost");
    }

    //TODO: populate recent and saved connections from settings
    this.savedDevices = settings.raw().savedConnections;
    if(!this.savedDevices) this.savedDevices = [];
    this.historyDevices = settings.raw().recentConnections;
    if(!this.historyDevices) this.historyDevices = [];


    // should be last saved in historyDevices instead of localhost
    if(!this.txtMinerIpPort)
      this.txtMinerIpPort = "localhost";

    this.$q.electron.ipcRenderer.on('ev-am-finder-start', (event, value) => {
      this.discoveredDevices = [];
      this.networkScanInProgress = true;
    })
    this.$q.electron.ipcRenderer.on('ev-am-finder-finished', (event, value) => {
      this.networkScanInProgress = false;
    })
    this.$q.electron.ipcRenderer.on('ev-am-finder-gotip', (event, value) => {
      value.id = this.discoveredDevices.length + 1;
      this.discoveredDevices.push(value);
    })
  },
  methods: {
    async filterFn (val, update, abort) {
      if(val) {
        this.txtMinerIpPort = val;
      }
      update(() => {
        const needle = val.toLowerCase()
        var arr = this.historyDevices.concat(this.savedDevices.map(v => v.addr));
        arr = arr.concat(this.discoveredDevices.map(v => v.addr));
        arr = arr.filter((v,p) => { return arr.indexOf(v) == p; });

        this.options = arr.filter(v => v.toLowerCase().indexOf(needle) > -1)
        if(val && val.length && arr.filter(v => v.toLowerCase() === val.toLowerCase()).length == 0)
          this.options.push(val);
      })
    },
    discoceryItemClick(e) {
      this.$refs.discoveryItemMenu.show(e);
    },
    startDiscovery(e) {
      this.$q.electron.ipcRenderer.send('ev-find-rpi');
    },
    readableTimeFromSeconds(t) {
      // TODO: move into the lib ?
      var d = parseInt(t/86400); 
      return ((d > 0) ? (d +'d ') : '') +(new Date(t%86400*1000)).toUTCString().replace(/.*(\d{2}):(\d{2}):(\d{2}).*/, "$1:$2:$3");
    },
    show() {
      this.shouldShow = true;
    },
    hide() {
      this.shouldShow = false;
    },
    connectTo(to,n) { // actual connection requested
      // TODO: find name if n is null or empty
      const settings = this.$q.electron.remote.getGlobal('settings');
      this.$root.$emit("dlgconnect-connect", to);
      this.hide();
      this.historyDevices = this.historyDevices.filter(v => v.addr !== to);
      const timeNow = new Date().getTime();
      this.historyDevices.unshift({addr: to, name: n, lastused:timeNow});
      //this.historyDevices = this.historyDevices.filter((v,p) => { return this.historyDevices.indexOf(v) == p; });
      settings.set('recentConnections', this.historyDevices);
    },
    onSave() { // called when save clicked in save dlg
      const settings = this.$q.electron.remote.getGlobal('settings');

      if(this.saveAddr.trim().length == 0)
        return;
      if(!this.saveName)
        this.saveName = '';

      if(!this.saveId)
        this.savedDevices.push({id: this.savedDevices.length + 1,name:this.saveName, addr:this.saveAddr});
      else {
        for(var d of this.savedDevices) {
          if(d.id == this.saveId) {
            d.name = this.saveName;
            d.addr = this.saveAddr;
            break;
          }
        }
      }
      settings.set('savedConnections', this.savedDevices);
      this.dlgSave = false;
    },
    deleteSavedConnection(id) {
      const settings = this.$q.electron.remote.getGlobal('settings');
      if(!id)
        return;
      this.savedDevices = this.savedDevices.filter(v => v.id != id);
      settings.set('savedConnections', this.savedDevices);      
    },
    saveConnection(what) { // when clicked save connection
      this.saveId = 0;
      this.saveName = '';
      this.saveAddr = what;
      this.dlgSave = true;
    },
    editConnection(id) { // when clicked edit connection
      this.saveId = id;
      for(var d of this.savedDevices) {
        if(d.id == this.saveId) {
          this.saveName = d.name;
          this.saveAddr = d.addr;
          break;
        }
      }
      
      this.dlgSave = true;
    },
    deleteRecentConnection(addr) {
      if(!addr)
        return;
      const settings = this.$q.electron.remote.getGlobal('settings');
      this.historyDevices = this.historyDevices.filter(v => v.addr !== addr);
      settings.set('recentConnections', this.historyDevices);
    },
    formataddr(addr, name) {
      const s = 'http://' + (addr.indexOf(':') == -1 ? (addr + ':9123') : addr);
      if(!name)
        return s;
      return `${name} (${s})`;
    },
    timeDifference(t) {
      var msPerMinute = 60 * 1000;
      var msPerHour = msPerMinute * 60;
      var msPerDay = msPerHour * 24;
      var msPerMonth = msPerDay * 30;
      var msPerYear = msPerDay * 365;

      var elapsed = new Date().getTime() - t;

      if (elapsed < msPerMinute)
         return Math.round(elapsed/1000) + ' seconds ago';   
      else if (elapsed < msPerHour)
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
      else if (elapsed < msPerDay )
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
      else if (elapsed < msPerMonth)
        return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';   
      else if (elapsed < msPerYear)
        return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';   
      else
        return 'approximately never';   
        //return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';   

    }
  },
}
</script>