#!/usr/local/bin/node
/*
#
#	tempController.js
#
#	for controll peltier of ITBOX.
#	This program work on RaspberryPI with special hardware.
#
#	8th,Dec,2016
#	itplants,ltd.
#	y.sakaguchi
#
*/

var startStopDaemon = require('start-stop-daemon');
const fs = require('fs');
require('date-utils');
require('util');

var sprintf = require("sprintf-js").sprintf;

var util = require('util');

const logFileName='/mnt/data/tempController.log';
const errorFileName='/mnt/data/tempControllerError.txt';
const configFileName='/home/coder/coder-dist/coder-base/config/saveTempController.txt';
const statusFileName='/home/coder/coder-dist/coder-base/config/statusTempController.txt';
const queryFileName='/home/coder/coder-dist/coder-base/config/queryTempController.txt';


var log_file = '';
var log_stderr = process.stderr;
var log_stdout = process.stdout;

var schedule = require("node-schedule");
var tempScl=[];

function setTargetTemp(now){
//console.log('setTargetTemp in');

	ta=now.split(' ')[1];
	tn=parseInt(parseInt(ta.split(':')[0])*60*60+parseInt(ta.split(':')[1])*60);

	for(i=0;i<targetTempArray.length;i++){
	if( !targetTempArray[i] ) continue;
	ta=targetTempArray[i].split(' ')[3];
	if( !ta ) continue;

//	set now targetTemp
	tm=parseInt(parseInt(ta.split(':')[0])*60*60+parseInt(ta.split(':')[1])*60);

	if(tn >= tm){
		 targetTemp=parseFloat(targetTempArray[i].split(' ')[1]);

//console.log('CHANGED time='+targetTempArray[i].split(' ')[3]+' targetTemp='+targetTemp);
		}
//
	}// next i
} 


function getTimeDate(){
                         var now = new Date();
                         // 
                         var month=now.getMonth()+1;
                         if(month <= 9 ) month='0'+month;
                         var day=now.getDate()+0;
                         if(day <= 9 ) day='0'+day;
                         var hour=now.getHours()+0;
                         if(hour <= 9) hour='0'+hour;
                         var min=now.getMinutes()+0;
                         if(min <= 9) min='0'+min;
                         var sec=now.getSeconds()+0;
                         if(sec <= 9) sec='0'+sec;
                        
var timedate =  now.getFullYear()+'/'+month +'/'+day+' '+hour+':'+min+':'+sec;
//               console.log(timedate);
//
			setTargetTemp(timedate);
			change_log(timedate);
	
                        return timedate;
 }

function get_logFileName(now){
        var t=now.replace(' ','-');
        var re1 = new RegExp("/", "g");
        t=t.replace(re1,'-');
        var re2 = new RegExp(":", "g");
        t=t.replace(re2,'_');
        // remove 3 char of _[sec]
        t=t.substr(0, t.length-3);
        return logFileName.split('.')[0]+t+'.'+logFileName.split('.')[1];
}

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}

function change_log(now){
	ta=now.split(' ')[1];
	tn=parseInt(ta.split(':')[1]);// min
	if(tn > 0) return;// every 60min

	var newName=get_logFileName(now);
	if(isExistFile(newName)===false){
		fs.fsyncSync(log_file);// flush buffer
		var txt=fs.readFileSync(logFileName);
		  if(!txt) return;// avoid null file
		  if(txt.length==0) return;// avoid null file
		fs.writeFileSync(newName,txt);
		fs.closeSync(log_file);
		fs.unlinkSync(logFileName);
		log_file = fs.openSync(logFileName, 'w');
	}
}

// npm i node-pid-controller
Controller = require('node-pid-controller');

// global var
const chkPoint = 10;
var itrCount=0;
var hum=0;
var press=0;
var temp=0;
var ctr=0;
var targetTemp=0;
var targetTempArray=[];
var currentTemp=0;
var currentLux=0;
var pwm=0, dir=0;
var Pws=0,Pw=0,Dair=0,Mratio=0,AH=0;
var dAH=[];
var dTemp=[];
var dTemp=[];
var Tpeltier=0;
var Tcondensation=0;
var CondensCondition=false;
var FreezeCondition=false;
var correction=0;

