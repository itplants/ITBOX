#!/usr/local/bin/node 
/*
 * longPeriodControl
 *
 *  change temp schedule and cultivationPrg.
 *  2018/08/24
 *  itplants,ltd.
 *
 */

var startStopDaemon = require('start-stop-daemon');
var schedule = require("node-schedule");

const fs = require('fs');
require('date-utils');
require('util');

var sprintf = require("sprintf-js").sprintf;

var testsw=true;

var sortsw=true;

var intsw=true;// inperpolate PWM(Duty)

var fwritesw=true; // write file if true

var logsw=false;// for debug

var repeatTime=5*60;// 5min

//
var repeat='';// repeat job array

// LongPeriodControl file
const longPeriodFileName='/home/coder/coder-dist/coder-base/LongPeriodControl/saveLongPeriodControl.txt';

// itplanterController file
const itpFileName='/home/coder/coder-dist/coder-base/config/saveITPController.txt';

// tempController file
const tempFileName='/home/coder/coder-dist/coder-base/config/saveTempController.txt';

// if no logFile need then const logFileName=''
const logFileName='/home/pi/src/ITBOX/longPeriodControl.log';

// ファイル更新チェックプロセスの開始
fs.watch( longPeriodFileName, handlerWatch.bind(this) );

function calcDeltaCoeff(t0,t1,t2,v1,v2){
  var delta = parseFloat( (t1-t0)/(t2-t1) );
  v=delta*parseFloat(v2-v1)+v1;
  return v;
}

//////////////////
function label2array(dp){
var rdp=[];
 for(var i=0;i<dp.length;i+=2){
  rdp.push({start: '0:0', pwm: '0'});
  rdp[i/2]['start'] = dp[i];
  rdp[i/2]['pwm'] = dp[i+1];
 }
return rdp;
}

function array2label(dp){
var rdp=[];
 for(var i=0;i<dp.length;i++){
  rdp.push(dp[i]['start']);
  rdp.push(dp[i]['pwm']);
 }
return rdp;
}

function compare(a, b) {
if(h2m(a.start) > h2m(b.start)) return 1;
else if(h2m(a.start) < h2m(b.start)) return -1;
return 0;
}

function mySort(dp){
console.log('------------------- befor sort='+dp);
var rdp=label2array(dp);
rdp=rdp.sort(compare);
dp=array2label(rdp);
console.log('------------------- after sort='+dp);
return dp;
}
/////////////////

// interpolate Duty
function interpolate(t0,t1,t2,v1,v2){
////   t1 --- t0 --- t2
	var A=parseFloat(t0-t1);
	var B=parseFloat(t2-t1);
	//console.log('interpolate A '+A+' b='+B);
	var delta= A/B;

	if(delta > 1 ){
	  console.log('interpolate Error delta='+delta);
	  console.log('interpolate t1='+t1+' t0='+t0+' t2='+t2+' v2='+v2+' v1='+v1);
	  return v2;
	}
	if(delta < 0){
	  console.log('interpolate Error delta='+delta);
	  console.log('interpolate t1='+t1+' t0='+t0+' t2='+t2+' v2='+v2+' v1='+v1);
          return v1;
	}
	var vr= parseInt( (delta*parseFloat(v2-v1)+parseFloat(v1)) );
	//console.log('interpolate delta '+delta+' v2='+v2+' v1='+v1+' vr='+vr);
	return vr;
}

// do every 10 min
function calcCurrentDuty(txtitp){
// ---Lamp--- 7:0 19:42,---Duty--- 0:0 90,---Pump--- 5:0 11:0 17:0 23:0,pumpWrokTime 60
 var p=String(txtitp).split(',');
 var lamp=p[0];
 var duty=p[1].replace('---Duty--- ','').split(' ');
 var pump=p[2];
 var pwt =p[3];

//console.log('calcCurrentDuty duty1='+duty);
 var    now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
        now = now.replace(/-/g,' ');
        now = now.replace(/:/g,' ');
        now = String(now).split(' ');
 var t0,t1,t2;

   nt1=now[0]+'/'+now[1]+'/'+now[2]+' '+now[3]+':'+now[4]+':'+now[5];
//console.log('calcCurrentDuty nt1='+nt1);

   t1=new Date(nt1).getTime();// msec
//console.log('calcCurrentDuty t1='+t1);

 var rduty=[];

  var dp=[];

   for(j=0;j<duty.length;j++) dp.push( String(duty[j]).split(',') );
// dp[i]=[start PWM]
// dp=7:0,0, 9:0,90 ,12:0,0, 13:0,90, 14:0,0

// sort dp by start
   if(sortsw) dp = mySort(dp);

   var n=0;
   now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
  
   time=String(String(now).split(' ')[1]);
   now=String(String(now).split(' ')[0]).split('-');

   nt0=now[0]+'/'+now[1]+'/'+now[2]+' '+time;
   t0=new Date(nt0).getTime();// msec

//console.log('calcCurrentDuty t0='+t0);
//console.log('calcCurrentDuty dp='+dp);
// dp=7:0,0, 9:0,90 ,12:0,0, 13:0,90, 14:0,0

   if(dp.length>1){
   for(j=0;j<dp.length;j+=2){
   time=String(dp[j]);
   nt1 = now[0]+'/'+now[1]+'/'+now[2] +' '+time+':0';
   t1 = new Date(nt1).getTime();// msec

   k=j+2;
   if(k>dp.length-1) k=0;

   time=String(dp[k]);
   nt2=now[0]+'/'+now[1]+'/'+now[2] +' '+time+':0';
   t2=new Date(nt2).getTime();// msec

//console.log('calcCurrentDuty t0='+t0+' t1='+t1+' t2='+t2);

  if( t1 > t2 ) t2 = t2 + 24*60*60*1000;// 24 h (msec)
  if( t0 < t1 ) t0 = t1;// 0 h

   k=j+2;
   if(k>dp.length-1) k=0;
   var v1=parseFloat(dp[j+1]);
   var v2=parseFloat(dp[k+1]);

	 rduty[n++]= interpolate(t0,t1,t2,v1,v2);

//console.log('calcCurrentDuty['+(j/2)+']: t0='+t0+' t1='+t1+' t2='+t2+' v1='+v1+' v2='+v2+' rduty='+rduty[n-1]);
  	}// next j
  }


  var tduty=String(duty).split(',');
// console.log('calcCurrentDuty rduty='+rduty );
// console.log('calcCurrentDuty tduty='+tduty );

  duty='---Duty--- ';

  // set only current time Duty
  var now=new Date();

 var now = new Date().toFormat('HH24:MI');
 var nowtime=parseInt(h2m(now));
// console.log('nowtime='+nowtime);
  var nowH=0;

  if( tduty.length > 1){
  for(i=0;i<tduty.length;i+=2){
   k = i+2;
   if(k >= tduty.length) k=0;
// console.log('calcCurrentDuty tduty['+i+']='+tduty[i] );
// console.log('calcCurrentDuty tduty['+k+']='+tduty[k] );

   t1=parseInt(h2m(tduty[i]));
   t2=parseInt(h2m(tduty[k]));

   if(t1 <= nowtime && nowtime < t2){
   	nowH=rduty[i/2];
   	duty += now+' ' + nowH +' ';
   } else {
        duty += tduty[i]+' '+tduty[i+1]+' ';
	}
     }// next i
  } else {
       // can not interpolate
        duty += tduty[0]+' '+tduty[1]+' ';
        nowH= tduty[1];
  }

// console.log('calcCurrentDuty ruty='+rduty );
// console.log('calcCurrentDuty duty='+duty );
  dH = '---H--- '+nowH;

 var rtxt = lamp+','+duty+','+pump+','+pwt+','+dH;
 console.log('calcCurrentDuty rtxt='+rtxt );
 return rtxt;
}

