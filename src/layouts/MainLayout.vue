<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="header noselect">
      <q-toolbar>
        <q-btn
          flat
          dense
          :icon="connectIcon"
          aria-label="Connect"
          @click="connectDialog"
        />

        <q-toolbar-title>
        </q-toolbar-title>

        <div>AtomMiner Monitor {{version}}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <conndlg v-model="vConnection"/>

  </q-layout>
</template>

<script>
import { mapState, mapGetter, mapActions } from 'vuex'
import conndlg from 'components/conndlg'
var state;
export default {
  components: {
    conndlg,
  },
  name: 'MainLayout',
  
  created() {
    const settings = this.$q.electron.remote.getGlobal('settings');
    this.version = this.$q.electron.remote.getGlobal('version');    
    this.changeDarkMode();

    this.$q.electron.ipcRenderer.on('ev-darkmode-change', (event, value) => {
      this.changeDarkMode();
    })

    this.$q.electron.ipcRenderer.on('ev-api-updated', (event, value) => {
      this.parseApiResponse(value);
    })

    this.$root.$on('dlgconnect-connect', this.connectToApi);

    state = this.$store.state;

    // debug only. force to connect to localhost upon load
    // this.connectToApi('localhost');

    // 1 second is ok for debug. 
    // TODO: read update interval from settings
    this.timer = setInterval(function(){ this.onTimer(); }.bind(this), 1000);
  },

  beforeDestroy () {
    console.log('MainLayout - destroy');
    this.$root.$off('dlgconnect-connect', this.connectToApi)
    clearInterval(this.timer);
    this.timer = null;
  },

  data () {
    return {
      version: '',
      vConnection: true,
      connectIcon: 'o_power',
      txtCurrentConnection: '',
      timer:null,
    }
  },

  computed: {
  },

  methods: {
    changeDarkMode() {
      var so = this.$q.electron.remote.getGlobal('settings');
        var dm = false;
        if(so)
          dm = so.get('darkmode');
        this.$q.dark.set(dm);
    },
    connectDialog() {
      if(this.$store.state.activeminer) {
        console.log('Cmd to disconnect');
        this.connectIcon = 'o_power';
        this.removeMiner();
        this.updateMiner(null);
        //if(!state.miners.length) {
          if(this.$router.currentRoute.path !== '/')
            this.$router.replace('/');
        //}
      }
      this.vConnection = true;
    },
    connectToApi(val) {
      this.vConnection = false;
      this.connectIcon = 'o_power_off';
      console.log('Cmd to connect to: ' + val);
      this.txtCurrentConnection = val;
      this.addMiner({name:'',addr:val});
      this.$q.electron.ipcRenderer.send('ev-start-updating', val);

      if(this.$router.currentRoute.path !== '/miner')
        this.$router.replace('/miner');
      this.vConnection = false;
    },
    onTimer() { 
      if(this.$store.state.activeminer && this.$store.state.miners.length > 0) {
        this.$q.electron.ipcRenderer.send('ev-start-updating', this.txtCurrentConnection);
      }
      // // we should refresh all connected miners here, as it is background thing for other pages
      // if(this.$store.state.miners.length == 0)
      //   return; // nothing to do here
      
      // // since 1.0.3RC6 does not set CORS headers, we cant read data from the page directly
      // // pass event back to main process since it doesn't care about CORS
      // for(var m of this.$store.state.miners)
      //   this.$q.electron.ipcRenderer.send('ev-update-miner-info', m.addr);
        // get status first
        // axios.post('http://' + m.addr + ':9123/', {
        //   id: 1,
        //   cmd: 'status',
        //   params: []
        // })
        // .then((res) => {
        //   m.connected = true;
        //   m.status = res.data.response[0];
        // })
        // .catch((error) => {
        //   m.connected = false;
        //   m.status = {};
        //   console.log("miner update exc:"+error);
        // })
    },
    parseApiResponse(r) {
      if(!r || this.$store.state.miners.length == 0)
        return;

      // only working with 1 for now
      var m = this.$store.state.miners[0];
      m.alive = r.alive;

      try{
        for(var cmd of r.data) {
          if(cmd.cmd === 'status')
            m.status = cmd.data.response[0]
          else if(cmd.cmd === 'listdevice')
            m.devices = cmd.data.response;
          else if(cmd.cmd === 'log')
            m.log = cmd.data;
          else
            console.log('parseApiResponse unknown cmd ' + cmd.cmd);
        }
      }
      catch(e) {
        m.alive = false;
      }

      this.updateMiner(m);
      this.$root.$emit('current_miner_updated');
    },
    ...mapActions(['addMiner','removeMiner','updateMiner']),
    
  }
}
</script>