var fullPowerStartTime=0;
var fullPowerContTime=0;
var unFreezeStartTime=0;
var unFreezeContTime=0;
var unFreezeState=false;

var PIDparameterSet='';

//  k_p: 0.25,
//  k_i: 0.01,
//  k_d: 0.01,
//
//
var Kp=0.10;   // small number for more speedy response
var Ki=0.01;  // large number for speedy responce to noise
var Kd=0.01   // large number for speedy responce to noise
//
//
var coolingMaxTime=40;// 40min
var heatingMaxTime=1; // 1min
var heatingMaxPower=150; // 15% 
//
// target temprature
targetTemp=20.0;
//
//var samplingTime=1000*30;// 30sec 
//var samplingTime=1000*10;// 10sec 
var samplingTime=500;// 500msec 

var resDS18B20=""
var statDS18B20=0 // 0: init 1:have result 

function DS18B20(){
    execFile = require('child_process').execFile;
        statDS18B20 = 1
        //console.log('!!! statDS18B20 '+statDS18B20);
    child = execFile("./DS18B20.sh", (error, stdout, stderr) => {
        if (error) {
            console.error("stderr", stderr);
            throw error;
        }
        resDS18B20 = stdout.toString().replace('\n','');
        statDS18B20 = 2
        //console.log('DS18B20 '+stdout);
        //console.log('DS18B20 '+resDS18B20);
    });
}

function getDS18B20(){
        // first call
        //console.error("stderr", statDS18B20);
        if(statDS18B20 === 0){
                statDS18B20 = 1
                //console.log('!!! statDS18B20 '+statDS18B20);
                /*
                execSync = require('child_process').execSync;
                child = execSync("./DS18B20.sh", (error, stdout, stderr) => {
                        if (error) {
                        console.error("stderr", stderr);
                        throw error;
                        }
                        resDS18B20 = stdout.toString().replace('\n','');
                        statDS18B20 = 2
                        console.error("stderr", resDS18B20);
                        DS18B20();
                        return resDS18B20;
                });
                */      
                 DS18B20();
                 return "0 0";
        } else
        // update call
        if(statDS18B20 === 2){
                        DS18B20();
                        return resDS18B20;
        } else
        // during update
        return resDS18B20;
}

function finalJob(){
console.log(getTimeDate());
console.log('tempController.js  I will exit.');
//unlockFile();
//console.log('unlockFile.');
execSync = require('child_process').execSync;
// stop peltier
	pwm = 0; dir =0;
	execSync = require('child_process').execSync;
	result =  execSync('./peltier.py '+pwm+' '+dir);
console.log('Stop peltier\n');
//console.log(result.toString());
	var newName=get_logFileName(getTimeDate());
	fs.renameSync(logFileName, newName);
	process.exit();
}

/*
process.on('SIGKILL', function () {
	finalJob();
});
*/

process.on('SIGINT', function () {
	console.log('SIGINT');
	finalJob();
});

/*
process.on('exit', function () {
	console.log('exit');
	finalJob();
});
*/

process.on('SIGHUP', function() {
	console.log('SIGHUP');
	finalJob();
});

process.on('SIGUSR2', function() {
	console.log('SIGUSR2');
	finalJob();
});

function measureFromTSL2561Sensor(){
	execSync = require('child_process').execSync;
	result =  execSync("./TSL2561.py");
	//sensor=parseFloat(result.toString().split(' ')[1])/10.0;
	sensor=parseFloat(result);
	return sensor;
}


var resTSL2561=""
var statTSL2561=0 // 0: init 1:have result 