function h2m(t){
 var m=parseInt(String(t).split(':')[0])*60+parseInt(String(t).split(':')[1]);
 //console.log('t2m '+t+' = '+m);
 return m;
}

// 対象のファイルが変更された後の処理
function handlerWatch(){
    // readFileで対象ファイルを読み込んで表示
    if( isExistFile(longPeriodFileName)){
      fs.readFile( longPeriodFileName , callbackReadFile.bind(this) );
     } else {
      console.log('Error'+longPeriodFileName+' is not found');
      process.exit();
     }
}

function callbackReadFile ( err , data ) {
    // エラー処理
    if( err ) {
        console.log( 'ファイルが存在しません。1' );
        return;
    }
    // 結果表示
    console.log( 'ファイルが更新されました');
    // data parse
    doThis();
}

// save old data
var oldCultiData='';
var oldTempData='';

// do every 10 min
// do every time 
function doThis(){
    var txtTemp='';
    var txtITP='';

    console.log('----DOTHIS----'+(new Date().toFormat('YYYY-MM-DD HH24:MI:SS')) );

    txtITP=''; txtTemp='';

    [txtITP, txtTemp, startCalender, endCalender] = loadControlFile();

//    console.log('----DOTHIS---- txtITP='+txtITP);
//    console.log('----DOTHIS---- txtTemp='+txtTemp);

    if(txtITP==='') return;


    // find current data
    //startCanender <= today < endCalender

    var today=new Date().toFormat('YYYY-MM-DD');

    //console.log(today);
    startcalender=startCalender.split('\+');
    endcalender=endCalender.split('\+');

    var curNo=0;
    for(i=0;i<startcalender.length;i++){
      if(d2m(startcalender[i])<=d2m(today) && d2m(today)<d2m(endcalender[i])){
        curNo=i;
	}
    }// next i

console.log('start='+startcalender[curNo]+' today='+today+' end='+endcalender[curNo]+' curNo='+curNo);
//console.log('txtTemp='+txtTemp);
//console.log('txtITP='+txtITP);

    var txtitp=(String(txtITP).split('EOL'))[curNo];
    var txttemp=(String(String(txtTemp).replace(/,/g,'\n')).split('EOL'))[curNo];

    //
    // save  /home/coder/coder-dist/coder-base/config/saveTempController.txt
    //
    // targetTemp 24 start 00:00
    //    :
    // setPID Kp 800 Ki 0.05 Kd 0.012
    //
    
    console.log('-----TEMPFILE-------');
    console.log(tempFileName);
    console.log('txttemp=');
    console.log(txttemp);
    console.log('-----------------');
    
    // write out only data is different.
    //if(fwritesw && oldTempData !== txttemp){
   // console.log('write '+tempFileName+'\n'+txttemp);
    if(txttemp.indexOf('NaN')<0){
    fs.writeFileSync(
         tempFileName,
	txttemp);
	oldTempData=txttemp;
    }


    //
    // save  /home/coder/coder-dist/coder-base/config/saveITPController.txt
    // ---Lamp---  7:0 18:2, ....
    // ---Duty---  0:0 72, ....
    // ---Pump---  5:35, ....
    // PumpWorkTime:  42, ....
    
    console.log('------ITPFILE--------');
    console.log(itpFileName);
    console.log('txtitp=');
    console.log(txtitp);
    console.log('-----------------');


    // interpolate Duty in one day.
    if(intsw)
    	txtitp=calcCurrentDuty(txtitp);

    console.log('------ITPFILE interpolate--------');
    console.log(itpFileName);
    console.log('txtitp=');
    console.log(txtitp);
    console.log('-----------------');

    // write out only data is different.
    //if(fwritesw && oldCultiData!==txtITP){
    if(txtitp.indexOf('NaN')<0){
    //console.log('write '+itpFileName+'\n'+txtitp);
      fs.writeFileSync(
      	itpFileName,
      	txtitp);
	oldCultiData=txtITP;
    }

}

