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
var logsw=0;
var writesw=0;

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

if( isExistFile(longPeriodFileName) == false ){
	process.exit();
}

function getTimeDate(){
  	var now = new Date().toLocaleString();
	//now = ('0' + now).slice(-2);
	return now;
 }

console.log = function(d){
        // close stream file
	var util = require('util');
        if(logsw  && logFileName) fs.appendFileSync(logFileName, util.format( d+'\n'));
	else  console.error(util.format( d ));
}


// ファイル更新チェックプロセスの開始
    fs.watch( longPeriodFileName, handlerWatch.bind(this) );

var slock=false;
// 対象のファイルが変更された後の処理
function handlerWatch(){
changeConfigFile();
/*
if(slock==false){
if(testsw) console.log('handlerWatch: '+getTimeDate());
slock=true;
var childProcess = require('child_process');
const exec = require('child_process').exec;
exec('sudo systemctl restart longPeriodSchedule', (err, stdout, stderr) => {
  	if (err) { console.log(err); }
  	console.log(stdout);
if(testsw) console.log('restart process success.'+getTimeDate());
	process.exit();
	});
	}
*/
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
if(testsw) console.log('writeConfigFile temp:'+temp);
if(testsw) console.log('writeConfigFile PIDparameterSet:'+PIDparameterSet);

 if(!temp) return;
  var textdata=temp.split(' ');
  if(testsw) console.log("--------------");
  if(testsw) console.log(getTimeDate());
  if(testsw) console.log("writeConfigFile "+textdata);

  var wtextdata = textdata[0]+' '+textdata[1]+' start 0:0\n'+PIDparameterSet;

  if(testsw) console.log('writeConfigFile end of writeConfigFile :\n'+wtextdata);

  if(writesw) fs.writeFileSync( configFileName , wtextdata );

  if(testsw) console.log("--------------");
} 

var job=new Array();
var tjob=new Array();
var delayTime=new Array();
var targetTemp=new Array();
var j=0;
var intervalTime=0;

var btime=0;
var hour=0;
var min=0;

function wbf(m){
	if(testsw) console.log('wbf= '+m+' intervalTime= '+intervalTime);
	if(testsw) console.log('wbf= '+m+' targetTemp['+m+']= '+targetTemp[m]);
	if(testsw) console.log('wbf= '+m+' PIDparameterSet='+PIDparameterSet);

        job.push(
                setInterval((function waf(m){
if(testsw) console.log('waf= '+m+' intervalTime= '+intervalTime);
if(testsw) console.log('waf= '+m+' targetTemp['+m+']= '+targetTemp[m]);
                                writeConfigFile(targetTemp[m]);
                                return  waf;
               }.bind(null,m)().bind(null,m)).bind(null,m), intervalTime)
        );


/* 初回実行されるし、mもbindされる。 2回目から実行されない?*/
/*
	setInterval((function waf(m){
if(testsw) console.log('waf= '+m+' intervalTime= '+intervalTime);
if(testsw) console.log('waf= '+m+' targetTemp['+m+']= '+targetTemp[m]);
	 writeConfigFile(targetTemp[m]);
	return  waf;
	}.bind(null,m)().bind(null,m)), intervalTime)
*/

/* 初回は実行されるが、mがbindされない
	setInterval((function waf(m){
	 writeConfigFile(targetTemp[m]);
	return  waf;
	}.bind(null,m)()), intervalTime)

	   初回は実行されない
	setInterval(function waf(m){
	 writeConfigFile(targetTemp[m]);
	}.bind(null,m), intervalTime)
*/

}


function changeConfigFile(){
// targetTempArray
// PIDparameterSet
// configFileName
//
var data, err;
if(testsw) console.log('changeConfigFile '+longPeriodFileName);

	fs.readFile(longPeriodFileName, function (err, data){

	//data='';
	//while(data=='')  data=fs.readFileSync(longPeriodFileName,'utf-8');

//data ="targetTemp 22 period 00:01\ntargetTemp 37 period 00:01\nsetPID Kp 600 Ki 0.1 Kd 0.025";

    	// エラー処理
    	if( err ) {
        	console.log( 'ファイルが存在しません。1' );
       		process.exit(1);
    	}

        var t = data.toString().split('\n');

    //  no data then exit
	if(data.length==0){
        	console.log( 'no data' );
		return;
	}

	targetTempArray=[];

    // 結果表示
        for(i=0;i<t.length;i++){
        if( t[i].split(' ')[0]==='targetTemp') targetTempArray.push(t[i]);
        if( t[i].split(' ')[0]==='setPID') PIDparameterSet=t[i];
        }

	if(testsw) console.log('targetTempArray='+targetTempArray);
	if(testsw) console.log('PIDparameterSet='+PIDparameterSet);

if(testsw) console.log('cancel job start');
	while(tjob.length > 0) clearInterval(tjob.shift());
	while(job.length  > 0) clearTimeout(job.shift());
if(testsw) console.log('job.length=',job.length+' tjob.length='+tjob.length);
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
	btime=targetTempArray[i].split(' ')[3].split(':');
	if(testsw) console.log('btime='+btime);
	hour+=parseInt(btime[0]);
	min+=parseInt(btime[1]);
if(testsw) console.log('['+i+'] '+btime+' hour='+hour+' min='+min+' n='+n);
	}
	intervalTime=1000*60*(min+60*hour);
	if(testsw) console.log('hour;min='+hour+':'+min+' intervalTime='+intervalTime);

	if(testsw) console.log('n='+n);

	hour=0; min=0;
 	for(j=0;j<n;j++){
	// targetTemp 37.0  period 0:0
	targetTemp[j]=targetTempArray[j].split(' ')[1];
	// targetTemp 37.0
	targetTemp[j]=targetTempArray[j].split(' ')[0]+' '+targetTemp[j];

	if(testsw) console.log('targetTemp['+j+']= '+targetTemp[j]);

	delayTime[j]=1000*60*(min+60*hour);// msec
	if(testsw) console.log('Setting Time  hour:min='+hour+':'+min+' delayTime['+j+']= '+delayTime[j]);

if(testsw) console.log('setTimeout['+j+'] START');

	tjob.push( setTimeout(function(j){
	if(testsw) console.log('tjob entry= '+j+' delayTime= '+delayTime[j]);
	
	(function wcf(j){//

	if(testsw) console.log('wcf ['+j+']');
		if(testsw) console.log('wbf entry= '+j+' intervalTime= '+intervalTime);
	 		wbf(j);

			return wcf;//
		}.bind(null,j)().bind(null,j))//
	}.bind(null,j), delayTime[j]));

if(testsw) console.log('setTimeout['+j+'] END');

	// hour
	// targetTemp 37.0  period 0:0
	var stime=targetTempArray[j].split(' ')[3].split(':');
	hour+=parseInt(stime[0]);// hour 
	min+=parseInt(stime[1]);// minute
if(testsw) console.log('setTime['+j+']='+stime);
	}// next j 

	setInterval(function(){},10*60*1000);// 10min dumy interval
	});// reafFile
	if(testsw) console.log('changeConfigFile end');
}

//////////////

startStopDaemon(function() {
////
    process.argv.forEach(function(val, index, array) {
    	if(index >= 2){
        if(val=='-t'){
		testsw=true;
			}
        if(val=='-nl'){
		logsw=false;
			}
        if(val=='-nw'){
		writesw=false;
			}
		}
	});
	
if(testsw)   console.log('process.argv='+process.argv);
if(testsw)   console.log('startStopDaemon');
	changeConfigFile();
if(testsw)     console.log('startStopDaemon finish.');
});
