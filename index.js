var app 	= require('express')();
var server 	= require('http').Server(app);
var io 		= require('socket.io')(server);
var Redis 	= require('ioredis');

server.listen(8890, function(){
    console.log('listening on 8890');
});

io.on('connection', function(client){
	console.log('Novo client conectado: '+client.id);

	redis = new Redis();
	redis.subscribe('channel');
	
	//client.on('channel', function(room){
	//	console.log('Entrou na sala', room);
	//	client.join(room);
	//})

	//client.on('unsubscribe', function(room){
	//	console.log('Saiu da sala', room);
	//	client.leave(room);
	//})

	//client.on('send', function(data){
	//	console.log('Enviou uma mensagem..');
	//	io.sockets.in(data.room).emit('message', data);
	//});
	

	
	  
	redis.on('message', function(channel, payload){
		console.log('log client', channel, payload);
		client.emit(channel, payload);
	});

	redis.on('disconnect', function(){
		redis.quit();
	});

	client.on('disconnect', function(){
		console.log("Cliente desconectado: "+client.id);
		redis.quit();
	});
});