// main function
// return [txtITP, txtTemp, startCalender, endCalender];
function loadControlFile(){
    //if(testsw) console.log('loadControlFile\n'+longPeriodFileName);
    var txtTemp='';
    var txtITP='';
    var tempScheduleStart=[];
    var tempScheduleEnd=[];
    var startCalender=[], endCalender=[];
    var setPIDStart=[], setPIDEnd=[];
    var lampTimeStart=[],dutyTimeStart=[],pumpTimeStart=[], pumpWorkTimeStart=[];
    var lampTimeEnd=[],dutyTimeEnd=[],pumpTimeEnd=[], pumpWorkTimeEnd=[];
    var data, err;

    data='';
    lampTimeStart=[];
    dutyTimeStart=[];
    pumpTimeStart=[];
    pumpWorkTimeStart=[];

    lampTimeEnd=[];
    dutyTimeEnd=[];
    pumpTimeEnd=[];
    pumpWorkTimeEnd=[];

    setPIDStart=[];
    setPIDEnd=[];

    startCalender=[];
    endCalender=[];

    var cultiStartFilename='';
    var cultiEndFilename='';
    var tempStartFilename='';
    var tempEndFilename='';

    if( isExistFile(longPeriodFileName)){
            // ファイル更新チェックプロセスの開始
//if(testsw) console.log('file load= '+longPeriodFileName);
            data=fs.readFileSync(longPeriodFileName,'utf8');
// if(testsw) console.log('file watch start');
            // エラー処理
            if( err ) {
                console.log( 'ファイルが存在しません。1' );
                process.exit();
            }
            
    var data=String(data).replace(/\+/g,',');
    var col=String(data).split('EOL');
    if(col[col.length-1]=='') col.pop();
    //console.log('ZZZZZZZZZZZZZZZ');
    //console.log('col='+col);


    var sens=[];
    for(i=0;i<col.length;i++){
	 sens.push(col[i].split(','));
    	 if(sens[i][sens[i].length-1]=='') sens[i].pop();
   // console.log('sens['+i+']='+sens[i]);
	}

//sens[0]=No.0,2018-09-02,daylight.xml,---Lamp--- 07:00 12:00|12:00 14:00|,---Duty--- 05:00 0|14:00 90|20:00 0|,---Pump--- 5:0 11:0 17:0 23:0 +pumpWrokTime 60,24.txt,targetTemp 24 start 00:00,setPID Kp 500 Ki 0.05 Kd 0.0125,2018-09-03,daylight.xml,---Lamp--- 07:00 12:00+12:00 14:00+---Duty--- 05:00 0+14:00 90+20:00 0+---Pump--- 5:0 11:0 17:0 23:0 +pumpWrokTime 60,const30.txt,targetTemp 30 start 0:0,setPID Kp 200 Ki 0.05 Kd 0.0125

    // sens[i][0]    : No.i
    // sens[i][1]    : STARTDAY "2018:01:01"
    // sens[i][2]    : cultivatipnPrg File name
    // sens[i][3]    : ---Lamp--- 7:0 21:00|12:00 14:00|
    // sens[i][4]    : ---Duty--- 0:0 90|1:0 60|2:0 30|
    // sens[i][4]    : ---Pump--- 5:0 11:0 17:0 23:0 
    // sens[i][5]    : pumpWrokTime 60
    // sens[i][6]    : tempSchedule File name
    // sens[i][7]    : targetTemp 5 start 00:00
    // sens[i][8]    :    : 
    // sens[i][n]    : setPID Kp 200 Ki 0.01 Kd 0.0025
    // sens[i][n+1]  : ENDDAY   "2018:01:02"
    // sens[i][n+2]  : cultivatipnPrg File name
    // sens[i][n+3]  : ---Lamp--- 7:0 21:00
    // sens[i][n+4]  : ---Duty--- 0:0 90
    // sens[i][n+5]  : ---Pump--- 5:0 11:0 17:0 23:0 
    // sens[i][n+6]  : pumpWrokTime 60
    // sens[i][n+7]  : tempSchedule File name
    // sens[i][n+8]  : targetTemp 5 start 00:00
    // sens[i][n+m]  :    : 
    // sens[i][last] : setPID Kp 200 Ki 0.01 Kd 0.0025
    
            for( i = 0; i < sens.length; i++){
//  console.log('UUUUUUUUUUUUUUUUUUUUUUUUUUUUUU');
//  console.log('['+i+'] '+sens[i]);
//console.log('CCCCCCCCCCCCC sens['+i+'].length='+sens[i]);
               sens[i]=String(sens[i]);

		j=2;
	// load cultiEndschedule
		cp=String(sens[i]).split(',');

    		cultiStartFilename=sens[i][j++];

                // set cultivationPrg
		//---Lamp--- 7:0 21:00
//    console.log('CCCCCCCCCCCCC cp lamp ='+cp[j]);
		lampTimeStart+=cp[j++].replace('---Lamp--- ','').split(' ');

//  console.log('CCCCCCCCCCCCC cp duty='+cp[j]);
		//---Duty--- 0:0 90
		dutyTimeStart+=cp[j++].replace('---Duty--- ','').split(' ');

		//---Pump--- 0:0 90
		pumpTimeStart+=cp[j++].replace('---Pump--- ','').split(' ');

		//pumpWrokTime 60
		pumpWorkTimeStart+=(String(cp[j++]).replace('pumpWrokTime ','').split(' '));

//console.log('CCCCCCCCCCCCC    lampTimeStart='+lampTimeStart);
//console.log('CCCCCCCCCCCCC    dutyTimeStart='+dutyTimeStart);
//console.log('CCCCCCCCCCCCC    pumpTimeStart='+pumpTimeStart);
//console.log('CCCCCCCCCCCCC    pumpWorkTimeStart=='+pumpWorkTimeStart);

                // set temp schedule
		var j=7;
                tempStartFilename=cp[j];
//console.log('tempStartFilename='+tempStartFilename);
		j++;
                for(;;j++){
                if(String(cp[j]).indexOf('targetTemp')>=0){
                  tempScheduleStart += String(cp[j]).split(' ')+',';
//console.log('---- cp='+cp[j]);
		  continue;
		  } else break;
		}// next j

                tempScheduleStart=tempScheduleStart.slice(0,-1);// remove ' '
                tempScheduleStart += '|';// separater

      // tempschedule='TargetTemp,17,start,00:00+targetTemp,5,start,00:00|TargetTemp,17,start,00:00+targetTemp,5,start,00:00|'

//console.log('tempScheduleStart='+tempScheduleStart);

		// setPID
		if(String(cp[j]).indexOf('setPID')>=0){
			setPIDStart+=(String(cp[j]).replace('setPID ','').split(' '));
	  		j++;
		}

          // set STARTDAY
	  if(cp[cp.length-1]==='') cp.pop();
//console.log('ZZZZZZZZZZZZ');

          var STARTIDC='', ENDIDC='';
          for(var k=0;k<cp.length;k++){
//console.log('startCalender cp['+k+']='+cp[k]);
	  if(STARTIDC==='' && cp[k].indexOf('.xml')>=0){ STARTIDC=k-1;continue;}
	  if(ENDIDC===''   && cp[k].indexOf('.xml')>=0){ ENDIDC=k-1;break;}
	  }

          startCalender += cp[STARTIDC];
//console.log('cp='+cp[STARTIDC]);
//console.log('startCalender='+cp[STARTID]+' STARTID='+STARTID);
          // set ENDDAY
//console.log('endCalender='+cp[ENDID]+' ENDID='+ENDID);
          endCalender+= cp[ENDIDC];
//console.log('endCalender='+endCalender);


          var STARTIDT='', ENDIDT='';
          for(var k=0;k<cp.length;k++){
	  if(STARTIDT==='' && cp[k].indexOf('.txt')>=0){ STARTIDT=k;continue;}
	  if(ENDIDT===''   && cp[k].indexOf('.txt')>=0){ ENDIDT=k;break;}
	  }

	// load tempScheduleEnd
		j=ENDIDT;
                tempEndFilename=cp[j++];
//console.log('tempEndFilename='+tempEndFilename);

                for(;;j++){
//console.log('cp['+j+']='+cp[j]);
//console.log('cp.length='+cp.length);
                if(String(cp[j]).indexOf('targetTemp')>=0){
                  tempScheduleEnd += String(cp[j]).split(' ');
//console.log('---- cp['+j+']='+cp[j]);
		  continue;
		  } else break;
		}// next j
                tempScheduleEnd += '|';// separater

		// setPID
		if(String(cp[j]).indexOf('setPID')>=0){
			setPIDEnd+=(String(cp[j]).replace('setPID ','').split(' '));
//console.log('setPIDEnd '+setPIDEnd);
	  		j++;
		}
//console.log('tempScheduleEnd='+tempScheduleEnd);
//console.log('setPIDEnd='+setPIDEnd);

	// load cultiEndschedule
		j=ENDIDC+1;

    		cultiEndtFilename=String(cp[j++]);
//console.log('CCCCCCCCCCCC        cultiEndtFilename ='+cultiEndtFilename);
                // set cultivationPrg
		//---Lamp--- 7:0 21:00
//console.log('cp lamp ='+cp[j]);
		lampTimeEnd +=(String(cp[j++]).replace('---Lamp--- ','').split(' '));

		//---Duty--- 0:0 90
		dutyTimeEnd+=(String(cp[j++]).replace('---Duty--- ','').split(' '));

//console.log('CCCCCCCCCCCCC  PUMP  cp='+cp[j]);
		//---Pump--- 0:0 90
		pumpTimeEnd+= (String(cp[j++]).replace('---Pump--- ','').split(' '));
//console.log('CCCCCCCCCCCCC    pumpTimeEnd='+pumpTimeEnd);

		//pumpWrokTime 60
		pumpWorkTimeEnd+=(String(cp[j++]).replace('pumpWrokTime ','').split(' '));



            if(i < sens.length-1){
    		lampTimeStart+=('+');
    		dutyTimeStart+=('+');
    		pumpTimeStart+=('+');
    		pumpWorkTimeStart+=('+');

    		lampTimeEnd+=('+');
    		dutyTimeEnd+=('+');
    		pumpTimeEnd+=('+');
    		pumpWorkTimeEnd+=('+');

		tempScheduleStart+=('+');
		tempScheduleEnd+=('+');
		setPIDStart+=('+');
		setPIDEnd+=('+');
		startCalender+=('+');
		endCalender+=('+');
		}
          }// next i
    
    // check

    if(testsw){
    console.log('-------------');
    console.log('lampTimeStart='+lampTimeStart);
    console.log('dutyTimeStart='+dutyTimeStart);
    console.log('pumpTimeStart='+pumpTimeStart);
    console.log('pumpWorkTimeStart='+pumpWorkTimeStart);
    console.log('lampTimeEnd='+lampTimeEnd);
    console.log('dutyTimeEnd='+dutyTimeEnd);
    console.log('pumpTimeEnd='+pumpTimeEnd);
    console.log('pumpWorkTimeEnd='+pumpWorkTimeEnd);
    console.log('tempScheduleStart='+tempScheduleStart);
//    console.log('tempScheduleStart.length='+tempScheduleStart.length);
    console.log('setPIDStart= '+setPIDStart);
    console.log('tempScheduleEnd='+tempScheduleEnd);
//    console.log('tempScheduleEnd.length='+tempScheduleEnd.length);
    console.log('setPIDEnd= '+setPIDEnd);
    console.log('startCalender='+startCalender);
    console.log('endCalender='+endCalender);
    console.log('--------------');
    }
    
    //
    //console.log('---calcITPCommands----');
    var clampTime='',cdutyTime='',cpumpTime='',cpumpWorkTime='';

/*
    console.log('loadControlFile pumpTimeStart='+pumpTimeStart);
    console.log('loadControlFile pumpTimeEnd='+pumpTimeEnd);
*/
    [clampTime,cdutyTime,cpumpTime,cpumpWorkTime] = 
        calcITPCommands(lampTimeStart,dutyTimeStart,pumpTimeStart,pumpWorkTimeStart,
        		lampTimeEnd,dutyTimeEnd,pumpTimeEnd,pumpWorkTimeEnd,
			startCalender,endCalender);

/*
    console.log('ZZZZZZZZZZZZZZZZZZ');
    console.log('loadControlFile cpumpTime='+cpumpTime);
    console.log('ZZZZZZZZZZZZZZZZZZ');
*/
//console.log('XXXXXXXXXXXXXXXXXX');
//    console.log('loadControlFile clampTime '+clampTime);
//    console.log('loadControlFile cdutyTime '+cdutyTime);
//    console.log('loadControlFile cpumpTime '+cpumpTime);
//    console.log('loadControlFile cpumpWorkTime '+cpumpWorkTime);
//    console.log('XXXXXXXXXXXXXXXXXX');

//    console.log('---calcTempCommands----');
    var ctempTime,csetPID;
    [ctempTime,csetPID]=
    	calcTempCommands(tempScheduleStart,setPIDStart,tempScheduleEnd,setPIDEnd,startCalender,endCalender);
    
//console.log('loadControlFile csetPID='+csetPID);
    //
    txtTemp='';
    for( i = 0; i < sens.length; i++){
                txtITP+='---Lamp--- '+String(clampTime[i]).replace(/,/g,' ')+',';
                txtITP+='---Duty--- '+String(cdutyTime[i]).replace(/,/g,' ')+',';
		txtITP+='---Pump--- '+String(cpumpTime[i]).replace(/,/g,' ')+',';
                txtITP+='pumpWrokTime '+cpumpWorkTime[i]+'EOL';

                // set temp schedule
		// filename
                // ctempTime[i]='20.0,12:00 15.0,14:00 ....
                //
/*
console.log('ZZZZZZZZZZZZZZZZZZ');
console.log('loadControlFile sens['+i+']='+sens[i]);
console.log('loadControlFile sens.length='+sens.length);
console.log('loadControlFile tempScheduleStart.length='+tempScheduleStart.length);
console.log('loadControlFile ctempTime='+ctempTime);
console.log('loadControlFile ctempTime.length='+ctempTime.length);
console.log('loadControlFile ctempTime[i]='+ctempTime[i]);
*/
                var ct=String(ctempTime[i]).split(' ');
    
                for(j=0;j<ct.length;j++){
		cct=String(ct).split(',');
		txtTemp += 'targetTemp '+cct[0]+' start '+cct[1]+'\n';
		}

                txtTemp += 'setPID '+String(csetPID[i]).replace(' ','').replace(/,/g,' ')+'EOL';
	//////
    }// next i

    /*
    console.log( '==============');
    console.log( 'DateTime '+(new Date().toFormat('YYYY-MM-DD HH24:MI:SS')));
    console.log( 'txtTemp '+txtTemp);
    console.log( 'txtITP '+txtITP);
    console.log( '==============');
     */
     return [txtITP, txtTemp, startCalender, endCalender];
     }// end if
     else {
     console.log('File Error');
     return [null, null, null, null];
     }
}