function TSL2561(){
    if(statTSL2561===0){
        resTSL2561=measureFromTSL2561Sensor();
        //console.log('!!! res '+resTSL2561);
        statTSL2561 = 2
    } else {
    execFile = require('child_process').execFile;
        statTSL2561 = 1
        //console.log('!!! statTSL2561 '+statTSL2561);
    child = execFile("./TSL2561.py", (error, stdout, stderr) => {
        if (error) {
            console.error("stderr", stderr);
            throw error;
        }
        resTSL2561 = stdout.toString().replace('\n','');
        statTSL2561 = 2
        //console.log('TSL2561 '+stdout);
        //console.log('TSL2561 '+resTSL2561);
    	});
    }
}

function getTSL2561(){
	// first call
	if(statTSL2561 === 0){
			TSL2561();
			return resTSL2561;
	} else
	// update call
	if(statTSL2561 === 2){
			TSL2561();
			return resTSL2561;
	} else
	// during update
			return resTSL2561;
}



function measureFromBMESensor(){
	execSync = require('child_process').execSync;
	result =  execSync("./BME280.sh");
	if(result !== "" ){
	sensor=parseFloat(result.toString());
	} else {
	sensor = temp;
	}
	return sensor;
}


var resBME280=""
var statBME280=0 // 0: init 1:have result 

function BME280(){
    if(statBME280===0){
        resBME280=measureFromBMESensor();
        //console.log('!!! res '+resBME280);
        statBME280 = 2
    } else {
    execFile = require('child_process').execFile;
        statBME280 = 1
        //console.log('!!! statBME280 '+statBME280);
    child = execFile("./BME280.sh", (error, stdout, stderr) => {
        if (error) {
            console.error("stderr", stderr);
            throw error;
        }
        resBME280 = stdout.toString().replace('\n','');
        statBME280 = 2
        //console.log('BME280 '+stdout);
        //console.log('BME280 '+resBME280);
    	});
    }
}

function getBME280(){
	// first call
	if(statBME280 === 0){
			BME280();
			return resBME280;
	} else
	// update call
	if(statBME280 === 2){
			BME280();
			return resBME280;
	} else
	// during update
			return resBME280;
}

function applyInputToActuator(input){
//
// *10  too small
// *100 too large
pwm = parseInt(Math.abs(input));

if( input < 0 ) 
	dir = 0; // cool
else 
	dir = 1; // hot

//console.log('applyInputToActuator');
        if( pwm > 1000 ){
		getTimeDate();
//		console.log('Overrange > 1000 ['+pwm+']');
//		console.log('set CurretTemp['+currentTemp+'] as TargetTemp['+targetTemp+']');
		pwm = 1000;// over range
		if(isNaN(currentTemp)===false){
			ctr.setTarget(currentTemp); // set CurrentTemp to TargetTemp
		} else {
			ctr.setTarget(targetTemp);  // set TargetTemp
			}
		} else {
                ctr.setTarget(targetTemp); // set TargetTemp
                }
		
	if( dir == 0 ) 	console.log('PWM '+parseInt(pwm)+' cool '+dir);
	else
			console.log('PWM '+parseInt(pwm)+' hot  '+dir);


	if(isNaN(pwm) === false ){
		execSync = require('child_process').execSync;
		result =  execSync('./peltier.py '+pwm+' '+dir);
		//console.log(result.toString());
	}

}

