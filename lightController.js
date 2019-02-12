#!/usr/local/bin/node
/*
#
#	lightController.js
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

var util = require('util');
var log_file = fs.createWriteStream('/tmp/lightController.log', {flags : 'w'});

var log_stdout = process.stdout;

console.log = function(d){
  log_file.write(util.format( d+'\n'));
  log_stdout.write(util.format( d+'\n'));
};

const configFile='/home/coder/coder-dist/coder-base/config/saveLightController.txt';

// npm i node-pid-controller
Controller = require('node-pid-controller');

// global var

process.on('SIGHUP', function() {
getTimeDate();
console.log('lightController.js  I got SIGHUP.');
execSync = require('child_process').execSync;
// stop peltier
pwm = 0; dir =0;

execSync = require('child_process').execSync;
result =  execSync('/home/coder/coder-dist/coder-base/sudo_scripts/sendcom -e s');
//console.log(result.toString());

});


function setSendCom(cmd){
	execSync = require('child_process').execSync;
console.log('cmd '+cmd);
	//var com='/home/coder/coder-dist/coder-base/sudo_scripts/sendcom -e '+cmd;
	var com='sudo sendcom -e '+cmd;
console.log('com '+com);
	result = execSync(com);
console.log(result);
	res = result.toString().split('\n')[1];
console.log(res);
	return res;
}

// ファイル更新チェックプロセスの開始
    fs.watch( configFile, handlerWatch.bind(this) );

// 対象のファイルが変更された後の処理
function handlerWatch(){
    // readFileで対象ファイルを読み込んで表示
    fs.readFile( configFile , callbackReadFile.bind(this) );
}

// 移植：readFileで対象ファイルを読み込んで表示
function callbackReadFile ( err , data ) {
    // エラー処理
    if( err ) {
        console.error( 'ファイルが存在しません。' );
        process.exit(1);
    }
    // 結果表示
    getTimeDate();
    console.log( 'ファイルが更新されました' );
    // この場合、スコープが一致するので、this.filenameが取得できる。
    console.log( '【ファイル内容 ' + configFile + '】' );
    //targetTemp= parseFloat(data.toString().split(' ')[1] );
    //console.log( 'targetTemp='+targetTemp );
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
                        
var timedate =  (now.getYear()+1900)+'/'+month +'/'+day+' '+hour+':'+min+':'+sec;
               		console.log(timedate);
                        return timedate;
 }

startStopDaemon(function(){
////
    	var samplingTime=1000*60*5; // default 5min 

	getTimeDate();
	console.log('startStopDaemon');

// read tergetTemp from config file
	fs.readFile(configFile, (err, data) => {
//        console.log('readConfigFile text='+data);
        if (err) throw err;
        //console.log('readConfigFile2 '+data);
        //console.log(data.toString());
	//targetTemp = parseFloat(data.toString().split(' ')[1]);
        //console.log('targetTemp '+targetTemp);

    process.argv.forEach(function(val, index, array) {
//console.log(index + ': ' + val);

    if(index >= 2){
        if(val=='-t'){
         addTime = parseFloat(process.argv[index+1]); // target Temp 
	// write targetTemp to config file	
	 config_file = fs.createWriteStream(configFile, {flags : 'w'});
  	 config_file.write('addTime '+addTime+'\n');
	 config_file.close();
        }
        if(val=='-s'){
            samplingTime= parseInt(process.argv[index+1]);
        }
        if(val=='-h'){
            console.log('Usage: '+process.argv[1]+'-t addTime -s samplingTime[msec]');
	    console.log('configFile is '+configFile);
            process.exit(0);
            }
        }
    });

		// search min  power of Light as H1
		// search max  power of Light as H2
		// search start time of Light ON as s1
		// search  end  time of Light ON as s2
		// 0:0越えに注意
		s1 = 7*60;
		s2 = 19*60;
		h1 = 100;
		h2 = 0;
		// get n
		n = parseInt(setSendCom('n').toString());
		for(i=0;i<n;i++){
		settingLight[i]=setSendCom('Y'+i).toString();
		ss = settingLight[i].split(',')[1];
		hh = settingLight[i].split(',')[2];
		//Yn,s1,H1
		if( ss > s1 ) s1 = ss;	
		if( hh > h1 ) h1 = hh;	
		//Yn,s2,H2
		if( ss < s2 ) s2 = ss;	
		if( hh < h2 ) h2 = hh;	
		}

// start at s1-(H2-H1)/2 and s2-(H2-H1)/2
  schedule = require('node-schedule');

  fireDate = new Date();
  fireDate.setSeconds(0);

  for(j=0;j<(H2-H1)/5;j++){
   fireDate.setHours(s1);
   fireDate.setMinutes(fireDate.getMinutes()-(H2-H1)/2+offset1);
 	job=schedule.scheduleJob(fireDate, function(){
	setSendCom('n5');
	for(i=0;i<5;i++){
	//setSendCom('Y'+i+','+(s1-(H2-H1)/2+offset1)+(H2-H1)/2+H1+i+1+offset1);
	console.log('Y'+i+','+(s1-(H2-H1)/2+offset1)+(H2-H1)/2+H1+i+1+offset1);
			};// next i
	offset1 = 5*j;
   		});
   }// mext j

// resume data
   fireDate = new Date();
   fireDate.setSeconds(0);
   fireDate.setHours(parseInt(s1/60));
   fireDate.setMinutes(parseInt(s1%60)+(H2-H1)/2+1);
   schedule.scheduleJob(fireDate, function(){
	offset1 = offset2 = 0;
	setSendCom('n'+n);
	for(i=0;i<n;i++){
		//setSendCom(settingLight[i]);
		console.log(settingLight[i]);
		}
   });

   fireDate = new Date();
   fireDate.setSeconds(0);
  for(j=0;j<(H2-H1)/5;j++){
   fireDate.setHours(parseInt(s2/60));
   fireDate.setMinutes(fireDate.getMinutes()-(H2-H1)/2+offset2);
   job=schedule.scheduleJob(fireDate, function(){
	setSendCom('n5');
	for(i=0;i<5;i++){
	setSendCom('Y'+i+','+(s1-(H2-H1)/2+offset2)+(H2-H1)/2+H1-i-1-offset1);
	console.log('Y'+i+','+(s1-(H2-H1)/2+offset2)+(H2-H1)/2+H1-i-1-offset1);
			}// next i
	offset2 = 5*j;
  		});
    }// next j

// resume data
   fireDate = new Date();
   fireDate.setSeconds(0);
   fireDate.setHours(s/parseInt(s2/60));
   fireDate.setMinutes(parseInt(s2%60)+(H2-H1)/2+1);
   schedule.scheduleJob(fireDate, function(){
	offset1 = offset2 = 0;
	setSendCom('n'+n);
	for(i=0;i<n;i++){
		setSendCom(settingLight[i]);
		console.log(settingLight[i]);
		}
   });

  });// read config file
})


