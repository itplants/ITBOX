#!/usr/local/bin/node

var fs = require('fs');
var txt=fs.readFileSync('/home/coder/coder-dist/coder-base/config/saveTempController.txt').toString();
txt=txt.split('\n');

//console.log(process.argv.length);
//console.log(txt);

if(process.argv.length === 5){
var kp=process.argv[2];
var ki=process.argv[3];
var kd=process.argv[4];

//console.log(txt);

var sw=false;
	for(i=0;i<txt.length;i++){
	if(txt[i].split(' ')[0].indexOf('setPID')>=0 ){
	console.log(txt[i].split(' ')[0]+' '+txt[i].split(' ')[1]);
	txt[i]='setPID Kp '+kp+' Ki '+ki+' Kd '+kd;
	sw=true;
		}
	}
	if(sw==false) txt[txt.length-1]='setPID Kp '+kp+' Ki '+ki+' Kd '+kd;
	txt = txt.join('\n');
fs.writeFileSync('/home/coder/coder-dist/coder-base/config/saveTempController.txt',txt);
//	console.log(txt);
} else {
	//txt = txt.join('\n');
	//console.log(txt);
	for(i=0;i<txt.length;i++){
	if(txt[i].split(' ')[0].indexOf('setPID')>=0 ){
		console.log(txt[i]);
		}
	}
}