function unFreezedFan(){
	FreezeCondition = false;// unfreeze

	// No.1
	/*
	execSync = require('child_process').execSync;
	result =  execSync("./DS18B20.py|awk '{print $4, $7}'");
	res = result.toString().replace('\n','');
	*/
	res=getDS18B20();
	//console.log('unFreezedFan  DS18B20 '+res);

	sensor = res.split(' ');

	console.log('freezedFan[DS18B20] '+sensor[0]+' '+sensor[1]);

	if( unFreezeStartTime > 0 || (pwm===1000 && dir ===0 && Tpeltier < 5.0) ){
	//console.log('unFreezedFan process '+pwm+' '+dir);
	if(fullPowerStartTime===0){
		fullPowerStartTime = new Date().getTime();
		fullPowerContTime=0;
		//console.log('fullPowerStartTime ='+fullPowerStartTime);
		} else 
	if( fullPowerStartTime > 0 ){
		fullPowerContTime = new Date().getTime()-fullPowerStartTime;
		//console.log('fullPowerContTime ='+fullPowerContTime);
	    	if(fullPowerContTime > 1000*60*coolingMaxTime ){// 25min
		// do 1 min hot 
		if( unFreezeStartTime===0){
			 unFreezeStartTime=new Date().getTime();	
			 unFreezeContTime=0;
		//console.log('unFreezeStartTime ='+unFreezeStartTime);
			}
		if(unFreezeStartTime > 0 ){
		// pwm = 500 dir = 1
			unFreezeContTime=new Date().getTime()-unFreezeStartTime;
		//console.log('unFreezeContTime1 ='+unFreezeContTime/1000/60);
			if(unFreezeContTime < 1000*60*heatingMaxTime ){// 5min
				unFreezeState = true;
		//console.log('unFreezeContTime2 ='+unFreezeContTime/1000/60);
				pwm = heatingMaxPower; dir = 0;
  				applyInputToActuator(pwm/50.0);//
				} else {
				unFreezeState = false;
				unFreezeStartTime=0;
				unFreezeContTime=0;
				fullPowerStartTime=0;
				fullPowerContTime=0;
		//console.log('unFreezeState ='+unFreezeState);
				}
			}
		}
	}
	
	}
	return FreezeCondition;	
}

function uncondensation(){
	var ret = false;
	execSync = require('child_process').execSync;
	result =  execSync("./BME280.py |awk '{print $2,$4,$6}'");
	sensor=result.toString().split(' ');
	if(sensor !== "" ){
 	hum   =  parseFloat(sensor[0]);
	press  = parseFloat(sensor[1]);
	temp = parseFloat(sensor[2]);
	}
	dTemp[itrCount % 2]=temp;

console.log('BME280 '+' hum '+hum+' temp '+temp+' press '+press);

	Pws = 6.1078*Math.pow(10,(7.5*temp)/(237.2+temp));
	Pw  = Pws*hum/100.0;
	Dair   = press*100.0/(287.0*(273.15+temp));
	Mratio = 6.22*Pw/press;
	AH = Pw*100.0/(8.31447*(273.15+temp))*18.0;
	AH = AH/Dair;
	dAH[itrCount % 2]=AH;

	// Tetens  Pw ＝6.11 × 10 ^（0.75T/(237.3+ T) ）
	// T=237.3×log(Pw/6.11)/7.5＋log(6.11/Pw)
	Tcondensation = 237.3*Math.log(Pw/6.11)/7.5+Math.log(6.11/Pw);

console.log("Pws "+Pws.toFixed(1)+" Pw "+Pw.toFixed(1)+" Dair "+Dair.toFixed(1));
console.log("Mratio "+Mratio.toFixed(1)+" AH "+AH.toFixed(1)+" Tcondensation "+Tcondensation.toFixed(1));

//	if(Tcondensation < currentTemp) ret = true;	
	if( itrCount > 1 ){
// 0.05 sakaguti
	var DAH = dAH[1]-dAH[0];
	if(DAH < -0.05 && dir == 0 && pwm > 50.0) ret = true;	
	}

	return ret;
}

function condensation(){
	CondensCondition = false;// uncondensation

	Tcondensation= uncondensation();

	// peltier temp
	// No.2
	/*
	execSync = require('child_process').execSync;
	result =  execSync("./DS18B20.py|awk '{print $4, $7}'");
	*/
        result=getDS18B20();
	res = result.toString().split(' ');

	sensor[0] = parseFloat(res[0]);
	Tpeltier = sensor[0];
	if(res.length>1){
	  sensor[1] = parseFloat(res[1]);
//	console.log('condensation '+'sensor=',sensor);
	  Tpeltier = (sensor[0] < sensor[1]) ? sensor[0]:sensor[1];
	}

	Tcondensation > Tpeltier ? CondensCondition=true:CondensCondition=false;
	if(CondensCondition){
	//getTimeDate();
	//console.log('Condensation occured : '+Tcondensation+' > '+Tpeltier);
	}
	return CondensCondition; 
}

