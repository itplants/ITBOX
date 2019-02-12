#!/usr/local/bin/node

var fs = require('fs-sync');
fs.defaultEncoding = 'utf-8'
var logFile='/home/coder/coder-dist/coder-base/data/tempController.log';

if(fs.exists(logFile)){
var txt=fs.read(logFile).toString();
if(txt.length>0){
//console.log(txt);

var date='';
var now='';

txt=txt.split('\n');
	for(i=txt.length-1;i>txt.length-16;i--){
	if(txt[i].split(' ')[0].indexOf('2')==0 ){
//	console.log(txt[i].split(' ')[0]+' '+txt[i].split(' ')[1]);
	date=txt[i].split(' ')[0]+' '+txt[i].split(' ')[1];
		}
	}
	now = new Date();
//	console.log('now '+now);
//	console.log('file '+date);

	dif=( Date.parse(now) - Date.parse(date))/1000;
	console.log( 'difference '+dif+' sec');
	process.exit();
}
} 
	console.log( 'difference 10000 sec');
	process.exit();