function calcTempCommands(tempScheduleStart,setPIDStart,tempScheduleEnd,setPIDEnd,startCalender,endCalender){
     var n=0;
/*
     console.log('HHHHHHHHHHHHHHHHHHHHHHHHHHH');
     console.log('calcTempCommands tempScheduleStart='+tempScheduleStart);
     console.log('calcTempCommands tempScheduleStart.length='+tempScheduleStart.length);
     console.log('calcTempCommands tempScheduleEndh='+tempScheduleEnd);
     console.log('calcTempCommands tempScheduleEndh.length='+tempScheduleEnd.length);
     console.log('calcTempCommands tempScheduleEnd='+tempScheduleEnd);
     console.log('calcTempCommands tempScheduleEnd.length='+tempScheduleEnd.length);

*/

     setPIDStart=String(setPIDStart).split('\+');
     setPIDEnd=String(setPIDEnd).split('\+');
     startCalender=String(startCalender).split('\+');
     endCalender=String(endCalender).split('\+');

	// check length	
        var tempScheduleStart=String(tempScheduleStart).split('|');
        var tempScheduleEnd=String(tempScheduleEnd).split('|');

        // calc current temp data
	//ctempTime,csetPID=
        return getCurrentTemp(tempScheduleStart,setPIDStart, tempScheduleEnd,setPIDEnd,startCalender,endCalender);
}


