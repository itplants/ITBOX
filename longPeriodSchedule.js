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

var testsw=true;
var fwritesw=true;
var logsw=true;
var Tscale=1;// min
var nSchedule=0;// msec

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
        if(logsw) fs.appendFileSync(logFileName, util.format( d+'\n'));
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

  var wtextdata = textdata[0]+' '+textdata[1]+' start 0:0\n'+PIDparameterSet;

  if(testsw) console.log('writeConfigFile end of writeConfigFile :\n'+wtextdata);

   if(fwritesw) fs.writeFileSync( configFileName , wtextdata );

  if(testsw) console.log("--------------");
} 

var delayTime=new Array();
var targetTemp=new Array();
var periodTime=new Array();
var intervalTime=0;

var btime=0;
var hour=0;
var min=0;

function wbf(m,job){
if(testsw) 
console.log('wbf m= '+m+' intervalTime= '+intervalTime+' targetTemp['+m+']= '+targetTemp[m]);

        writeConfigFile(targetTemp[m]);
}

var jobSchedule=null;// 初期値は、nullを指定しておかなければならない。
var currentNo=0;// 現在の設定温度

function doJob(){
	wbf(currentNo);
	// set next schedule
	var now=new Date();
if(testsw) console.log('doJob1 now time= '+now+' periodTime='+periodTime[currentNo]);
	now.setMinutes(now.getMinutes() + periodTime[currentNo]);

if(testsw) console.log('doJob2 currentNo= '+currentNo+' nextTime='
	+now.toLocaleString()+' periodTime='+periodTime[currentNo]
	+' targetTemp='+targetTemp[currentNo]);

	currentNo = (currentNo+1) % nSchedule;

	// sec まで指定
	var fireData= now.getSeconds()+' '+now.getMinutes()+' '+now.getHours()+' '+now.getDate()+' '+(now.getMonth()+1)+' *';

	// sec まで指定しない
	//var fireData= '* '+now.getMinutes()+' '+now.getHours()+' '+now.getDate()+' '+(now.getMonth()+1)+' *';
//if(testsw) console.log('doJob fireData= '+fireData);

	jobSchedule.cancel();
	jobSchedule=schedule.scheduleJob(fireData,function(){
		doJob();
	});

	// jobSchedule=setTimeout(function{doJob()},periodTime[currentNo]);

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
        if(testsw) console.log('data='+data);
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

	if(jobSchedule) jobSchedule.cancel();
//
	current_time = '';
	//console.log('targetTempArray.length='+targetTempArray.length);
 	n=targetTempArray.length;

	hour=min=0;
	// calc intervalTime: add all setting times as one period
	nSchedule=n;
//if(testsw) console.log('Tscale='+Tscale);
 	for(var i=0;i<n;i++){
	// targetTemp 37.0  period 0:0
	if(targetTempArray[i].split(' ')[2].indexOf('period') < 0) continue;	
	if(testsw) console.log('targetTempArray['+i+']='+targetTempArray[i]);
	targetTemp[i]=targetTempArray[i].split(' ')[1];
	btime=targetTempArray[i].split(' ')[3];
	//if(testsw) console.log('btime='+btime);
	h=parseInt(btime.split(':')[0]);
	m=parseInt(btime.split(':')[1]);
	periodTime[i]=Tscale*(m+60*h);
if(testsw) console.log('periodTime['+i+']='+periodTime[i]);
	hour+=h;
	min+=m;
	}
	intervalTime=Tscale*(min+60*hour);
if(testsw) console.log('hour;min='+hour+':'+min+' intervalTime='+intervalTime);

	if(testsw) console.log('n='+n);

	hour=0; min=0;
 	for(j=0;j<n;j++){
	// targetTemp 37.0  period 0:0
	targetTemp[j]=targetTempArray[j].split(' ')[1];
	// targetTemp 37.0
	targetTemp[j]=targetTempArray[j].split(' ')[0]+' '+targetTemp[j];

	if(testsw) console.log('targetTemp['+j+']= '+targetTemp[j]);

	delayTime[j]=Tscale*(min+60*hour);// min
if(testsw) console.log('Setting Time  hour:min='+hour+':'+min+' delayTime['+j+']= '+delayTime[j]+' periodTime['+j+']= '+periodTime[j]);

	// hour
	// targetTemp 37.0  period 0:0
	var stime=targetTempArray[j].split(' ')[3].split(':');
	hour+=parseInt(stime[0]);// hour 
	// min
	min+=parseInt(stime[1]);// minute
if(testsw) console.log('setTime['+j+']='+stime);
	}// next j 

	// do first write
	var now=new Date();
	currentNo=0;
	now.setSeconds(now.getSeconds() + 3);
	// after 3sec doJob
	if(testsw) console.log('job entry nextTime= '+now.toLocaleString());
	jobSchedule=schedule.scheduleJob(now,function(){doJob()});
	//jobSchedule=setTimeout(function(){doJob()},0);

	// need for awake node-schedule or setInterval timer over 30min.
	setInterval(function(){
	//	console.log('interval:'+(new Date()));
	},1000*60*10*Tscale);
}

//////////////

startStopDaemon(function() {
////
    process.argv.forEach(function(val, index, array) {
    	if(index >= 2){
        if(val=='-t'){
		testsw=true;// printout debug info
			}
        if(val=='-s'){
		Tscale=parseFloat(array[index+1]);// for fast test
			}
        if(val=='-nw'){
		fwritesw=false;// no write to saveLongPeriodSchedule.txt
			}
		}
        if(val=='-nl'){
		logsw=false;// no write to longPeriodSchedule.log
			}
	});
	
	changeConfigFile();
});
