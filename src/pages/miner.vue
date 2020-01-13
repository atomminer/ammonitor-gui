<template>
  <q-page class="flex flex-column">

    <q-footer elevated bordered class="bg-white text-primary noselect" style="flex: 0 1 20px; height:20px; max-heigh:20px">
      <div style="padding-left:.5em; font-size:.95em">
        {{txtFooter}}
      </div>
    </q-footer>

    <div class="full-width row no-wrap " style="flex: 1 1 auto;bottom:20px">
      <div class="column minerpanel noselect">
        <div v-if="devices.length==0" class="" style="padding-top:0.8em;min-width: 204px;">
          <div class="full-width row no-wrap flex-center">No online miners</div>
        </div>
        <q-list v-else dense class="scroll full-height miniscroll">
          <q-item class="minerlistitem" v-if="devices.length>0" v-for="dev in devices" :key="dev.serial" clickable v-ripple @click="showMinerInfo(dev.serial)" >
            <q-item-section avatar style="min-width:1px;padding-right:5px!important">
            </q-item-section>
            <q-item-section class="" no-wrap style="padding-right:2px!important">
              <q-item-label><img width="16px" src="~assets/am-logo-64.svg"> AM01 - {{dev.serial}}</q-item-label>
              <q-item-label caption>{{formatAlgo(dev.algo)}}: {{ formatHashrate(dev.hashrate, 2) }} <q-icon :name="getHashrateIcon(dev)" /></q-item-label>
              <q-item-label caption :class="getDeviceClassColor(dev)">
                <div class="col no-wrap"><q-icon name="fas fa-thermometer-half" />{{formatTemp(dev.temp)}}</div>
                <div class="col flex-middle"><q-icon name="fas fa-bolt" /> {{formatVoltage(dev.vcc)}}V</div>
                <q-icon class="column" name="fas fa-plug" /> {{dev.power}}W
              </q-item-label>
            </q-item-section>
            <q-tooltip anchor="center middle" self="top left" :delay="tooltipDelay">
              Healthy? Maybe provide more info here?<br>
              like active pool and stuff maybe?
            </q-tooltip>
          </q-item>
        </q-list>
      </div>
      
      <div class="col full-width full-height infopanel">
        <div> test1</div>
        <div> test2</div>
        <q-virtual-scroll
          style="flex: 1;"
          :items="log"
          class="miniscroll minilog"
        >
          <template v-slot="{ item, idx }">
            <q-item
              class="minilog"
              :key="idx"
              dense
            >
              <q-item-section>
                <q-item-label :class="classForLogItem(item)" v-html="processLogitem(item.message)">
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-virtual-scroll>
        
      </div>
    </div>

    <q-dialog v-model="vMinerInfo" @hide="hideMinerInfo" @show="minerInfoUpdateQR">
      <q-card>

        <q-card-section style="max-height: 70vh;" class="scroll miniscroll">
          <div class="row q-gutter-md">
            <div class="column">
              <div ref="deviceQR" />
            </div>
            <div class="column">
              <div class="row">
                <div class="rowinfotbl">
                  <div class="inforow">
                    <div class="infocol text-bold">
                      Status
                    </div>
                    <div class="infocol full-width" v-html="minerStatus(currentMinerInfo)">
                      
                    </div>
                  </div>

                  <div class="inforow">
                    <div class="infocol text-bold">
                      Device
                    </div>
                    <div class="infocol full-width">
                      <q-icon v-if="currentMinerInfo.type==='USB'" name="fab fa-usb" /> {{currentMinerInfo.name}}
                    </div>
                  </div>

                  <div class="inforow">
                    <div class="infocol text-bold">
                      SN
                    </div>
                    <div class="infocol full-width">
                      {{currentMinerInfo.serial}}
                    </div>
                  </div>

                  <div class="inforow">
                    <div class="infocol text-bold">
                      Hardware
                    </div>
                    <div class="infocol full-width">
                      {{currentMinerInfo.version}}
                    </div>
                  </div>
                </div>
              </div>

              <div class="row full-width">
                <div :class="getDeviceClassColor(currentMinerInfo)" style="width:100%">
                  <div class="col no-wrap" style="white-space:nowrap;"><q-icon name="fas fa-thermometer-half" />{{formatTemp(currentMinerInfo.temp)}}</div>
                  <div class="col flex-middle"><q-icon name="fas fa-bolt" /> {{formatVoltage(currentMinerInfo.vcc)}}V</div>
                  <q-icon class="column" name="fas fa-plug" /> {{currentMinerInfo.power}}W
                </div>
              </div>

              <div class="row">
                <q-separator />
              </div>

              <div class="row">
                <div class="infotbl">
                  <div class="inforow">
                    <div class="infocol text-bold">
                      Current algo
                    </div>
                    <div class="infocol full-width">
                      {{formatAlgo(currentMinerInfo.algo)}}
                    </div>
                  </div>

                  <div class="inforow">
                    <div class="infocol text-bold">
                      Current coin
                    </div>
                    <div class="infocol full-width">
                      <q-img :src="getCoinImage16(currentMinerInfo.allocation)" spinner-color="white" style="height: 16px; max-width: 16px" /> {{currentMinerInfo.allocation}}
                    </div>
                  </div>

                  <div class="inforow">
                    <div class="infocol text-bold" style="white-space: nowrap;">
                      Expected hashrate
                    </div>
                    <div class="infocol full-width">
                      {{formatHashrate(currentMinerInfo.expected)}}
                    </div>
                  </div>

                  <div class="inforow">
                    <div class="infocol text-bold no-wrap">
                      Actual hashrate
                    </div>
                    <div class="infocol full-width">
                      {{formatHashrate(currentMinerInfo.hashrate)}}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            </div>
          </div>
          </div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import Vue from 'vue'