function calcITPCommands(
	lampTimeStart,dutyTimeStart,pumpTimeStart,pumpWorkTimeStart,
	lampTimeEnd,dutyTimeEnd,pumpTimeEnd,pumpWorkTimeEnd,
	startCalender,endCalender){


//07:00,12:00|12:00,09:00|+07:00,12:00|
	lampTimeStart=String(lampTimeStart).split('\+');
//07:00,12:00|12:00,09:00|
        for(i=0;i<lampTimeStart.length;i++){
		lampTimeStart[i]=String(lampTimeStart[i]).split('|');
		//lampTimeStart[i]= xx;
//console.log('<<<<<<<<<<<  lanmpTimeStart[i]='+lampTimeStart[i]);
// lampTimeStart[i]=07:00,12:00,12:00,18:00,
	}

// sort by start
	if(sortsw) lampTimeStart=mySort(lampTimeStart);

	dutyTimeStart=String(dutyTimeStart).split('\+');
// dutyTimeStart[i]=05:00,0,14:00,90,20:00,0,
        for(i=0;i<dutyTimeStart.length;i++){
    		dutyTimeStart[i]=String(dutyTimeStart[i].split('|'));
//console.log('<<<<<<<<<<<  dutyTimeStart[i]='+dutyTimeStart[i]);
	}

// sort by start
	if(sortsw) dutyTimeStart=mySort(dutyTimeStart);

	pumpTimeStart=String(pumpTimeStart).split('\+');
	pumpWorkTimeStart=String(pumpWorkTimeStart).split('\+');

	lampTimeEnd=String(lampTimeEnd).split('\+');
        for(i=0;i<lampTimeEnd.length;i++){
    		lampTimeEnd[i]=String(lampTimeEnd[i]).split('|');// lampTimeStart[i]=[[start],[end]] 
//console.log('<<<<<<<<<<<  lanmpTimeEnd[i]='+lampTimeEnd[i]);
	}
// sort by start
	if(sortsw) lampTimeEnd=mySort(lampTimeEnd);

	dutyTimeEnd=String(dutyTimeEnd).split('\+');
        for(i=0;i<dutyTimeEnd.length;i++){
    		dutyTimeEnd[i]=String(dutyTimeEnd[i]).split('|');// dutyTimeStart[i]=[[start],[pwm]] 
//console.log('dutyTimeEnd[i]='+dutyTimeEnd[i]);
	}
// sort by start
	if(sortsw) dutyTimeEnd=mySort(dutyTimeEnd);

	pumpTimeEnd=String(pumpTimeEnd).split('\+');
	pumpWorkTimeEnd=String(pumpWorkTimeEnd).split('\+');

	startCalender=String(startCalender).split('\+');
	endCalender=String(endCalender).split('\+');

	// check length	
//if(testsw) console.log('lanmpTime0='+lampTime);

        // calc current Lamp data
        var clampTime,cdutyTime,cpumpTime,cpumpWorkTime;

        [clampTime,cdutyTime,cpumpTime,cpumpWorkTime] =
          getCurrentLamp(lampTimeStart,dutyTimeStart,pumpTimeStart,pumpWorkTimeStart,
          		 lampTimeEnd,dutyTimeEnd,pumpTimeEnd,pumpWorkTimeEnd,startCalender,endCalender);

//console.log('calcITPCommands clampTime '+clampTime);
//console.log('calcITPCommands cdutyTime '+cdutyTime);
        return [clampTime,cdutyTime,cpumpTime,cpumpWorkTime];
}

