#!/usr/local/bin/node
var async = require('async');
var fileName='';
var resetFlag=false;
var text='';
var tx=new Array();
var lineNo=0;
var nxpstep=9;
var nxp=0;
var dir=1.0;
var ulinkSW=false;
var ftxt='';
require('date-utils');

//console.log('process.argv.length='+process.argv.length);
// oneDayLog.js YYYY-MM-DD [-r]
	dt=new Date();
	fileName=dt.toFormat('YYYY-MM-DD');
//console.log('process.argv.length='+process.argv.length);
if(process.argv.length == 3 ){
	//console.log('process.argv[2][0]:|'+process.argv[2][0]+'|');
	if(process.argv[2][0] !== '-') fileName=process.argv[2];
	else {
	//console.log('ulink');
	if(process.argv[2] === '-r') ulinkSW=true; 
	}
} else if(process.argv.length == 4 ){
	fileName=process.argv[2];
	if(process.argv[3] == '-r') ulinkSW=true; 
} else {
//	console.log(process.argv[1]+' YYYY-MM-DD [-r rm file option]');
}

//console.log('fileName='+fileName);

var fsc = require('fs-sync');

//2007年8月10日の30日後の日付を取得
//2007-9-9が表示されます
var date='';

date=fileName;
var csvFileName='./data/tempController'+fileName+'.csv';

if(fileName.indexOf('-') < 0 ){
	console.log('file error:'+fileName);
	process.exit();
}

var fs = require('fs');
var ls=fs.readdirSync('./data/');
//console.log('ls='+ls);
var todayfiles=[];
for(i=0;i<ls.length;i++){
	if(ls[i].indexOf(date)>=0 && ls[i].indexOf('.log')>=0){
         console.log(ls[i]);
	 todayfiles.push('./data/'+ls[i]);
	}
}
//todayfiles.push('./data/tempController.log');
//console.log('todayfiles='+todayfiles);
//console.log('ulinkSW='+ulinkSW);

for(f=0;f<todayfiles.length;f++){
var sline=false;
nxp=0;

fileName=todayfiles[f];

//console.error(fileName);
var execSync = require('child_process').execSync;
        result =  execSync('/usr/bin/wc -l '+fileName);
        tmp=result.toString().split(' ')[0];
var filemax=parseInt(tmp)-1;
	nxpstep=filemax;
    
var tx=fs.readFileSync(fileName, 'utf8');
    var text=tx.toString().split('\n');
// parse

if((text.length-1)>=(filemax)){
	for(j=nxp;j<nxpstep;j++){
	//console.log('tx['+j+']: '+text[j]);

	if( text[j].indexOf('-------')>=0){
	sline=true;
	//console.log('sline: '+sline);
	//console.log('date: '+tx[j+1]);
	for(n=0;n<5;n++){
	if( text[j+1].indexOf('/')>=0){
		date=text[j+1];
		j++;
		break;
		}
	    }
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
		dir = 1.0;
		continue;
		}
		if( text[j].indexOf('cool')>=0){
		//console.log('cool: '+tx[j]);
		dir = -1.0;
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
	if(isNaN(d[5])) d[5]=0;
	if(isNaN(d[3])) d[3]=0;
	if(isNaN(d[7])) d[7]=0;
	if(isNaN(p[1])) p[1]=0;
	if(isNaN(g[1])) g[1]=0;
	if(isNaN(t[5])) t[5]=0;
	if(isNaN(t[3])) t[3]=0;
	var txt=date+','+d[5]+','+d[3]+','+d[7]+','+ (dir*parseFloat(p[1])/10.0)+','+g[1]+','+t[5]+','+t[3]+','+c;
	console.log(txt);
	ftxt = ftxt+txt+'\n';
		}// output end

		}// slice
	}// next j
	//nxp += nxpstep;
	//i++;
		}

	if(ulinkSW){
		 fs.unlink(fileName);
		 console.log(fileName+' is deleted');
		}

	}// next f

	console.log('EOF');
  	ftxt = ftxt+'EOF';
	if(ftxt.length > 3 )
  		fs.writeFileSync(csvFileName,ftxt,'utf8');