import amfn from '../amfn'
import * as QRCode from 'easyqrcodejs' 

export default {
	name: 'PageMiner',
  components: {
  },
  watch: {
    //'$store.getters.activeminer' (v) { console.log("s a c"); },
    //'activeminer' (v) { console.log("l a c"); },
  },
  created() {
    this.$root.$on('current_miner_updated', this.minerUpdated);
  },
	mounted() {
	},
	beforeDestroy () {
    this.$root.$off('current_miner_updated', this.minerUpdated);
	},
  data () {
    return {
      tooltipDelay: 400,
      txtFooter: 'Connecting to localhost...',
      devices : [],
      log: [],
      qrconfig: {
        value: '',
        imagePath: '/statics/icons/favicon-96x96.png',
        filter: 'color'
      },
      vMinerInfo: false,
      currentMinerSerial: '',
      currentMinerInfo: {},
      currentMinerQR: null,
    }
  },
	methods: {
    showminer() {
    },
    stopminer() {
      console.log(this.$store.getters.activeminer);
    },
    minerUpdated() {
      this.devices = [];
      try {
        //this.devices = [];
        if(!this.$store.state.activeminer.alive)
          this.txtFooter = `Reconnecting to ${this.$store.state.activeminer.addr}...`;
        else
          this.txtFooter = `Connected to ${this.$store.state.activeminer.addr}`;
        this.devices = this.$store.state.activeminer.devices;
        this.log = this.$store.state.activeminer.log;
        this.txtFooter = `Connected to ${this.$store.state.activeminer.addr} with ${this.devices.length} miners. Uptime: ${amfn.formatTimespanFromSeconds(this.$store.state.activeminer.status.uptime)}`;

        this.updateCurrentMiner();
      }
      catch(e){
      }
    },
    updateCurrentMiner() {
      this.currentMinerInfo.online = false;
      for(var d of this.devices)
          if(d.serial === this.currentMinerSerial) {
            this.currentMinerInfo = d;
            // there's a bug (or a feature?) in 1.0.3RC6. it reports all devices being offline.
            // override it here since offline device storage was removed in 1.0.3RC4
            this.currentMinerInfo.online = true;
            break;
          }
    },
    formatAlgo(val) {
      if(!val)
        return '';
      return val.charAt(0).toUpperCase() + val.substring(1);
    },
    formatHashrate(val) {
      if(!val)
        return '0H/s';
      return amfn.formatHashrate(val, 2) + 'H/s';
    },
    formatVoltage(val) {
      if(!val)
        return '?';
      return (val).toFixed(2);
    },
    formatTemp(val) {
      if(!val)
        return '?';
      const metric = this.$q.electron.remote.getGlobal('settings').raw().metric;
      var t = val;
      if(!metric)
        t = amfn.tempToF(val);
      return t.toFixed(1) + (metric ? '℃' : '°F');
    },
    getHashrateIcon(dev) {
      if(dev.hashrate < 0.99 * dev.expected)
        return 'far fa-frown';
      return 'far fa-smile';
    },
    getDeviceClassColor(dev) {
      if(dev.temp >= 80)
        return 'row text-red';
      else if(dev.temp > 43) // TODO: should be 65. for testing only
        return 'row text-orange';
      return 'row';
    },
    classForLogItem(item) {
      if(item.tag === 'debug' || item.tag === 'device')
        return 'text-grey-8 text-bold';
      else if(item.tag === 'notice')
        return 'text-light-blue';
      else if(item.tag === 'warning')
        return 'text-orange';
      else if(item.tag === 'error')
        return 'text-red text-bold';
      else if(item.tag === 'update')
        return 'text-yellow text-bold';
      return "text-bold";
    },
    processLogitem(msg) {
      var s = msg;
      s = s.replace('Accepted', '<span class="text-green-13 text-bold">Accepted</span>')
      s = s.replace('Rejected', '<span class="text-red text-bold">Accepted</span>')
      return s;
    },
    minerInfoUpdateQR() {
      if(!this.currentMinerSerial.length) {
        this.currentMinerQR = null;
        return;
      }

      var options = {
        text: this.currentMinerSerial,
        width: 170,
        height: 170,
        correctLevel: QRCode.CorrectLevel.Q,
        dotScale: 1,
        quietZone: 3,
        quietZoneColor: 'transparent',
        logo: '/statics/images/am-logo-96-white.png',
        logoBackgroundTransparent: true,
      }
      this.currentMinerQR = new QRCode(this.$refs.deviceQR, options);
    },
    showMinerInfo(serial) {
      this.currentMinerSerial = serial;
      this.updateCurrentMiner();
      this.vMinerInfo = true;
    },
    hideMinerInfo() {
      this.currentMinerSerial = '';
      this.currentMinerInfo = {};
      this.minerInfoUpdateQR();
    },
    minerStatus(dev) {
      if(!dev)
        return '<spn class="text-red text-bold">Offline</span>';
      if(!dev.online)
        return '<spn class="text-red text-bold">Offline</span>';
      var s = '<spn class="text-green text-bold">Online';
      if(dev.working)
        s+= ', Hashing';
      else
        s+= ', Idle';
      s+= '</span>'
      return s;
    },
    getCoinImage16(c) {
      var s = c;
      if(!c)
        s = 'generic-coin';
      return `http://static.atomminer.com/images/coin/16/${s.toLowerCase()}.png`;
    }
	}
}
</script>
