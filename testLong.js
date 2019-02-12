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
var logsw=1;
var Tscale=1000;

var targetTempArray=new Array();
var PIDparameterSet='';

const longPeriodFileName='./saveLongPeriodSchedule.txt';
const configFileName='/home/coder/coder-dist/coder-base/config/saveTempController.txt';

// if no logFile need then const logFileName=''
const logFileName='/home/pi/src/ITBOX/longPeriodScheduleTEST.log';

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
        if(logFileName && logsw) fs.appendFileSync(logFileName, util.format( d+'\n'));
        if(testsw) process.stdout.write(util.format( d+'\n'));
}

var fsWatch='';

var slock=false;
// 対象のファイルが変更された後の処理
function handlerWatch(){

if(slock==false){
if(testsw) console.log('handlerWatch: '+getTimeDate());
slock=true;
 changeConfigFile();
slock=false;

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
	}
}

/*
process.on('SIGINT', function() {
console.log('Got SIGINT.');
if(slock==false){
	if(testsw) console.log('handlerWatch: '+getTimeDate());
		slock=true;
		 changeConfigFile();
		slock=false;
	}
});
*/


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

//   fs.writeFileSync( configFileName , wtextdata );

  if(testsw) console.log("--------------");
} 

var job=new Array();
var tjob=new Array();
var delayTime=new Array();
var targetTemp=new Array();
var intervalTime=0;

var btime=0;
var hour=0;
var min=0;

function wbf(m,job){
	if(testsw) console.log('wbf= '+m+' intervalTime= '+intervalTime);
	if(testsw) console.log('wbf= '+m+' targetTemp['+m+']= '+targetTemp[m]);
	if(testsw) console.log('wbf= '+m+' PIDparameterSet='+PIDparameterSet);

        writeConfigFile(targetTemp[m]);

               return  setInterval(function waf(m,f){
                        	writeConfigFile(targetTemp[m]);
				return this;
       	 	}.bind(null,m), intervalTime);
/*
        writeConfigFile(targetTemp[m]);
        job[m]=
                setInterval(function(m){
                        	writeConfigFile(targetTemp[m]);
       	 	}, intervalTime, m)
	return job[m];
*/
}


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
	if(testsw) console.log('file watch stop');
		if(fsWatch) fsWatch.close();
		var sleep = require('sleep');
	if(testsw) console.log('sleep 1sec');
		sleep.sleep(1);
                }
        }

//data ="targetTemp 22 period 02:00\ntargetTemp 37 period 04:00\nsetPID Kp 600 Ki 0.1 Kd 0.025";
//data ="targetTemp 22 period 00:01\ntargetTemp 37 period 00:01\nsetPID Kp 600 Ki 0.1 Kd 0.025";

    	// エラー処理
    	if( err ) {
        	console.log( 'ファイルが存在しません。1' );
       		process.exit(1);
    	}

        var t = data.toString().split('\n');
	if(testsw) console.log('data='+t);

    //  no data then exit
	if(data.length==0){
        	console.log( 'no data' );
		return;
	}

	if(t[0].indexOf('targetTemp')<0){
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

if(testsw) console.log('cancel job start');
if(testsw) console.log('job.length='+job.length+' tjob.length='+tjob.length);

	while(tjob.length > 0) clearInterval(tjob.shift());
	while(job.length  > 0) clearTimeout(job.shift());
	

if(testsw) console.log('job.length='+job.length+' tjob.length='+tjob.length);
if(testsw) console.log('cancel job end');

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
	hour+=parseInt(btime.split(':')[0]);
	min+=parseInt(btime.split(':')[1]);
//if(testsw) console.log('['+i+'] '+btime+' hour='+hour+' min='+min+' n='+n);
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


	tjob.push(
	setTimeout(function(j,job){
	if(testsw) console.log('tjob entry= '+j+' delayTime= '+delayTime[j]);
	//if(testsw) console.log('wbf entry= '+j+' intervalTime= '+intervalTime);
		job[j]=wbf(j,job);
		return job[j];
	},delayTime[j],j,job)
	);
if(testsw) console.log('tjob='+tjob[j]+' job['+j+']= '+job[j]);


	// hour
	// targetTemp 37.0  period 0:0
	var stime=targetTempArray[j].split(' ')[3].split(':');
	hour+=parseInt(stime[0]);// hour 
	// min
	min+=parseInt(stime[1]);// minute
if(testsw) console.log('setTime['+j+']='+stime);
	}// next j 

	if(testsw) console.log('changeConfigFile end');
}

//////////////

startStopDaemon(function() {
////
    process.argv.forEach(function(val, index, array) {
    	if(index >= 2){
        if(val=='-t'){
		testsw=1;
			}
        if(val=='-nl'){
		logsw=0;
			}
        if(val=='-s'){
		console.log('array= '+array);
		console.log('index= '+index);
		Tscale=parseFloat(array[index+1]);
		console.log('Tscale= '+Tscale);
			}
		}
	});
	
if(testsw)   console.log('process.argv='+process.argv);
if(testsw)   console.log('startStopDaemon');
	changeConfigFile();
if(testsw)     console.log('startStopDaemon finish.');
});
