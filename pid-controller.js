#!/usr/local/bin/node

PID = require('pid-controller');

// target temprature
targetTemp=20.0;

function measureFromSomeSensor(){

const execSync = require('child_process').execSync;
const result =  execSync("./BME280.py|awk '{print $6}'");
console.log(result);
	return result;
}

function applyInputToActuator(input){
//
pwm = parseInt(Math.abs(input*1000));

if( input < 0 ) 
	dir = 0; // cool
else 
	dir = 1; // hot

console.log('input',input,'pwm ',pwm,'dir ',dir);
//if( pwm > 1000 ) pwm = 1000;
	if( pwm > 200 ) pwm = 200;

const execSync = require('child_process').execSync;
const result =  execSync('./peltier.py '+pwm+' '+dir);
console.log(result);

}

function freeezedFan(){
	ret = false;// unfreeze
	const execSync = require('child_process').execSync;
	const result =  execSync("./DS18B20.py|awk '{print $4, $7}'");
	console.log(result);
	if( result[0] < 0.0 || result[1] < 0.0 ){
		 ret=true;// freeze 
		console.log('Freesed Fan');
	} else {
	 	ret=false;// unfreeze
	}
	return ret;	
}

function uncondensation(){
	const execSync = require('child_process').execSync;
	const result =  execSync("./BME280.py |awk '{print $2,$4,$6}'");
	console.log("BME280 ",result);

 	hum = result[0];
	temp = result[1];
	press = result[2];
	Pws=6.1078*Math.pow(10,(7.5*temp)/(237.2+temp));
	Pw = Pws*hum/100.0;
	Dair=press*100.0/(287.0*(273.15+temp));
	Mratio=6.22*Pw/press;
	AH = Pw*100.0*(8.31447*(273.15+temp))*18.0;

	// Tetens  Pw ＝6.11 × 10 ^（0.75T/(237.3+ T) ）
	// T=237.3×log(Pw/6.11)/7.5＋log(6.11/Pw)
	Tcondensation = 237.3*Math.log(Pw/6.11)/(7.5+Math.log(6.11/Pw));
	console.log("Pws ",Pws,"Pw ",Pw,"Dair ",Dair,"Mratio ",Mratio,"AH ",AH,"Tcondensation ",Tcondensation);

	return Tcondensation;
}

function condensation(){
	condition = false;// uncondensation

	Tcondensation= uncondensation();

	// peltier temp
	const execSync = require('child_process').execSync;
	const result2 =  execSync("./DS18B20.py|awk '{print $4, $7}'");
	dTemp = (result2[0] < result2[1]) ? result2[0]:result2[1];	
	if( Tcondensation > dTemp ) condition=true;// condensation	

	return condition;
}



var temperature = 10,
    temperatureSetpoint = 21,
    heating = 0.001,
    cooling = -0.0005;
 
var Kp = 500,
    Ki = 200,
    Kd = 0;

// get currentTemp from BME280
currentTemp = measureFromSomeSensor();

var ctr = new PID(currentTemp, temperatureSetpoint, Kp, Ki, Kd, 'direct'),
timeframe = 1000;

ctr.setTarget(targetTemp); // 20deg
ctr.setSampleTime(timeframe);
ctr.setOutputLimits(0, timeframe);
ctr.setMode('auto');


goalReached = false

while (!goalReached) {
  currentTemp = measureFromSomeSensor();
  input  = ctr.update(currentTemp);
  applyInputToActuator(input);

// check  freeze
  if( freeezedFan() ){
	ctr.setTarget(10.0); // set Target Temp 10deg for unfreeze
	} else {
	ctr.setTarget(targetTemp); // set Target Temp
	}

// check condensation
  if( condensation() ){
	// uncondensation
	unCondensationTemp = uncondensation(); 
	ctr.setTarget(unCondensationTemp); // set Target Temp
	} 


  goalReached = (input === 0) ? true : false; 
	// in the case of continuous control, you let this letiable 'false' 
}