// ファイル更新チェックプロセスの開始
    fs.watch( configFileName, handlerWatch.bind(this) );

// 対象のファイルが変更された後の処理
function handlerWatch(){
    // readFileで対象ファイルを読み込んで表示
    fs.readFile( configFileName , callbackReadFile.bind(this) );
}

// 移植：readFileで対象ファイルを読み込んで表示
function callbackReadFile ( err , data ) {
    // エラー処理
    if( err ) {
        console.log( 'ファイルが存在しません。1' );
       // process.exit(1);
    }
    // 結果表示
    //getTimeDate();
    console.log( 'ファイルが更新されました' );
    // この場合、スコープが一致するので、this.filenameが取得できる。
    //console.log( '【ファイル内容 ' + configFileName + '】' );
	var t = data.toString().split('\n');
	for(n=0,i=0;i<t.length-1;i++){
	if( t[i].split(' ')[0]==='targetTemp') targetTempArray[n++]=t[i];
	if( t[i].split(' ')[0]==='setPID') PIDparameterSet=t[i];
	}

    targetTempArray=data.toString().split('\n'); // targetTemp [20.0] start [12:00]
	if( targetTempArray.length==1 && data.toString().split(' ')[0].indexOf('targetTemp')>= 0 ){
    		targetTemp= parseFloat(data.toString().split(' ')[1] );
		targetTempArray[0]='targetTemp '+targetTemp+' start 0:0:0';
	}

    if(targetTempArray) setTargetTemp(getTimeDate());
//
	if(PIDparameterSet){
	// setPID Kp K_p Ki K_i Kd K_d 
//console.log('PIDparameterSet='+PIDparameterSet);
	var t=PIDparameterSet.split(' ');
	Kp=t[2];
	Ki=t[4];
	Kd=t[6];
	console.log('PIDparameter Kp='+Kp+' Ki='+Ki+' Kd='+Kd);
	PIDparameter='';
	}

    //console.log( 'Now update targetTemp='+targetTemp );
}

//////////////

// ファイル更新チェックプロセスの開始
    fs.watch( queryFileName, handlerWatch2.bind(this) );

// 対象のファイルが変更された後の処理
function handlerWatch2(){
    // readFileで対象ファイルを読み込んで表示
    fs.readFile( queryFileName, "utf-8", callbackReadFile2.bind(this) );
}

