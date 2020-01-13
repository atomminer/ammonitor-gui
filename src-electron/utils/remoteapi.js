"use strict";

export function getJsonCmdTask(host, cmd) {
  var a = host;
  if(a.indexOf(':') == -1)
    a += ':9123';
  a = 'http://' + a + '/';
  return function(callback) {
      require('request').post({
        headers: {'content-type' : 'application/json'},
        method:  'POST',
        url:     a,
        body:    JSON.stringify({id: 1,cmd: cmd,params: []}),
      }, function(error, response, body){
       if (!error && response.statusCode == 200)
            callback(null, {cmd:cmd,data:JSON.parse(body)});
        else
          callback(true, {});
    });
  }
}

// no axios!!! damn thing takes 5-7 seconds(!!!) to pull data on localhost
// export async function updateMinerFromAddr(addr, cb) {
// 	console.log('updateMinerFromAddr');
// 	var a = addr;
// 	if(!a) {
// 		console.log('err !a');
// 		if(cb) cb({addr: addr, alive: false, status: {}, devlist: [], loglist: []});
// 		return;
// 	}

// 	if(a.indexOf(':') == -1)
// 		a += ':9123';
// 	a = 'http://' + a + '/';

// 	// axios.post(a, {
//  //    id: 1,
//  //    cmd: 'status',
//  //    params: []
//  //  })
//  //  .then((res) => {
//  //  	console.log('done');
//  //  	if(cb) cb({addr: addr, alive: true, status: res.data.response[0], devlist: {}, loglist: {}});
//  //  })
//  //  .catch((error) => {
//  //  	if(cb) cb({addr: addr, alive: false, status: {}, devlist: [], loglist: []});
//  //  	console.log(`updateMinerFromAddr failed for ${addr} with ${error}`);
//  //  })
// }