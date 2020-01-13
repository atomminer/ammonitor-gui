const spawn = require('child_process').spawn;
const os = require('os').platform();

export function arp(ip, cb) {
  if(os.indexOf('linux') === 0)
    linux(ip, cb);
  else if(os.indexOf('win') === 0)
    windows(ip, cb);
  else if(os.indexOf('darwin') === 0)
    mac(ip, cb);
};

function linux(ip, cb) {
  var arp = spawn('arp', [ '-n', ip ]),
      buffer = '';

  if(! arp)
    return cb('arp failed');

  arp.stdout.on('data', function (data) {
    buffer += data;
  });

  arp.on('close', function(code) {
    var lines = buffer.split('\n');

    if (code !== 0)
      return cb('arp failed');

    if (lines.length >= 2) {
      var chunks = lines[1].split(' ').filter(String);
      return cb(null, chunks[2]);
    }

    cb(null, false);

  });

};

function windows(ip, cb) {
  var arp = spawn('arp', ['-a', ip]),
      buffer = '';

  if(! arp)
    return cb('arp failed');

  arp.stdout.on('data', function(data) {
    buffer += data;
  });

  arp.on('close', function(code) {
    var lines = buffer.split('\r\n');
    if (code !== 0)
      return cb('arp failed');

    for(var i = 3; i < lines.length; i++) {
      var chunks = lines[i].split(' ').filter(String);

      if (chunks[0] === ip)
        return cb(null, chunks[1].replace(/-/g, ':'));
    }

    cb(null, false);

  });
};

function mac(ip, cb) {
  var arp = spawn('arp', ['-n', ip]),
      buffer = '';

  if(! arp)
    return cb('arp failed');

  arp.stdout.on('data', function(data) {
    buffer += data;
  });

  arp.on('close', function(code) {
    var chunks = buffer.split(' ').filter(String);

    if (code !== 0)
      return cb('arp failed');

    if (chunks[3] !== 'no') {
      var mac = chunks[3].replace(/^0:/g, '00:').replace(/:0:/g, ':00:').replace(/:0$/g, ':00');
      return cb(null, mac);
    }

    cb(null, false);
  });

};

//export default arp;