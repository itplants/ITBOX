#!/usr/local/bin/node
/*
 * longPeriodShcdule
 * change temp schedule of period 24h to perion infinity.
 *
 */

var startStopDaemon = require('start-stop-daemon');
var schedule = require("node-schedule");

const fs = require('fs');
require('date-utils');
require('util');

var sprintf = require("sprintf-js").sprintf;

var testsw=0;
var fwritesw=1;
var Tscale=1;// sec

var targetTempArray=new Array();
var PIDparameterSet='';

const longPeriodFileName='/home/coder/coder-dist/coder-base/LongPeriodSchedule/saveLongPeriodSchedule.txt';
const configFileName='/home/coder/coder-dist/coder-base/config/saveTempController.txt';

// if no logFile need then const logFileName=''
const logFileName='/home/pi/src/ITBOX/longPeriodSchedule.log';

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}


function getTimeDate(){
  	var now = new Date().toLocaleString();
	return now;
 }

console.log = function(d){
        // close stream file
	var util = require('util');
        if(logFileName) fs.appendFileSync(logFileName, util.format( d+'\n'));
	if(testsw) process.stdout.write(util.format( d+'\n'));
}

// file wtch
var fsWatch='';

var slock=false;
// 対象のファイルが変更された後の処理
function handlerWatch(){

if(slock==false){
if(testsw) console.log('handlerWatch: '+getTimeDate());
slock=true;
	 changeConfigFile();
/*
var childProcess = require('child_process');
const exec = require('child_process').exec;
exec('sudo systemctl restart longPeriodSchedule', (err, stdout, stderr) => {
  	if (err) { console.log(err); }
  	console.log(stdout);
if(testsw) console.log('restart process success.'+getTimeDate());
	process.exit();
	});
*/
slock=false;
	}
}

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}


function writeConfigFile(temp){
// targetTemp 37 period 12:00
// setPID Kp 600 Ki 0.1 Kd 0.025
//if(testsw) console.log('writeConfigFile temp:'+temp);
//if(testsw) console.log('writeConfigFile PIDparameterSet:'+PIDparameterSet);

 if(!temp) return;
  var textdata=temp.split(' ');
  if(testsw) console.log("--------------");
  if(testsw) console.log(getTimeDate());
  if(testsw) console.log("writeConfigFile "+textdata);

  var wtextdata = textdata[0]+' '+textdata[1]+' start 0:0\n'+PIDparameterSet;

  if(testsw) console.log('writeConfigFile end of writeConfigFile :\n'+wtextdata);

   if(fwritesw) fs.writeFileSync( configFileName , wtextdata );

  if(testsw) console.log("--------------");
} 

var delayTime=new Array();
var targetTemp=new Array();
var intervalTime=0;
var intervalT=new Array();

var btime=0;
var hour=0;
var min=0;

