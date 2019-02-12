#!/usr/local/bin/node
/*

	humController.js

	for controll peltier and heater of ITBOX.
	This program work on RaspberryPI with special hardware.

	8th,Oct,2018
	itplants,ltd.
	y.sakaguchi

*/

var startStopDaemon = require('start-stop-daemon');
const fs = require('fs');
require('date-utils');
require('util');

var sprintf = require("sprintf-js").sprintf;

var util = require('util');

const logFileName='/mnt/data/humController.log';
const errorFileName='/mnt/data/humControllerError.txt';
const configFileName='/home/coder/coder-dist/coder-base/config/saveHumController.txt';
const statusFileName='/home/coder/coder-dist/coder-base/config/statusHumController.txt';
const queryFileName='/home/coder/coder-dist/coder-base/config/queryHumController.txt';


var log_file = '';
var log_stderr = process.stderr;
var log_stdout = process.stdout;

var schedule = require("node-schedule");
var tempScl=[];

var strarray=[];// print information array 

function setTargetTemp(now){
	ta=String(now).split(' ')[1];
	tn=parseInt(parseInt(String(ta).split(':')[0])*60*60+parseInt(String(ta).split(':')[1])*60);

	for(i=0;i<targetTempArray.length;i++){
	if( !targetTempArray[i] ) continue;
	ta=String(targetTempArray[i]).split(' ')[3];
	if( !ta ) continue;
//	set now targetTemp
	tm=parseInt(parseInt(String(ta).split(':')[0])*60*60+parseInt(String(ta).split(':')[1])*60);

	if(tn >= tm){
		 targetTemp=parseFloat(String(targetTempArray[i]).split(' ')[1]);
//console.log('CHANGED time='+String(targetTempArray[i]).split(' ')[3]+' targetTemp='+targetTemp);
		}
	}// next i
} 

