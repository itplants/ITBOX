#!/usr/local/bin/node
var async = require('async');
var fileName='../data/tempController.log';
var text='';
var nxp=0;
var dir='';
require('date-utils');
var date=new Date().toFormat('YYYY-MM-DD')+'';

// readLog.js logfile

if(process.argv.length == 3 ){
	if(process.argv[2][0] !== '-')
		fileName=process.argv[2];
}

if(fileName.indexOf('/data/')<0 ) fileName = '../data/'+fileName;

var fsc = require('fs-sync');

var fs = require('fs');
var ls=fs.readdirSync('./data/');
var todayfiles=[];

for(i=0;i<ls.length-1;i++){
	if(ls[i].indexOf(date)>=0 && ls[i].indexOf('.log')>=0) todayfiles.push('./data/'+ls[i]);
}
//todayfiles.push('./data/tempController.log');
//console.error(todayfiles);
//process.exit();

for(f=0;f<todayfiles.length;f++){
var sline=false;
nxp=0;

fileName=todayfiles[f];

var tx=fs.readFileSync(fileName, 'utf8');
    var text=tx.toString().split('\n');
// parse
	for(j=0;j<text.length;j++){
	//console.log('tx['+j+']: '+text[j]);

	if( text[j].indexOf('-------')>=0){
	sline=true;
	date=text[j+1];
	j++;
	continue;
	}

	//console.log('sline: '+sline);
	if( sline === true ){
		if( text[j].indexOf('currentTemp')>=0){
		//console.log('temp: '+tx[j]);
		continue;
		}
		if( text[j].indexOf('currentLux')>=0){
		//console.log('currentLux: '+tx[j]);
		c = (text[j].split('currentLux=')[1]);
		if(!isFinite(c)) c = 0;
		continue;
		}
		if( text[j].indexOf('PWM')>=0){
		//console.log('PWM: '+tx[j]);
		p = (text[j].split(' '));
		if( text[j].indexOf('hot')>=0){
		//console.log('hot: '+tx[j]);
		dir = (text[j].split(' '));
		continue;
		}
		if( text[j].indexOf('cool')>=0){
		//console.log('cool: '+tx[j]);
		dir = (text[j].split(' '));
		continue;
		}
		continue;
		}
		if( text[j].indexOf('BME280')>=0){
		//console.log('BME280: '+tx[j]);
		d = (text[j].split(' '));
		continue;
		}
		if( text[j].indexOf('freezedFan')>=0){
		//console.log('freezedFan: '+tx[j]);
		g = (text[j].split(' '));
		continue;
		}
		if( text[j].indexOf('Mratio')>=0){
		//console.log('Mratio: '+tx[j]);
		t = (text[j].split(' '));
		sline=false;
	// output
    	dr=0.0
	if(dir){
    	if(dir[1].indexOf('hot'))
        	dr = 1.0
    	else
        	dr = -1.0
		
    console.log( date+','+d[5]+','+d[3]+','+d[7]+','+ (dr*parseFloat(p[1])/10.0)+','+g[1]+','+t[5]+','+t[3]+','+c);
		}// output end

			}
		}// slice
	}	
}

  console.log('EOF');