// 移植：readFileで対象ファイルを読み込んで表示
function callbackReadFile2 ( err , bdata ) {
    // エラー処理
    if( err ) {
        console.log( 'ファイルが存在しません。2' );
        //process.exit(1);
    }
    // 結果表示
	var data0= bdata.toString();
	var data=data0.split('\n');
	//
	var txt=getTimeDate()+'\n';

	for(i=0;i<data.length;i++){
	if(data[i] == 'currentTemp' ) txt += 'currentTemp '+currentTemp+'\n';
	if(data[i] == 'hum' ) txt += 'hum '+hum+'\n';
	if(data[i] == 'press' ) txt += 'press '+press+'\n';
	if(data[i] == 'targetTemp' ) txt += 'targetTemp '+targetTemp+'\n';
	if(data[i] == 'currentLux' ) txt += 'currentLux '+currentLux+'\n';
	if(data[i] == 'pwm' ) txt += 'pwm '+sprintf('%d',pwm)+'\n';
	if(data[i] == 'dir' ) txt += 'dir '+dir+'\n';
	if(data[i] == 'AH' ) txt += 'AH '+sprintf('%.2f',AH)+'\n';
	if(data[i] == 'Tpeltier' ) txt += 'Tpeltier '+sprintf('%.2f',Tpeltier)+'\n';
	if(data[i] == 'Tcondensation' ) txt += 'Tcondensation '+Tcondensation+'\n';
	if(data[i] == 'Pws' ) txt += 'Pws '+sprintf('%.2f',Pws)+'\n';
	if(data[i] == 'Pw' ) txt += 'Pw '+sprintf('%.2f',Pw)+'\n';
	if(data[i] == 'Dair' ) txt += 'Dair '+sprintf('%.2f',Dair)+'\n';
	if(data[i] == 'Mratio' ) txt += 'Mratio '+sprintf('%.2f',Mratio)+'\n';
	if(data[i] == 'CondensCondition' ) txt += 'CondensCondition '+CondensCondition+'\n';
	if(data[i] == 'FreezeCondition' ) txt += 'FreezeCondition '+FreezeCondition+'\n';
	if(data[i] == 'correction' ) txt += 'correction '+sprintf('%.2f',correction)+'\n';
	if(data[i] == 'dAH' ) txt += 'dAH '+sprintf('%.2f',(dAH[1]-dAH[0]))+'\n';
	if(data[i] == 'dTemp' ) txt += 'dTemp '+sprintf('%.2f',(dTemp[1]-dTemp[0]))+'\n';
	if(data[i] == 'input' ) txt += 'input '+sprintf('%.2f',input)+'\n';
	if(data[i] == 'coolingMaxTime' ) txt += 'coolingMaxTime '+sprintf('%.2f',coolingMaxTime)+'\n';
	if(data[i] == 'heatingMaxTime' ) txt += 'heatingMaxTime '+sprintf('%.2f',heatingMaxTime)+'\n';
	}
	txt += 'EOF';

	fs.writeFile(statusFileName, txt , function (err) {
	console.error('callbackReadFile2:'+err);
	});
}

/////////////


var uncondense=false;// do uncondense job
var unfreeze=true;  // do unfreeze job

    const lockFilePath = "./main.lock";
    function lockFile() {
        try {
            var file = fs.openSync(lockFilePath, 'r');
            fs.close(file);
            return false;
        } catch (e1) {
            try {
                fs.writeFileSync(lockFilePath);
                return true;
            } catch (e2) {
                console.error('lockFile:'+e2);
                return false;
            }
        }
    }
     
    function unlockFile() {
        fs.unlink(lockFilePath, function(err){
            if (err) throw err;
        })
    }

function  processExist(){
	var state=false;
/*
	execSync = require('child_process').execSync;
        result =  execSync('ps auxg|grep tempController|grep node|grep -v grep|grep start-stop-daemon|wc -l');
	if( parseInt(result) > 1 ) state=true; else {
        result =  execSync('ps auxg|grep tempController|grep node|grep -v grep|wc -l');
		if( parseInt(result) > 1 ) state=true; else state=false;
	}
	console.log('state='+state);
	state=false;
*/
	return state;
}

var printStartSW=false;
var printEndSW=false;
var ppSW=true;

