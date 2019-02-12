#!/usr/local/bin/node
var schedule = require("node-schedule");
var async = require('async');
require('date-utils');
/**
 * 年月日と加算日からn日後、n日前を求める関数
 * year 年
 * month 月
 * day 日
 * addDays 加算日。マイナス指定でn日前も設定可能
 */
function computeDate(year, month, day, addDays) {
	var now = new Date();
	return day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + addDays).toFormat('YYYY-MM-DD');
}

function yesterday(){
var now = new Date();
var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toFormat('YYYY-MM-DD');
	return yesterday;
}

console.log('oneDayCron start');
console.log(Date()+' '+'/home/pi/src/ITBOX/oneDayLog.js '+yesterday()+'-r');

execSync = require('child_process').execSync;
var d=new Date().toFormat('YYYY-MM-DD');
result =  execSync('/home/pi/src/ITBOX/oneDayLog.js '+yesterday()+' -r');
console.log('oneDayCron done');
