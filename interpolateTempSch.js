#!/usr/local/bin/node

var fs = require('fs');
var filename ='saveTempController.txt';
var sprintf = require("sprintf-js").sprintf;

var argv=process.argv;
var intp=30;
if(argv.length>1){
	for(i=1;i<argv.length;i++){
	if(argv[i]=='-i') intp=parseInt(argv[i+1]);
	}
}

var text=[];

if(filename[0] != '/'){
	text = fs.readFileSync('/home/coder/coder-dist/coder-base/config/'+filename);
} else {
	text = fs.readFileSync(filename);
}

var lines1 = text.toString();
lines1=lines1.split('\n');

var time=[];
var tmp=[];
var j=0;
var endl0='';
for(i=0;i<lines1.length;i++){
    l=lines1[i].split(' ');
    //console.log(l);
    if(l[0] == 'targetTemp'){
    	tmp[j] =l[1];
    	a=l[3].split(':');
    	time[j]=parseInt(a[0])*60+parseInt(a[1]);
	//console.log(tmp[j]+' '+time[j]);
	j++;
	}
    if(l[0] == 'setPID') endl0=lines1[i];
}

for(i=0;i<tmp.length-1;i++){
	for(var m=0;m<intp;m++){
var tt=parseFloat(tmp[i+1]-tmp[i])/parseFloat(intp)*m+parseFloat(tmp[i]);
var tm=parseInt(parseFloat(time[i+1]-time[i])*parseFloat(m)/parseFloat(intp))+time[i];
    	 var s=sprintf("%.2f",tt);
    	console.log('targetTemp '+s+' start '+parseInt(parseFloat(tm)/60.0)+':'+parseInt(tm % 60 ));
	}
}
    	console.log(endl0);

