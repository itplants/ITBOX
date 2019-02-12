#!/usr/local/bin/node
var schedule = require("node-schedule");
var async = require('async');
require('date-utils');

var startStopDaemon = require('start-stop-daemon');

startStopDaemon(function(){

console.log('manyDS18B20get start');

var job = schedule.scheduleJob( '0 * * * * *' , function(){
	execSync = require('child_process').execSync;
	var d=new Date().toFormat('YYYY-MM-DD');
        result =  execSync('/home/pi/src/ITBOX/manyDS18B20get.py');
	console.log('manyDS18B20getCron done'+d);
	});
});
