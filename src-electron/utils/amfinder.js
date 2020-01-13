const os  = require('os');
const util = require('util');
const events = require('events');
const ip = require('ip');
const async = require('async');
const arp = require('./arp.js').arp;
const ping = require('./ping.js').ping;
const getJsonCmdTask = require('./remoteapi').getJsonCmdTask;

// Global TODO:
// broadcast UDP msg across all available interfaces and wait for response instead of scanning network
// in that case we should be able to discover any device that runs software with API, not only rpi

util.inherits(Finder, events.EventEmitter);

var proto = Finder.prototype;
proto.ip = false;
proto.subnet = false;
proto.whitelist = [
  /b8:27:eb/, // rasberry pi ethernet
  /40:a5:ef/, // https://www.adafruit.com/products/814
  /00:e0:4c/, // realtek
  /00:14:78/, // tp-link
  /00:0c:43/, // ralink
  /00:c0:ca/, // alfa
  /e8:4e:06/  // edup co ltd aka odroid
];

proto.start = function(cb) {
  var interfaces = os.networkInterfaces();
  var subnets = [];

  for(var name in interfaces) {
    var ifc = interfaces[name];
    for(var i=0; i<ifc.length; i++) {
      if(ifc[i].family == 'IPv4') {
        subnets.push(ifc[i].address);
      }
    }
  }

  // test localhost first
  //this.checkDefaultApi('127.0.0.1');
  this.checkDefaultApi({isrpi: false, addr:'localhost'});

  subnets = subnets.filter(function(n) { return n !== '127.0.0.1'; });
  this.total_ips = [];
  this.doSubnet(subnets,cb);
};

proto.checkDefaultApi = async function(ip) {
  async.parallel([getJsonCmdTask(ip.addr,'status')], function(err, results) {
    if(!err) {
      try{
        var data = results[0].data.response[0];
        ip.version = data.version;
        ip.uptime = data.uptime;
        if(!ip.version) ip.version = "Unknown";
        if(!ip.uptime) ip.uptime = 0;
        this.emit('foundAPI', ip);
      }
      catch(e){
      }
    }
  }.bind(this));
  
  // //axios.defaults.timeout = 700;
  // axios.post('http://' + ip.addr + ':9123/', {
  //   id: 1,
  //   cmd: 'status',
  //   params: []
  // })
  // .then((res) => {
  //   ip.version = res.data.response[0].version;
  //   ip.uptime = res.data.response[0].uptime;
  //   if(!ip.version) ip.version = "Unknown";
  //   if(!ip.uptime) ip.uptime = 0;
  //   this.emit('foundAPI', ip);
  // })
  // .catch((error) => {
  //   //console.log("checkDefaultApi e:" + error);
  // })
};

proto.doSubnet = function(subnets,cb) {
  var addr = subnets.shift();
  this.subnet = addr.substr(0, addr.lastIndexOf('.')) || false;
  var self = this;
  this.timesLimit(
      255,
      2,
      this.ping.bind(this),
      function(err,ips) {
        if(Array.isArray(ips)) {
          self.total_ips = self.total_ips.concat(ips);
        }
        if(subnets.length > 0) {
          self.doSubnet(subnets, cb);
        } else {
          self.finish(cb,err,self.total_ips);
        }
      }
  );
};

proto.ping = function(position, next) {

  var host = this.subnet + '.' + position;

  ping(host, function(){
    this.arp(host, next);
  }.bind(this));

};

proto.arp = function(host, next) {
  arp(host, function(err, mac) {
    if (err || !mac)
      return next();

    for(var i=0; i < this.whitelist.length; i++) {

      if(this.whitelist[i].test(mac)) {
        this.checkDefaultApi({isrpi: true, addr:host, version:'', uptime:0});
        return next(null, host);
      }

    }

    next();

  }.bind(this));

};

proto.finish = function(cb, err, ips) {

  var results = [];

  if(err) {
    return cb(err);
  }

  if(Array.isArray(ips)) {

    results = ips.filter(function(i) {
      return i;
    });

  }

  if(cb)
    cb();
};

proto.timesLimit = function(count, limit, iterator, callback) {

  var counter = [];

  for(var i=0; i < count; i++) {
    counter.push(i);
  }

  return async.mapLimit(counter, limit, iterator, callback);

};

function Finder(options) {

  if (!(this instanceof Finder)) {
    return new Finder(options);
  }

  //events.EventEmitter.call(this);

  util._extend(this, options || {});

  this.ip = ip.address();
  this.subnet = this.ip.substr(0, this.ip.lastIndexOf('.')) || false;
}

export default Finder
