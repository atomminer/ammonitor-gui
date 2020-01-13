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
          <div class="full-width row no-wrap flex-center">No onlince miners</div>
        </div>
        <q-list v-else dense class="scroll full-height miniscroll">
          <q-item class="minerlistitem" v-if="devices.length>0" v-for="dev in devices" :key="dev.serial" clickable v-ripple @click="" >
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
  </q-page>
</template>

<script>
import Vue from 'vue'
import amfn from '../amfn'

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
        value: 'test123usiehi',
        imagePath: '/statics/icons/favicon-96x96.png',
        filter: 'color'
      },
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
      }
      catch(e){
      }
    },
    formatAlgo(val) {
      return val.charAt(0).toUpperCase() + val.substring(1);
    },
    formatHashrate(val) {
      //return val;
      return amfn.formatHashrate(val, 2) + 'H/s';
    },
    formatVoltage(val) {
      return (val).toFixed(2);
    },
    formatTemp(val) {
      // TODO: add optional conversion to ℉
      return (val).toFixed(1) + '℃';
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
	}
}
</script>
