
module.exports = function(app, io, request, models, xmpps) {

	//TODO
	
	setInterval(function() {
	  xmpps.emitMethod();
	}, 1000);
	
};
