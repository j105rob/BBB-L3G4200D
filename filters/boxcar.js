var bcTaps = 25;
var numSamples = 0;
var bcX = new Array();
var bcY = new Array();
var bcZ = new Array();

function boxCar(data) {
	data = lowPass(data);
	if (numSamples < bcTaps) {
		bcX.push(data.x);
		bcY.push(data.y);
		bcZ.push(data.z);
		numSamples++;
		return data;
	}else{
		bcX.shift();
		bcY.shift();
		bcZ.shift();
		bcX.push(data.x);
		bcY.push(data.y);
		bcZ.push(data.z);
		var res = {x:0,y:0,z:0};
		for(var i=0;i<bcTaps-1;i++){
			res.x = res.x + bcX[i];
			res.y = res.y  + bcY[i];
			res.z = res.z + bcZ[i];
		};
		res.x = Math.round(res.x/bcTaps);
		res.y = Math.round(res.y/bcTaps);
		res.z = Math.round(res.z/bcTaps);
		//console.log(res);
		return res;
	}
	
};