function calcDelta(st0, en0){
        st = String(st0).replace(/-/g,' ').split(' ');
        en = String(en0).replace(/-/g,' ').split(' ');
        //console.log('calcDelta st='+st0+' en='+en0);
    	now = new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
        now = now.replace(/-/g,' ');
        now = now.replace(/:/g,' ');
        now = String(now).split(' ');

//console.log('Y='+now[0]+' M='+ now[1] +' D='+ now[2]+' H='+ now[3]+' M='+ now[4]+' S='+ now[5] );

        now= new Date(now[0],parseInt(now[1])-1,now[2],now[3],now[4],now[5] );
        //console.log('calcDelta now2='+now);

        // start time
        var b= new Date(st[0],parseInt(st[1])-1,st[2],0,0,0 );

        // end time
        var c= new Date(en[0],parseInt(en[1])-1,en[2],0,0,0 );

	var st= b.getTime() ;
	var nt= now.getTime();
	var et= c.getTime();

        var A=parseFloat( nt - st );
        var B=parseFloat( et - st );


/*  this is not error
 
        if( A < 0 ){
        //console.log('calcDelta A='+A);
        console.log('A calcDelta start='+ (st/100000) +' now='+ (nt/100000) +' end='+(et/100000) );
        console.log('A calcDelta start='+ b +' now='+ now +' end='+c );
        A = -A;
        }

        if( B < 0 ){
        //console.log('calcDelta B='+B);
        console.log('B calcDelta start='+ (st/100000) +' now='+ (nt/100000) +' end='+(et/100000) );
        B = -B;
        }
*/

	var rv=parseFloat(A/B);
	if( rv < 0.0 ) rv = 0.0;
	if( rv < 1.0 ) rv = 1.0;
        return rv;
}


