#!/usr/local/bin/node

var black   = '\u001b[30m';
var red     = '\u001b[31m';
var green   = '\u001b[32m';
var yellow  = '\u001b[33m';
var blue    = '\u001b[34m';
var magenta = '\u001b[35m';
var cyan    = '\u001b[36m';
var white   = '\u001b[37m';

var reset   = '\u001b[0m';

Controller = require('node-pid-controller');

// target temprature
targetTemp=20.0;

function measureFromSomeSensor(){

const execSync = require('child_process').execSync;
	result =  execSync("./BME280.py|awk '{print $6}'");
	sensor=result.toString();
	return sensor;
}

function applyInputToActuator(input){
//
pwm = parseInt(Math.abs(input*100));

if( input < 0 ) 
	dir = 0; // cool
else 
	dir = 1; // hot

console.log('applyInputToActuator');
if(dir == 1)
	console.log('input',input.toFixed(2),'pwm ',pwm.toFixed(2),'dir ',red+dir+reset);
else
	console.log('input',input.toFixed(2),'pwm ',pwm.toFixed(2),'dir ',blue+dir+reset);
        if( pwm > 1000 ) pwm = 1000;
//	if( pwm > 800 ) pwm = 800;
	if( dir == 1 && pwm > 300 )  pwm = 300;
console.log('input',input.toFixed(2),'pwm ',pwm.toFixed(2),'dir ',dir);

const execSync = require('child_process').execSync;
const result =  execSync('./peltier.py '+pwm+' '+dir);
console.log(result.toString());

}

function freeezedFan(){
	ret = false;// unfreeze
	const execSync = require('child_process').execSync;
	const result =  execSync("./DS18B20.py|awk '{print $4, $7}'");
	console.log('freeezedFan ');
	sensor = parseFloat(result);
	console.log(sensor);
	if( sensor[0] < 0.0 || sensor[1] < 0.0 ){
		 ret=true;// freeze 
		console.log('Freesed Fan');
	} else {
	 	ret=false;// unfreeze
	}
	return ret;	
}

function uncondensation(){
	execSync = require('child_process').execSync;
	result =  execSync("./BME280.py |awk '{print $2,$4,$6}'");
	console.log('uncondensation BME280 ');
	sensor=result.toString().split(' ');

 	hum   = parseFloat(sensor[0]);
	press  = parseFloat(sensor[1]);
	temp = parseFloat(sensor[2]);

	console.log('hum ',hum,' temp ',temp, 'press ',press);

	Pws=6.1078*Math.pow(10,(7.5*temp)/(237.2+temp));
	Pw = Pws*hum/100.0;
	Dair=press*100.0/(287.0*(273.15+temp));
	Mratio=6.22*Pw/press;
	AH = Pw*100.0/(8.31447*(273.15+temp))*18.0;
	AH = AH/Dair;

	// Tetens  Pw ＝6.11 × 10 ^（0.75T/(237.3+ T) ）
	// T=237.3×log(Pw/6.11)/7.5＋log(6.11/Pw)
	Tcondensation = 237.3*Math.log(Pw/6.11)/7.5+Math.log(6.11/Pw);
	console.log("Pws ",Pws.toFixed(2),"Pw ",Pw.toFixed(2),"Dair ",Dair.toFixed(2));
	console.log("Mratio ",Mratio.toFixed(2),"AH ",AH.toFixed(2),"Tcondensation ",Tcondensation.toFixed(2));

	return Tcondensation;
}

function condensation(){
	condition = false;// uncondensation

	Tcondensation= uncondensation();

	// peltier temp
	const execSync = require('child_process').execSync;
	const result2 =  execSync("./DS18B20.py|awk '{print $4, $7}'");
	res = result2.toString().split(' ');
	sensor = parseFloat(res);

	console.log('condensation ');
	console.log('sensor=',sensor);

	dTemp = (sensor[0] < sensor[1]) ? sensor[0]:sensor[1];	
	if( Tcondensation > dTemp ) condition=true;// condensation	

	return condition;
}



ctr = new Controller({
  k_p: 0.25,
  k_i: 0.01,
  k_d: 0.01,
  dt: 1
});
//ctr = new Controller(0.25, 0.01, 0.01, 1);


ctr.setTarget(targetTemp); // 20deg

// get currentTemp from BME280
currentTemp = measureFromSomeSensor();
correction = ctr.update(currentTemp);

goalReached = false

while (!goalReached) {
  currentTemp = measureFromSomeSensor();
console.log('currentTemp=',currentTemp);
  input  = ctr.update(currentTemp);
console.log('ctr.update=',input.toFixed(2));
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


//  goalReached = (input === 0) ? true : false; 
	// in the case of continuous control, you let this letiable 'false' 
}