function changeConfigFile(){
// targetTempArray
// PIDparameterSet
// configFileName
//
var data, err;
if(testsw) console.log('changeConfigFile '+longPeriodFileName);

	data='';
        while(data==''){
        if( isExistFile(longPeriodFileName)){
// ファイル更新チェックプロセスの開始
        if(testsw) console.log('file load= '+longPeriodFileName);
                data=fs.readFileSync(longPeriodFileName,'utf-8');
        if(testsw) console.log('file watch start');
                fsWatch=fs.watch( longPeriodFileName, handlerWatch.bind(this) );
                break;
                } else {
                if(fsWatch){
        	if(testsw) console.log('file watch stop and sleep 1sec period');
		 fsWatch.close();
		 fsWatch=false;
		}
                var sleep = require('sleep');
        //if(testsw) console.log('sleep 1sec');
                sleep.sleep(1);
                }
        }

    	// エラー処理
    	if( err ) {
        	console.log( 'ファイルが存在しません。1' );
       		process.exit(1);
    	}

	// illeguler data file
        var t = data.toString().split('\n');
	if(t[0].indexOf('targetTemp')<0){
        if(testsw){
		 console.log('no data: t='+t);
		 console.log('no data: t[0]='+t[0]);
		}
 		return;
 	}
	// illeguler data file
	if(t[0].split(' ').length != 4){
        if(testsw){
		 console.log('t='+t);
		 console.log('t.length: '+t.length);
		 console.log('t[0].length: '+t[0].split(' ').length);
		}
 		return;
 	}

    	//  no data then exit
	if(data.length==0){
        	console.log( 'no data' );
		return;
	}

	targetTempArray=new Array();

    // 結果表示
        for(i=0;i<t.length;i++){
        if( t[i].split(' ')[0]==='targetTemp') targetTempArray.push(t[i]);
        if( t[i].split(' ')[0]==='setPID') PIDparameterSet=t[i];
        }

	if(testsw) console.log('targetTempArray='+targetTempArray);
	if(testsw) console.log('PIDparameterSet='+PIDparameterSet);

//
	current_time = '';
	//console.log('targetTempArray.length='+targetTempArray.length);
 	n=targetTempArray.length;

	hour=min=0;
	// calc intervalTime: add all setting times as one period
 	for(var i=0;i<n;i++){
	// targetTemp 37.0  period 0:0
	if(targetTempArray[i].split(' ')[2].indexOf('period') < 0) continue;	
	if(testsw) console.log('targetTempArray['+i+']='+targetTempArray[i]);
	targetTemp[i]=targetTempArray[i].split(' ')[1];
	btime=targetTempArray[i].split(' ')[3];
	if(testsw) console.log('btime='+btime);
	var h =parseInt(btime.split(':')[0]);
	var m =parseInt(btime.split(':')[1]);
//if(testsw) console.log('['+i+'] '+btime+' hour='+hour+' min='+min+' n='+n);
	hour += h;
	min  += m;
	intervalT.push(Tscale*60*(m+60*h));
	}

	//intervalTime=1000*60*(min+60*hour);
	intervalTime=Tscale*60*(min+60*hour);
if(testsw) console.log('hour;min='+hour+':'+min+' intervalTime='+intervalTime);

	if(testsw) console.log('n='+n);

	hour=0; min=0;
 	for(j=0;j<n;j++){
	// targetTemp 37.0  period 0:0
	targetTemp[j]=targetTempArray[j].split(' ')[1];
	// targetTemp 37.0
	targetTemp[j]=targetTempArray[j].split(' ')[0]+' '+targetTemp[j];

	if(testsw) console.log('targetTemp['+j+']= '+targetTemp[j]);

	//delayTime[j]=1000*60*(min+60*hour);// msec
	delayTime[j]=Tscale*60*(min+60*hour);// msec
if(testsw) console.log('Setting Time  hour:min='+hour+':'+min+' delayTime['+j+']= '+delayTime[j]);

	// hour
	// targetTemp 37.0  period 0:0
	var stime=targetTempArray[j].split(' ')[3].split(':');
	hour+=parseInt(stime[0]);// hour 
	// min
	min+=parseInt(stime[1]);// minute
if(testsw) console.log('setTime['+j+']='+stime);
	}// next j 

if(testsw) console.log('intervalT= '+intervalT);
        var sleep = require('sleep');
	var m=0;
	while(1){
  if(testsw) console.log('targetTemp['+m+']= '+targetTemp[m]);
  var textdata=targetTemp[m].split(' ');

  var wtextdata = textdata[0]+' '+textdata[1]+' start 0:0\n'+PIDparameterSet;
   if(fwritesw) fs.writeFileSync( configFileName , wtextdata );

if(testsw) console.log('intervalT['+m+']= '+intervalT[m]);
        sleep.sleep(intervalT[m]);
	m++;
	m = m % n;
	}

	if(testsw) console.log('changeConfigFile end');
}

//////////////

startStopDaemon(function() {
////
    process.argv.forEach(function(val, index, array) {
    	if(index >= 2){
        if(val=='-t'){
		testsw=1;// printout debug info
			}
        if(val=='-s'){
		Tscale=parseFloat(array[index+1]);// for fast test
			}
        if(val=='-nw'){
		fwritesw=0;// no write to saveLongPeriodSchedule.txt
			}
		}
	});
	
if(testsw)   console.log('process.argv='+process.argv);
if(testsw)   console.log('startStopDaemon');
	changeConfigFile();
if(testsw)     console.log('startStopDaemon finish.');
});