function getCurrentTemp(tempScheduleStart,setPIDStart,tempScheduleEnd,setPIDEnd,startCalender,endCalender){
  var ctempTime=[];
  var lstart=[], ltemp=[];
  var delta=0.0;
  var n=0;


// temp change

// remove last null
 for(i=tempScheduleStart.length-1;i>=0;i--){
	if(String(tempScheduleStart[i])===''){// need String cast
	 tempScheduleStart.pop();
		}
	}
 for(i=tempScheduleEnd.length-1;i>=0;i--){
	if(String(tempScheduleEnd[i])===''){// need String cast
	 tempScheduleEnd.pop();
		}
	}


/*
for(i=0;i<tempScheduleStart.length;i++){
console.log('tempScheduleStart['+i+']=|'+tempScheduleStart[i]+'|');
console.log('tempScheduleStart.length['+i+']='+tempScheduleStart[i].length);
}
*/

ctempTime=[], csetPID=[];
  for(i=0;i<tempScheduleStart.length;i++){
  ctempTime[i]=''; csetPID[i]='';

// tempScheduleStart =[ 'targetTemp',t,'start',0:0 ]
//console.log('tempScheduleEnd['+i+']='+tempScheduleEnd[i]);

     delta=calcDelta(startCalender[i],endCalender[i]);

     tempScheduleStart[i]=String(tempScheduleStart[i]);
     tempScheduleEnd[i]=String(tempScheduleEnd[i]);

/*
console.log('tempScheduleStart['+i+'].split='+tempScheduleStart[i].split(','));
console.log('tempScheduleStart['+i+'].split.length='+tempScheduleStart[i].split(',').length);
console.log('tempScheduleEnd['+i+'].split='+tempScheduleEnd[i].split(','));
console.log('tempScheduleEnd['+i+'].split.length='+tempScheduleEnd[i].split(',').length);
*/

     var ts=String(tempScheduleStart[i]).split(',');
     var te=String(tempScheduleEnd[i]).split(',');

/*
console.log('XXXXX ts='+ts);
console.log('XXXXX ts.length='+ts.length);
console.log('XXXXX te.length='+te.length);
*/

// make same length array
     if(ts.length >= te.length){
         var dd=ts.length-te.length;
         var s=te.length;
       // copy element
	for(d=0;d<dd;d++){
          te.push(String(ts[s+d]));
         if(d % 4 == 3){
          te[s+d]=m2t(t2m(ts[s+d-4])-t2m(ts[s+d]));
	      }
          }// next d

      } else if(ts.length < te.length){
	for(d=0;d<dd;d++){
          ts.push(String(te[s+d]));
         if(d % 4 == 3){
          ts[s+d]=m2t(t2m(te[s+d-4])-t2m(te[s+d]));
	      }
          }// next d
      }// te


     // 3,7,11,...
     // 3,7,11,...

   for(d=0;d<parseInt(ts.length/4);d++){
     // ctempTime[i]=[targetTemp, startTime]

    te[1+4*d]=parseFloat(te[1+4*d]);
    ts[1+4*d]=parseFloat(ts[1+4*d]);


    // ctempTime[i] 'targetTemp, start'
     ctempTime[i]+= String((delta*(te[1+4*d]-ts[1+4*d])+ts[1+4*d]).toFixed(1)) + ','
			+String(m2t(delta*(t2m(te[3+4*d])-t2m(ts[3+4*d]))+t2m(ts[3+4*d])))+' ';

//console.log('ctempTime.length='+ctempTime.length);
//console.log('ctempTime['+i+']=' + ctempTime[i]);
//console.log('targetTemp '+ctempTime[i][0]+' start '+ctempTime[i][1]);
//console.log('ctempTime2['+i+']= '+ctempTime[i]);
//console.log('ctempTime3 '+ctempTime);

	  }// next d
      ctempTime[i]=ctempTime[i].slice(0,-1);// remove last space
     }// next i

//console.log('ctempTime '+ctempTime);
//console.log('getCurrentTemp ctempTime='+ctempTime);
//console.log('getCurrentTemp ctempTime.length='+ctempTime.length);

     // PID change
  csetPID=[], lKp=[], lKi=[], lKd=[];

//console.log('setPID='+setPID);
//console.log('setPID.length='+setPID.length);

  for(i=0;i<setPIDStart.length;i++){
     // Kp  float Ki float Kd float
     var pid=[String(setPIDStart[i]).split(','), String(setPIDEnd[i]).split(',')];
     lKp[0]=parseFloat(pid[0][1]);
     lKp[1]=parseFloat(pid[1][1]);
     lKi[0]=parseFloat(pid[0][3]);
     lKi[1]=parseFloat(pid[1][3]);
     lKd[0]=parseFloat(pid[0][5]);
     lKd[1]=parseFloat(pid[1][5]);

//if(testsw){
//		console.log('lKp='+lKp);
// 	console.log('lKi='+lKi);
// 	console.log('lKd='+lKd);
//	}

     delta=calcDelta(startCalender[i],endCalender[i]);

     // setPID[i]=[ Kp,float,Ki,float,Kd,float ]
     csetPID[i]= ['Kp',(delta*(lKp[1]-lKp[0])+lKp[0]).toFixed(2), 
                  'Ki',(delta*(lKi[1]-lKi[0])+lKi[0]).toFixed(5),
                 ' Kd',(delta*(lKd[1]-lKd[0])+lKd[0]).toFixed(5)];

 //    console.log('csetPID['+i+']= Kp '+csetPID[i][1]+' Ki '+csetPID[i][3]+' Kd '+csetPID[i][5]);
	}
	return [ctempTime,csetPID];
}

// calc todat's setting
function getCurrentLamp(lampTimeStart,dutyTimeStart,pumpTimeStart,pumpWorkTimeStart,
			lampTimeEnd,dutyTimeEnd,pumpTimeEnd,pumpWorkTimeEnd,startCalender,endCalender){

  var clampTime=[[],[]];
  var cdutyTime=[[],[]];
  var cpumpTime=[];
  var cpumpWorkTime=[];
  var lstart=[], lend=[];
  var dstart=[], dpwm=[];
  var pstart=[];
  var pwstart=[];
  var pwtime=[];
  var delta=0.0;
  var n=0;

     // lamp change
  var lp=[];
  for(i=0;i<lampTimeStart.length;i++){
     lp[0]=String(lampTimeStart[i]).split(',');
     lp[1]=String(lampTimeEnd[i]).split(',');

     delta=calcDelta(startCalender[i],endCalender[i]);

     clampTime[i]=[];

     for(j=0;j<lp[0].length-1;j+=2){
     lstart[0]=lp[0][j]; lend[0]  =lp[0][j+1];
     lstart[1]=lp[1][j]; lend[1]  =lp[1][j+1];

     // clampTime[i]=[lstart, lend]
//console.log('[1] '+ delta*(t2m(lstart[1])-t2m(lstart[0]))+t2m(lstart[0]));
//console.log('[1] '+ delta*(t2m(lstart[1])-t2m(lstart[0]))+t2m(lstart[0])+' [2] '+ delta*(t2m(lend[1])-t2m(lend[0]))+t2m(lend[0]))

     clampTime[i][j/2]=[];
     clampTime[i][j/2]=[delta*(t2m(lstart[1])-t2m(lstart[0]))+t2m(lstart[0]), delta*(t2m(lend[1])-t2m(lend[0]))+t2m(lend[0])];

     clampTime[i][j/2]=[m2t(clampTime[i][j/2][0]),m2t(clampTime[i][j/2][1])];

//console.log('getCurrentLamp clampTime='+clampTime);
//console.log('getCurrentLamp clampTime.length='+clampTime.length);
//console.log('GGGGGGGGGGGGGGGGGG    clampTime['+(i)+']['+(j/2)+']='+ clampTime[i][j/2]);


	}// next j
     }// next i

     // duty change
  for(i=0;i<dutyTimeStart.length;i++){
     // duty change
//console.log('dutyTimeStart['+(i)+']='+dutyTimeStart[i]);

     lp[0]=String(dutyTimeStart[i]).split(',');
     lp[1]=String(dutyTimeEnd[i]).split(',');

     delta=calcDelta(startCalender[i],endCalender[i]);

     cdutyTime[i]=[];

     for(j=0;j<lp[0].length-1;j+=2){
     dpwm[0]=lp[0][j+1]; dstart[0]  =lp[0][j];
     dpwm[1]=lp[1][j+1]; dstart[1]  =lp[1][j];

/*
if(testsw){
console.log('dstart[0]='+dstart[0]+' dpwm[0]='+dpwm[0]);
console.log('dstart[1]='+dstart[1]+' dpwm[1]='+dpwm[1]);
	// cdutyTime[i]=[start, PWM]
     }
console.log('t2m(dstart[0]='+parseFloat(t2m(dstart[0]))); 
console.log('parseFloat(t2m(dstart[1])='+parseFloat(t2m(dstart[1]))); 
console.log('['+(i)+']['+(j/2)+']='+m2t(parseInt(delta*parseFloat(t2m(dstart[1])-t2m(dstart[0]))+parseFloat(t2m(dstart[0])))) ); 
*/

     cdutyTime[i][j/2]=[];
     cdutyTime[i][j/2]=
	[m2t(parseInt(delta*parseFloat(t2m(dstart[1])-t2m(dstart[0]))+parseFloat(t2m(dstart[0])))), 
        parseInt(delta*parseFloat(dpwm[1]-dpwm[0])+parseFloat(dpwm[0])) ];

//console.log('cdutyTime['+i+']='+cdutyTime[i]);
	}// next j
    }// next i

     // pump change
  for(i=0;i<pumpTimeStart.length;i++){

     pumptime1=String(pumpTimeStart[i]).split(',');
     pumptime1.length=pumptime1.length-1;
//console.log('pumptime='+pumptime1);
     pumptime2=String(pumpTimeEnd[i]).split(',');
     pumptime2.length=pumptime2.length-1;

     cpumpTime[i]=[];
     for(j=0;j<pumptime1.length;j++){
     pstart[0]=pumptime1[j];
     pstart[1]=pumptime2[j];
//console.log('pstart='+pstart);
     // cdutyTime[i]=[start]

     delta=calcDelta(startCalender[i],endCalender[i]);

     cpumpTime[i].push( m2t(delta*parseFloat(t2m(pstart[1])-t2m(pstart[0]))+parseFloat(t2m(pstart[0]))) );
     }
//console.log('cpumpTime['+i+']='+cpumpTime[i]);
    }// next i

     // pumpWorkTime change
  for(i=0;i<pumpWorkTimeStart.length;i++){
     pwstart[0]=parseInt(String(pumpWorkTimeStart[i]).split(',')[0]);
     pwstart[1]=parseInt(String(pumpWorkTimeEnd[i]).split(',')[0]);
     // cpumpWorkTime[i]=[start]
     cpumpWorkTime[i]=parseInt(delta*parseFloat(pwstart[1]-pwstart[0])+parseFloat(pwstart[0])); 
//console.log('cpumpWorkTime['+i+']='+cpumpWorkTime[i]); 
	}// next i 

//console.log('getCurrentLamp clampTime='+clampTime);
    return [clampTime,cdutyTime,cpumpTime,cpumpWorkTime];
}

