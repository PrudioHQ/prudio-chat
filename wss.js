var wss    = "wss://ms32.slack-msgs.com/websocket/EtarCAxjgn_nrH0OxIX2AbTERBT8wJ4lbVORrQvf5IsJKs/CWe26sfa1OsY/7qjBvQKPVmrkIymxErrWmGXMiu5BMqwogtBhpMefwkqySbVsifwkg6DQY6abnNLJem40wGsA3Xvm4o4NWaZIM2typ7Ws/7kopHZFJ1TTKqjyrvh9dolenDZj6XB3O7Hfi9IxoQpy6HRTxE_27K2rNcJyPO63X2nqoNNdR6WBF2a_P5L4ddLQrBfAnnrgyrGLPhXj8yJCeERVwWhQ9r8EvNx2_Sw8IbCAmPvRbpSl4Yq0jLg=";
var io = require('socket.io-client');
var WebSocket = require('ws');
var ws = new WebSocket(wss);

ws.on('open', function() {
    console.log('Opened!!!')
});

ws.on('message', function(data, flags) {
	console.log(data);
    // flags.binary will be set if a binary data is received
    // flags.masked will be set if the data was masked
});

/*
console.log("Hello");


socket = io.connect(wss);

console.log(socket);

socket.on('connect', function(){

	console.log("Connect");
	
	socket.on('event', function(data){
		console.log("Data");
	});

	socket.on('disconnect', function(){
		console.log("Disconnect");
	});
});	
*/