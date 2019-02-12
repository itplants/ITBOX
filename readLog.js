#!/usr/local/bin/node
var async = require('async');
var fileName='../data/tempController.log';
var resetFlag=false;
var text='';
var tx=new Array();
var lineNo=0;
var i = 0;
var j = 0;
var nxpstep=9;
var nxp=0;
var dir='';

//console.log('process.argv.length :'+process.argv.length);
//console.log('resetFlag :'+resetFlag+' fileName:'+fileName+' nxp:'+nxp+' nxpstep:'+nxpstep);
// readLog.js [-f] logfile [-s] start [-reset] [-l] length

if(process.argv.length >= 3 ){
	//console.log('process.argv[2][0]:|'+process.argv[2][0]+'|');
	if(process.argv[2][0] !== '-')
		fileName=process.argv[2];
}
if(process.argv.length === 4){
	if(process.argv[2][0] !== '-')
		fileName=process.argv[2];
	if(process.argv[3][0] !== '-')
		nxp=parseInt(process.argv[3]);
}
if(process.argv.length === 5){
	if(process.argv[2][0] !== '-')
		fileName=process.argv[2];
	if(process.argv[3][0] !== '-')
		nxp=parseInt(process.argv[3]);
	if(process.argv[4][0] !== '-')
		nxpstep=parseInt(process.argv[4]);
}
process.argv.forEach(function(val, index, array) {
	if(val==='-r') resetFlag=true;
	if(val==='-s') {
			resetFlag=true; 
			nxp=parseInt(array[index+1]);
			//console.log('resetFlag:'+resetFlag);
			};
	if(val==='-f') fileName=array[index+1];
	if(val==='-l') nxpstep=parseInt(array[index+1]);
});

if(fileName.indexOf('/data/')<0 ) fileName = '../data/'+fileName;

var fs = require('fs');

var sline=false;
//console.log('resetFlag :'+resetFlag+' fileName:'+fileName+' nxp:'+nxp+' nxpstep:'+nxpstep);
//console.log('nxp :'+nxp+' nxpstep:'+nxpstep);

var fsc = require('fs-sync');

//console.log('resetFlag :'+resetFlag+' fileName:'+fileName+' nxp:'+nxp+' nxpstep:'+nxpstep);
//console.log('nxp :'+nxp+' nxpstep:'+nxpstep);

    var execSync = require('child_process').execSync;
        result =  execSync('/usr/bin/wc -l '+fileName);
        tmp=result.toString().split(' ')[0];
    var filemax=parseInt(tmp)-1;
	nxpstep=filemax;
    
    readline = require('readline'),
    rs = fs.ReadStream(fileName),
    rl = readline.createInterface({'input': rs, 'output': {}});

rl.on('line', function (line) {
	var t=line.trim();
	tx.push(t);

// parse
	if((tx.length-1)>=(filemax)){
	for(j=nxp;j<nxpstep;j++){
	//console.log('tx['+j+']: '+tx[j]);

	if( tx[j].indexOf('-------')>=0){
	sline=true;
	//console.log('sline: '+sline);
	//console.log('date: '+tx[j+1]);
	date=tx[j+1];
	j++;	
	continue;
	}

	//console.log('sline: '+sline);
	if( sline === true ){
		if( tx[j].indexOf('currentTemp')>=0){
		//console.log('temp: '+tx[j]);
		continue;
		}
		if( tx[j].indexOf('currentLux')>=0){
		//console.log('currentLux: '+tx[j]);
		c = (tx[j].split('currentLux=')[1]);
		if(!isFinite(c)) c = 0;
		continue;
		}
		if( tx[j].indexOf('PWM')>=0){
		//console.log('PWM: '+tx[j]);
		p = (tx[j].split(' '));
		if( tx[j].indexOf('hot')>=0){
		//console.log('hot: '+tx[j]);
		dir = (tx[j].split(' '));
		continue;
		}
		if( tx[j].indexOf('cool')>=0){
		//console.log('cool: '+tx[j]);
		dir = (tx[j].split(' '));
		continue;
		}
		}

		if( tx[j].indexOf('BME280')>=0){
		//console.log('BME280: '+tx[j]);
		d = (tx[j].split(' '));
		continue;
		}
		if( tx[j].indexOf('freezedFan')>=0){
		//console.log('freezedFan: '+tx[j]);
		g = (tx[j].split(' '));
		continue;
		}
		if( tx[j].indexOf('Mratio')>=0){
		//console.log('Mratio: '+tx[j]);
		t = (tx[j].split(' '));
		sline=false;
	// output
    	dr=0.0
	if(dir){
    	if(dir[1].indexOf('hot')){
        	dr = 1.0;}
    	else {
        	dr = -1.0;
		}
		
    console.log( date+','+d[5]+','+d[3]+','+d[7]+','+ (dr*parseFloat(p[1])/10.0)+','+g[1]+','+t[5]+','+t[3]+','+c);
		}// output end

		}
	}

	}	
	nxp += nxpstep;
	}

	i++;
});

rl.resume();

rs.on('end', function() {
  console.log('EOF');
  process.exit();
});


setInterval(function() {
//  console.log('WAIT');
},10);