function m2t(t){
// msec -> 12:34
  mm=parseInt(t/1000);// sec
  mm=parseInt(mm/60) % (60*24);//min
  h = parseInt(mm/60);
  while( h < 0 ) h += 24;
  m = parseInt(mm % 60);
  while( m < 0 ) m += 60;
  return h+':'+m
}

function t2m(t){
 // 12:34  ->  12*60+34
  try{
  tt=String(t).split(':');
//console.log('t2m '+tt);
  tm = 60*parseInt(tt[0])+parseInt(tt[1]);
  tm = tm * 60 * 1000;
//console.log('t2m '+tm);
  return parseInt(tm);
  } catch(e){
//console.log('t2m '+t);
  }
}

function m2d(d){
var d = new Date(d);
 var dd=d.toFormat('YYYY-MM-DD HH24:MI:SS');
// console.log(d.toFormat('YYYY-MM-DD HH24:MI:SS'));
 return dd;
}

function d2m(t){
// day -> msec
//console.log('d2m t='+ t );
  nxt = new Date(t).getTime();
//console.log('d2m nxt2='+ nxt );
  dt = parseInt(nxt);
//console.log('d2m dt='+dt );
  return dt;
}

function getTimeDate(){
        var now = new Date().toLocaleString();
        return now;
}

function getDateTime(){
  return new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
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

function finalJob(){
    console.log('finalJob '+getTimeDate());
    console.log('finalJob longPeriodControl.js  I will exit.');
    
    //var newName=get_logFileName(getTimeDate());
    //fs.renameSync(logFileName, newName);
    process.exit();
}

process.on('SIGINT', function () {
           console.log('SIGINT');
           finalJob();
});

process.on('SIGHUP', function() {
           console.log('SIGHUP');
           finalJob();
});

process.on('SIGUSR2', function() {
           console.log('SIGUSR2');
           finalJob();
});

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
      } catch(err) {
      if(err.code === 'ENOENT') return false
      }
}

// sendcom 
function sendcom(n, com){
    command='sudo /home/pi/src/ITBOX/ITPsetting.py -No '+n+' '+com;
    execSync = require('child_process').execSync;
    result =  execSync(command);
    return result;
}


startStopDaemon(function() {
////
    process.argv.forEach(function(val, index, array) {
    	if(index >= 2){
        if(val=='-t'){
		testsw=true;// printout debug info
			}
        if(val=='-nw'){
		fwritesw=false;// no write to saveLongPeriodSchedule.txt
			}
		}
        if(val=='-nl'){
		logsw=false;// no write to longPeriodSchedule.log
			}
        if(val=='-ni'){
		intsw=false;// no interpolate PWM 
			}
        if(val=='-rt'){
		repeatTime=parseInt(array[index+1]);//  repeatTime (sec) 
			}
        if(val=='-h'){
 	console.log( process.argv[1]+' -t -nw -nl -ni -rt repeattime[msec]\n');
 	console.log( ' -t : test mode -nw : no write to file -nl : no write to log -ni no interpolate -rt repeatTime[sec]\n');
        process.exit();
			}
	});

// loadControlFile
    doThis();

    if(repeat) clearInterval(repeat);
     repeat=setInterval(function (){
	doThis();
        }, 1000*repeatTime);
});