function setTargetHum(now){
	ta=String(now).split(' ')[1];
	tn=parseInt(parseInt(String(ta).split(':')[0])*60*60+parseInt(String(ta).split(':')[1])*60);

	for(i=0;i<targetHumArray.length;i++){
	if( !targetHumArray[i] ) continue;
	ta=String(targetHumArray[i]).split(' ')[3];
	if( !ta ) continue;
//	set now targetTemp
	tm=parseInt(parseInt(String(ta).split(':')[0])*60*60+parseInt(String(ta).split(':')[1])*60);

	if(tn >= tm){
		 targetHum=parseFloat(String(targetHumArray[i]).split(' ')[1]);
//console.log('CHANGED time='+String(targetHumArray[i]).split(' ')[3]+' targetHum='+targetHum);
		}
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
        return String(logFileName).split('.')[0]+t+'.'+String(logFileName).split('.')[1];
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
	ta=String(now).split(' ')[1];
	tn=parseInt(String(ta).split(':')[1]);// min
	if(tn > 0) return;// every 60min

	var newName=get_logFileName(now);
	if(isExistFile(newName)===false){
                if(fs){
		fs.fsyncSync(log_file);// flush buffer
		var txt=fs.readFileSync(logFileName);
		  if(!txt) return;// avoid null file
		} else return;

		  if(txt.length==0) return;// avoid null file
		fs.writeFileSync(newName,txt);
		fs.closeSync(log_file);
		fs.unlinkSync(logFileName);
		log_file = fs.openSync(logFileName, 'w');
	}
}

// global var
const chkPoint = 10;
var itrCount=0;
var hum=0;
var press=0;
var temp=0;
var targetTemp=0;
var targetTempArray=[];
var targetHum=0;
var targetHumArray=[];
var currentTemp=0.0;
var currentHum=0.0;
var currentLux=0.0;
var pwm=0, dir=0;
var pwmHum=0, dirHum=0;
var pwmHeater=0, dirHeater=0;
var Pws=0,Pw=0,Dair=0,Mratio=0,AH=0;
var dAH=[];
var dTemp=[];
var Tpeltier=0;
var Tcondensation=0;
var CondensCondition=false;
var FreezeCondition=false;
var correction=0;
var limitShold=[1000,1000,500];

var fullPowerStartTime=0;
var fullPowerContTime=0;
var unFreezeStartTime=0;
var unFreezeContTime=0;
var unFreezeState=false;

var PIDparameterSet=['','',''];

//
var Kp=[600,100,300];   // small number for more speedy response
var Ki=[0.1,0.1,0.01];  // large number for speedy responce to noise
var Kd=[0.025,0.025,0.0025]   // large number for speedy responce to noise
//
//
var coolingMaxTime=40;// 40min
var heatingMaxTime=1; // 1min
var heatingMaxPower=300; // 30% 
//
// target temprature
targetTemp=20.0;
targetHum=60.0;
//
//var samplingTime=1000*30;// 30sec 
//var samplingTime=1000*10;// 10sec 
var samplingTime=500;// 500msec 

// result of DS18B20
var resDS18B20='0 0';

function DS18B20(){
  execFile = require('child_process').execFile;
    child = execFile("/home/pi/src/ITBOX/DS18B20.sh", (error, stdout, stderr) => {
        if (error) {
            console.error("DS18B20 stderr", "DS18B20");
            console.error("DS18B20 stderr", stderr);
            throw error;
        }
	  resDS18B20 = String(stdout);
          resDS18B20=String(resDS18B20).replace(/\n/g,'');
//console.error('DS18B20 '+resDS18B20);
           });
}

function getDS18B20(){
          if( resDS18B20 === undefined )   resDS18B20='0 0';
          return resDS18B20;
}

function finalJob(){
console.error(getTimeDate());
console.error('tempController.js  I will exit.');
//unlockFile();
//console.log('unlockFile.');
execSync = require('child_process').execSync;
// stop peltier
	pwm = 0; dir =0;
	execSync = require('child_process').execSync;
	result =  execSync('/home/pi/src/ITBOX/peltier.py '+pwm+' '+dir);
	execSync = require('child_process').execSync;
	result =  execSync('/home/pi/src/ITBOX/dehumidi.py '+pwm+' '+dir);
	result =  execSync('/home/pi/src/ITBOX/heater.py '+pwm+' '+dir);
console.error('Stop peltier\n');
	var newName=get_logFileName(getTimeDate());
	fs.renameSync(logFileName, newName);
console.error('humController.js  finalJob I will exit.');
	process.exit();
}

process.on('SIGINT', function () {
	console.error('SIGINT');
	finalJob();
});

process.on('SIGHUP', function() {
	console.error('SIGHUP');
	finalJob();
});

process.on('SIGUSR2', function() {
	console.error('SIGUSR2');
	finalJob();
});

function measureFromTSL2561Sensor(){
	execSync = require('child_process').execSync;
	result =  execSync("/home/pi/src/ITBOX/TSL2561.py");
	//sensor=parseFloat(String(result).split(' ')[1])/10.0;
	sensor=parseFloat(result);
	return sensor;
}

var resTSL2561=""
var statTSL2561=0 // 0: init 1:have result 

function TSL2561(){
    if(statTSL2561===0){
        resTSL2561=measureFromTSL2561Sensor();
        statTSL2561 = 2
    } else {
    execFile = require('child_process').execFile;
        statTSL2561 = 1
    child = execFile("/home/pi/src/ITBOX/TSL2561.py", (error, stdout, stderr) => {
        if (error) {
            console.error("stderr", "TSL2561");
            console.error("stderr", stderr);
            throw error;
        }
        resTSL2561 = String(stdout).replace(/\n/g,'');
        statTSL2561 = 2
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
	result =  execSync("/home/pi/src/ITBOX/BME280.sh");
	if(result !== "" ){
	sensor=parseFloat(String(result));
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
        statBME280 = 2
    } else {
    execFile = require('child_process').execFile;
        statBME280 = 1
    child = execFile("/home/pi/src/ITBOX/BME280.sh", (error, stdout, stderr) => {
        if (error) {
            console.error("stderr", "BME280");
            console.error("stderr", stderr);
            throw error;
        }
        resBME280 = String(stdout).replace(/\n/g,'');
        statBME280 = 2
    	});
    }
}

function getHum(){
    execFile = require('child_process').execFile;
    child = execFile("/home/pi/src/ITBOX/BME280Hum.sh", (error, stdout, stderr) => {
        if (error) {
            console.error("stderr", "BME280");
            console.error("stderr", stderr);
            throw error;
        }
        resBME280 = String(stdout).replace(/\n/g,'');
        currentHum=parseFloat(resBME280);
    	});
}

function applyInputToActuator(input){
//
pwm = parseInt(Math.abs(input));
if( input < 0 ) 
	dir = 0; // cool
else 
	dir = 1; // hot

	if( dir == 0 ){
	 	//console.log('PWM '+parseInt(pwm)+' cool '+dir);
	 	strarray[5]='PeltierPWM '+parseInt(pwm)+' cool '+dir;
	} else {
		//console.log('PeltierPWM '+parseInt(pwm)+' hot  '+dir);
		strarray[5]='PeltierPWM '+parseInt(pwm)+' hot  '+dir;
	}

	if(isNaN(pwm) === false ){
		execSync = require('child_process').execSync;
		result =  execSync('/home/pi/src/ITBOX/peltier.py '+pwm+' '+dir);
		//console.log(String(result));
	}
}

function applyInputToHumActuator(input){
//
pwm = parseInt(Math.abs(input));
if( input < 0 ) 
	dir = 0; // cool
else 
	dir = 1; // hot

	if( dir == 0 ){
	 	//console.log('PWM '+parseInt(pwm)+' cool '+dir);
	 	strarray[6]='HumidityPWM '+parseInt(pwm)+' cool '+dir;
	} else {
		//console.log('PWM '+parseInt(pwm)+' hot  '+dir);
		strarray[6]='HumidityPWM '+parseInt(pwm)+' hot  '+dir;
	}

	if(isNaN(pwm) === false && dir === 0 ){
		execSync = require('child_process').execSync;
		result =  execSync('/home/pi/src/ITBOX/dehumidi.py '+pwm+' '+dir);
		result =  execSync('/home/pi/src/ITBOX/humidifier.py 0');
	}
	if(isNaN(pwm) === false && dir === 1 ){
		execSync = require('child_process').execSync;
		result =  execSync('/home/pi/src/ITBOX/dehumidi.py 0 0');
		result =  execSync('/home/pi/src/ITBOX/humidifier.py '+pwm);
	}
}

function applyInputToHeaterActuator(input){
//
	pwm = parseInt(Math.abs(input));
	dir = 0; // cool

        if(pwm > 300) pwm=300;

 	strarray[7]='HeaterPWM '+parseInt(pwm)+' cool '+dir;

	if(isNaN(pwm) === false ){
		execSync = require('child_process').execSync;
		result =  execSync('/home/pi/src/ITBOX/heater.py '+pwm+' '+dir);
		//console.log(String(result));
	}
}


function unFreezedFan(){
	FreezeCondition = false;// unfreeze

	// No.1
	res=getDS18B20();
	//console.log('----------unFreezedFan  DS18B20 '+res);
	sensor = String(res).split(' ');
        sensor[1]=String(sensor[1]).replace(/\n/g,'');

	//console.log('freezedFan[DS18B20] '+sensor[0]+' '+sensor[1]);
        strarray[8]='freezedFan[DS18B20] '+sensor[0]+' '+sensor[1];
	//
	Tpeltier = parseFloat(sensor[0]);

	if( unFreezeStartTime > 0 || (pwm===1000 && dir ===0  && Tpeltier < 5.0) ){
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

function calcPw(t){
// 水の飽和水蒸気圧 
// Pws : 飽和水蒸気圧  Tetens equation
   return 6.1078*Math.pow(10,(7.5*temp)/(237.2+temp));
//
// https://www.daiichi-kagaku.co.jp/situdo/notes/note108.html
/*
   var lnew = -6096.9385/t + 21.2409642-2.71193/100.0*t+1.673952/10000.0*t*t+2.433502*Math.log(t);
   return Math.exp(lnew);
 */
}

function calcTcons(Pw){
// 露点温度
//   return 237.3*Math.log(6.1078/Pw)/(Math.log(Pw/6.1078)-7.5);
//
// https://www.daiichi-kagaku.co.jp/situdo/notes/note108.html
   var y=Math.log(Pw/6.11213);
   if( y >= 0.0 ){
   Tc = 13.715*y+8.4262/10.0*y*y+1.9048/100.0*y*y*y+7.8158/1000.0*y*y*y*y;
   } else {
   Tc = 13.7204*y+7.36631/10.0*y*y+3.32136/100.0*y*y*y+7.78591/1000.0*y*y*y*y;
   }
   return Tc;
}

function uncondensation(){
	var ret = false;
	execSync = require('child_process').execSync;
	result =  execSync("./BME280.py |awk '{print $2,$4,$6}'");
	sensor=String(result).split(' ');
	if(sensor !== "" ){
 	hum   =  parseFloat(sensor[0]);
	press  = parseFloat(sensor[1]);
	temp = parseFloat(sensor[2]);
	}
	dTemp[itrCount % 2]=temp;

        //console.log('BME280 '+' hum '+hum+' temp '+temp+' press '+press);
	strarray[9]='BME280 '+' hum '+hum+' temp '+temp+' press '+press;

        // Pws : 飽和水蒸気圧  Tetens equation
	Pws = calcPw(temp);
        // Pw : 水蒸気圧 
	Pw  = Pws*hum/100.0;
        //  
	Dair   = press*100.0/(287.0*(273.15+temp));
	Mratio = 6.22*Pw/press;
	AH = Pw*100.0/(8.31447*(273.15+temp))*18.0;
	AH = AH/Dair;
	dAH[itrCount % 2]=AH;

	// Tetens  Pw ＝6.11 × 10 ^（0.75T/(237.3+ T) ）
	// T=237.3×log(6.1078/Pw)/7.5＋log(Pw/6.1078)
	// Tcons= 237.3*Math.log(6.1078/Pw)/(Math.log(Pw/6.1078)-7.5);
        // Tcondensation : 露点温度
	Tcondensation =calcTcons(Pw);

	strarray[10]="Pws "+Pws.toFixed(1)+" Pw "+Pw.toFixed(1)+" Dair "+Dair.toFixed(1);

	//console.log("Mratio "+Mratio.toFixed(1)+" AH "+AH.toFixed(1)+" Tcondensation "+Tcondensation.toFixed(1));
	strarray[11]="Mratio "+Mratio.toFixed(1)+" AH "+AH.toFixed(1)+" Tcondensation "+Tcondensation.toFixed(1);

//	if(Tcondensation < currentTemp) ret = true;	
	if( itrCount > 1 ){
// 0.05 sakaguti
	var DAH = dAH[1]-dAH[0];
	if(DAH < -0.05 && dir == 0 && pwm > 50.0) ret = true;	
	}

	return Tcondensation;
}

function condensation(){
	CondensCondition = false;// uncondensation

	Tcondensation= uncondensation();

	// peltier temp
	// No.2
        //result=getDS18B20();
	//res = String(result).split(' ');
	//sensor[0] = parseFloat(res[0]);
	//Tpeltier = sensor[0];

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
        console.error( 'ファイルが存在しません。1' );
       // process.exit(1);
    }
    // 結果表示
    //getTimeDate();
    console.error( 'callbackReadFile ファイルが更新されました' );
    // この場合、スコープが一致するので、this.filenameが取得できる。
    //console.error( '【ファイル内容 ' + configFileName + '】' );
	var t = String(data).split('\n');
	if( t[t.length-1]==='' ) t.pop();
        targetTempArray=[];
	targetHumArray=[];
	for(i=0;i<t.length;i++){
	if( String(t[i]).split(' ')[0]==='targetTemp') targetTempArray.push(t[i]);
	if( String(t[i]).split(' ')[0]==='targetHum') targetHumArray.push(t[i]);
	if( String(t[i]).split(' ')[0]==='setPID') PIDparameterSet[0]=t[i];
	if( String(t[i]).split(' ')[0]==='setHumidifyPID') PIDparameterSet[1]=t[i];
	if( String(t[i]).split(' ')[0]==='setHeaterPID') PIDparameterSet[2]=t[i];
	}

    if(targetTempArray) setTargetTemp(getTimeDate());
    if(targetHumArray ) setTargetHum(getTimeDate());
//
     for(i=0;i<PIDparameterSet.length;i++){
	if(PIDparameterSet[i]){
	// setPID Kp K_p Ki K_i Kd K_d 
	var t=String(PIDparameterSet[i]).split(' ');
	Kp[i]=t[2];
	Ki[i]=t[4];
	Kd[i]=t[6];
		}
	}
	PIDparameterSet=['','',''];
}

//////////////

// ファイル更新チェックプロセスの開始
    fs.watch( queryFileName, handlerWatch2.bind(this) );

// 対象のファイルが変更された後の処理
function handlerWatch2(){
    // readFileで対象ファイルを読み込んで表示
    fs.readFile( queryFileName, "utf-8", callbackWriteFile.bind(this) );
}

// 移植：readFileで対象ファイルを読み込んで表示
function callbackWriteFile ( err , data ) {
    // エラー処理
    if( err ) {
        console.error( 'ファイルが存在しません。2' );
        //process.exit(1);
    }
    // 結果表示
	var data=String(data).split('\n');
	//
	var txt=getTimeDate()+'\n';

	for(i=0;i<data.length;i++){
	if(data[i] == 'currentTemp' ) txt += 'currentTemp '+sprintf('%.2f',currentTemp)+'\n';
	if(data[i] == 'hum' ) txt += 'hum '+sprintf('%.2f',hum)+'\n';
	if(data[i] == 'press' ) txt += 'press '+sprintf('%.2f',press)+'\n';
	if(data[i] == 'targetTemp' ) txt += 'targetTemp '+sprintf('%.2f',targetTemp)+'\n';
	if(data[i] == 'targetHum' ) txt += 'targetHum '+sprintf('%.2f',targetHum)+'\n';
	if(data[i] == 'currentLux' ) txt += 'currentLux '+sprintf('%.2f',currentLux)+'\n';
	if(data[i] == 'pwm' ) txt += 'pwm '+sprintf('%d',pwm)+'\n';
	if(data[i] == 'dir' ) txt += 'dir '+dir+'\n';
	if(data[i] == 'AH' ) txt += 'AH '+sprintf('%.2f',AH)+'\n';
	if(data[i] == 'Tpeltier' ) txt += 'Tpeltier '+sprintf('%.2f',Tpeltier)+'\n';
	if(data[i] == 'Tcondensation' ) txt += 'Tcondensation '+sprintf('%.2f',Tcondensation)+'\n';
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
	console.error('callbackWriteFile  statusFile:'+txt);

	fs.writeFile(statusFileName, txt , function (err) {
		if(err) console.error('callbackWriteFile:'+err);
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
	return state;
}


startStopDaemon(function() {
////
	console.log('startStopDaemon');
    if(processExist()){
        console.error("Another proccess running. abort");
        process.exit();
    }

// read tergetTemp from config file
	data=fs.readFileSync(configFileName);
//console.error('startStopDaemon text='+data);
	var t = String(data).split('\n');
	if( t[t.length-1]==='' ) t.pop();
        targetTempArray=[];
	targetHumArray=[];
	for(i=0;i<t.length;i++){
console.error('readConfigFile t['+i+']='+t[i]);
	if( String(t[i]).split(' ')[0]==='targetTemp') targetTempArray.push(t[i]);
	if( String(t[i]).split(' ')[0]==='targetHum') targetHumArray.push(t[i]);
	if( String(t[i]).split(' ')[0]==='setPID') PIDparameterSet[0]=t[i];
	if( String(t[i]).split(' ')[0]==='setHumidifyPID') PIDparameterSet[1]=t[i];
	if( String(t[i]).split(' ')[0]==='setHeaterPID') PIDparameterSet[2]=t[i];
	}

    if(targetTempArray) setTargetTemp(getTimeDate());
    if(targetHumArray ) setTargetHum(getTimeDate());
//
//console.error('PIDparameterSet0='+PIDparameterSet);
       for(i=0;i<PIDparameterSet.length;i++){
	if(PIDparameterSet[i]){
	// setPID Kp K_p Ki K_i Kd K_d 
	var t=String(PIDparameterSet[i]).split(' ');
	Kp[i]=t[2];
	Ki[i]=t[4];
	Kd[i]=t[6];
		}
	}
	PIDparameterSet=['','',''];

	// sleep until first data get.
	var sleep = require('sleep');
	sleep.sleep(2);
	sleep.msleep(200);

	targetTemp = parseFloat(String(targetTempArray[0]).split(' ')[1]);
	targetHum = parseFloat(String(targetHumArray[0]).split(' ')[1]);

console.error('startStopDaemon  targetTempArray:'+targetTempArray);

	if( !isFinite(targetTemp) ) targetTemp=20.0;
	if( !isFinite(targetHum) ) targetTemp=60.0;

        console.log('setTargetTemp start '+targetTemp);
        console.log('setTargetHum  start '+targetHum);
	if(targetTempArray) setTargetTemp(getTimeDate());
	if(targetHumArray ) setTargetHum(getTimeDate());
//console.error('targetTemp '+targetTemp);


    process.argv.forEach(function(val, index, array) {

    if(index >= 2){
        if(val=='-t'){
         targetTemp = parseFloat(process.argv[index+1]); // target Temp 
	// write targetTemp to config file	
	 config_file = fs.createWriteStream(configFileName, {flags : 'w'});

  	 config_file.write('targetTemp '+targetTemp+'\n');
	 config_file.close();
        }
        if(val=='-h'){
         targetHum = parseFloat(process.argv[index+1]); // target Temp 
	// write targetHum to config file	
	 config_file = fs.createWriteStream(configFileName, {flags : 'w'});

  	 config_file.write('targetHum '+targetHum+'\n');
	 config_file.close();
        }

        if(val=='-s'|| val=='samplingTime'){
            samplingTime= parseInt(process.argv[index+1]);
        }

        if(val=='-kp' || val=='-Kp'){
            Kp[0] = parseFloat(process.argv[index+1]);
        }
        if(val=='-ki' || val=='-ki'){
            Ki[0] = parseFloat(process.argv[index+1]);
        }
        if(val=='-kd' || val=='-kd'){
            Kd[0] = parseFloat(process.argv[index+1]);
        }
        if(val=='-humkp' || val=='-humKp'){
            Kp[1] = parseFloat(process.argv[index+1]);
        }
        if(val=='-humki' || val=='-humKi'){
            Ki[1] = parseFloat(process.argv[index+1]);
        }
        if(val=='-humkd' || val=='-humkd'){
            Kd[1] = parseFloat(process.argv[index+1]);
        }
        if(val=='-heatkp' || val=='-heatKp'){
            Kp[2] = parseFloat(process.argv[index+1]);
        }
        if(val=='-heatki' || val=='-heatKi'){
            Ki[2] = parseFloat(process.argv[index+1]);
        }
        if(val=='-heatkd' || val=='-heatkd'){
            Kd[2] = parseFloat(process.argv[index+1]);
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
        if(val=='-help'){
            console.log('Usage: '+process.argv[1]+'-t targetTemp -s samplingTime[msec] -kp P -ki I -kd D -i_max i_max -condense(uncondense OFF) -freeze(unfreeze OFF)');
	    console.log('configFile is '+configFileName);
            process.exit(0);
            }
        }
    });


// get currentTemp from BME280
currentTemp = measureFromBMESensor();
currentLux = measureFromTSL2561Sensor();

	log_file = fs.openSync(logFileName, 'w');
	//log_stderr = fs.openSync(errorFileName, 'w');

//  output by every 10 sec
	setInterval(function(){
	console.log(logFileName);
	console.log(strarray.join('\n'));
       	if(log_file) fs.appendFileSync(logFileName, strarray.join('\n')+'\n');
	},10000);

//      read DS18B20 by every 5 sec
	setInterval(function(){
		DS18B20();// 1-wire reading
	},5000);

//
var sample_time = 0.0;
var current_time = new Date().getTime();
var last_time = current_time;
var last_error = [0.0,0.0,0.0];
var delta_time = [0.0,0.0,0.0];
var delta_error = [0.0,0.0,0.0];
var windup_guard=1000;
var PTerm=[0,0,0];
var ITerm=[0,0,0];
var DTerm=[0,0,0];
var error=[0,0,0];
var input=[0,0,0];

// tempControl by every samplingTime

setInterval(function(){
		var now=getTimeDate();
		currentLux = measureFromTSL2561Sensor();//getTSL2561();
                getHum();

		//console.log('--------------');
		strarray[0]='--------------';

		//console.log(now);
		strarray[1]=now;

		//console.log('currentTemp='+currentTemp+' targetTemp='+targetTemp);
		strarray[2]='currentTemp='+currentTemp+' targetTemp='+targetTemp;
		strarray[3]='currentHum='+currentHum+' targetHum='+targetHum;

		//console.log('currentLux='+currentLux);
		strarray[4]='currentLux='+currentLux;

		// tempControll
                if( isNaN(currentTemp) === false ){
			// tempController
  			error[0]  = targetTemp-currentTemp;
                        // dehumidity peltier
  			error[1]  = targetHum-currentHum;
                        // heater
  			error[2]  = targetTemp-currentTemp;
        		current_time = new Date().getTime();

                   for(n=0;n<3;n++){

        		delta_time[n] = current_time - last_time;
        		delta_error[n] = error[n] - last_error[n];
        		if (delta_time[n] >= sample_time){
            			PTerm[n] = Kp[n] * error[n];
            			ITerm[n] += error[n] * delta_time[n];
			}
            		if (ITerm[n] < -windup_guard)
                		 ITerm[n] = -windup_guard;
            		else if (ITerm[n] > windup_guard)
                		 ITerm[n] = windup_guard;

            		DTerm[n] = 0.0;
            		if ( delta_time[n] > 0 )
                		DTerm[n] = delta_error[n] / delta_time[n];

            	// Remember last time and last error for next calculation
            		last_time = current_time;
            		last_error[n] = error[n];

			input[n] = PTerm[n] + (Ki[n] * ITerm[n]) + (Kd[n] * DTerm[n]);

			// maxLimit 1000 is 100%
			if(input[n] >  limitShold[n]) input[n]= limitShold[n];
			if(input[n] < -limitShold[n]) input[n]=-limitShold[n];

		/*	
		console.log('PTerm['+n+']='+PTerm[n]);
		console.log('ITerm['+n+']='+ITerm[n]);
		console.log('DTerm['+n+']='+DTerm[n]);
		console.log('Error['+n+']='+error[n]);
		console.log('input['+n+']='+input[n]);
                */
                
		}// next n
		////
                ///  avoid over heat
		if( Tpeltier > 70 ) input[0]=0;
		////
		//console.log('PeltierCool='+input[1]+' Heater '+input[2]);
  			applyInputToActuator(input[0]);
  			applyInputToHumActuator(input[1]);

          	        if(input[2] < 0) input[2]=0;
  			applyInputToHeaterActuator(input[2]);
		}

// check  freeze
  		unFreezedFan();
// check condensation
		condensation();
// get current temp
		currentTemp = measureFromBMESensor();
		itrCount++;
   },samplingTime);

});
