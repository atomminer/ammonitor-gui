import Vue from 'vue'
import Vuex from 'vuex'

//import appstate from './app-state'

Vue.use(Vuex)

export default new Vuex.Store({
	namespaced: true,
	state: {
		// miner obj: {id: 1,name: "",addr: ""}
    	miners: [], 
    	activeminer: null,
	},
	getters: {
		miners: (state) => state.miners,
		activeminer:  function (state) {
			return state.activeminer
		},
	},
	mutations: {
		addminer(state, p) {
			p.id = state.miners.length + 1;
			state.miners.push(p);
		},
		removeminer(state, p) {
			state.miners.shift();
		},
		updateminer(state, p) {
			state.activeminer = p;
		}
	},
	actions: {
		addMiner(c,m) {
			c.commit('addminer',m);
		},
		removeMiner(c,m) {
			c.commit('removeminer',m);
		},
		updateMiner(c,m) {
			c.commit('updateminer',m);	
		}
	}
});