startStopDaemon(function() {
////

	console.log('startStopDaemon');
    if(processExist()){
        console.error("Another proccess running. abort");
        process.exit();
    }

// read tergetTemp from config file
	fs.readFile(configFileName, (err, data) => {

//        console.log('readConfigFile text='+data);
        //if (err) throw err;
        //console.log('readConfigFile2 '+data);
        //console.log(data.toString());

	targetTempArray=data.toString().split('\n');
	targetTemp = parseFloat(targetTempArray[0].split(' ')[1]);

//        console.log('targetTempArray '+targetTempArray);
	if( !isFinite(targetTemp) ) targetTemp=20.0;

//        console.log('setTargetTemp start '+targetTemp);
	if(targetTempArray) setTargetTemp(getTimeDate());
        console.log('targetTemp '+targetTemp);


    process.argv.forEach(function(val, index, array) {
//console.log(index + ': ' + val);

    if(index >= 2){
        if(val=='-t'){
         targetTemp = parseFloat(process.argv[index+1]); // target Temp 
	// write targetTemp to config file	
	 config_file = fs.createWriteStream(configFileName, {flags : 'w'});

  	 config_file.write('targetTemp '+targetTemp+'\n');
	 config_file.close();
        }

        if(val=='-s'|| val=='samplingTime'){
            samplingTime= parseInt(process.argv[index+1]);
        }
        if(val=='-kp' || val=='-Kp'){
            Kp = parseFloat(process.argv[index+1]);
        }
        if(val=='-ki' || val=='-ki'){
            Ki = parseFloat(process.argv[index+1]);
        }
        if(val=='-kd' || val=='-kd'){
            Kd = parseFloat(process.argv[index+1]);
        }
        if(val=='-imax' || val=='-i_max'){
            i_max = parseInt(process.argv[index+1]);
        }
        if(val=='-condense'){
	    uncondense=false;
        }
        if(val=='-freeze'){
	    unfreeze=false;
        }
        if(val=='-coolingMaxTime'){
	    coolingMaxTime=parseFloat(process.argv[index+1]);
        }
        if(val=='-heatingMaxTime'){
	    heatingMaxTime=parseFloat(process.argv[index+1]);
        }
        if(val=='-heatingMaxPower'){
	    heatingMaxPower=parseFloat(process.argv[index+1]);
        }
        if(val=='-h'){
            console.log('Usage: '+process.argv[1]+'-t targetTemp -s samplingTime[msec] -kp P -ki I -kd D -i_max i_max -condense(uncondense OFF) -freeze(unfreeze OFF)');
	    console.log('configFile is '+configFileName);
            process.exit(0);
            }
        }
    });


ctr = new Controller({
// PID
  k_p: Kp, // small number for more speedy response
  k_i: Ki, // large number for restrain undershoot and over shoot 
  k_d: Kd, // large number for speedy responce to noise
});

ctr.setTarget(targetTemp);

// get currentTemp from BME280
currentTemp = measureFromBMESensor();
currentLux = measureFromTSL2561Sensor();
correction = ctr.update(currentTemp);

//
targetTemp=currentTemp+5;
maxTemp=targetTemp;
startTime=new Date().getTime();
//console.error('startTime='+startTime);
console.error('targetTemp='+targetTemp+' currentTemp='+currentTemp);

log_file = fs.openSync(logFileName, 'w');
console.log('logfile='+logFileName);

// No.3
console.log = function(d){
        // close stream file
        if(log_file) fs.appendFileSync(logFileName, util.format( d+'\n'));
       	if(log_stdout) log_stdout.write(util.format( d+'\n'));

       	//if(log_stderr) fs.appendFileSync(errorFileName, util.format( d+'\n'));
       	//if(log_stdout) log_stdout.write(util.format( d+'\n'));
};


setInterval(function(){
		var now=getTimeDate();
		var nowTime=new Date().getTime();
		console.log('--------------');
		console.log(now);
		console.log('currentTemp='+currentTemp+' targetTemp='+maxTemp);
		currentLux = measureFromTSL2561Sensor();//getTSL2561();
		console.log('currentLux='+currentLux);

//console.error('keika Time='+(nowTime-startTime)/1000*60);
		if(currentTemp>maxTemp){
			 pwm=0; 
			 dir = 0;
		} else {
		// hot
			pwm = 1000;
			dir = 1;
		}

        if( dir == 0 )  console.log('PWM '+parseInt(pwm)+' cool '+dir);
        else
                        console.log('PWM '+parseInt(pwm)+' hot  '+dir);

// check  freeze
                unFreezedFan();

// check condensation
                condensation();
		execSync = require('child_process').execSync;
		result =  execSync('./peltier.py '+pwm+' '+dir);

// get current temp
		currentTemp = measureFromBMESensor();
		if(Math.abs(currentTemp-targetTemp) < 0.05 ){
			finalJob();
		}
		itrCount++;
},samplingTime);

	});
});
