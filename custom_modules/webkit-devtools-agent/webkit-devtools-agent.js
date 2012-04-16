var WebSocketServer = require('ws').Server;
var agents = require('./lib');
var wss;

var port = process.env.DEBUG_PORT || 1337;
var host = process.env.DEBUG_HOST || '127.0.0.1';

exports.start = function() {
    wss = new WebSocketServer({port: port, host: host});

    console.log('webkit-devtools-agent started on %s:%s', host, port);

    wss.on('connection', function(socket) {
        socket.on('message', function(message) {
            try {
                message = JSON.parse(message);
            } catch(e) {
                console.log(e);
                return;
            }

            var id = message.id;
            var command = message.method.split('.');
            var domain = agents[command[0]];
            var method = command[1];
            var params = message.params;

            if (!domain || !domain[method]) {
                console.error('%s is not implemented', message.method);
                return;
            }

            domain[method](params, function(result) {
                socket.send(JSON.stringify({ id: id, result: result }));
            }, function(event) {
                socket.send(JSON.stringify(event));
            });
        });
    });
}

exports.stop =  function() {
    if (wss) {
        wss.close();
        console.log('webkit-devtools-agent stopped');
    }
}

if (!module.parent) {
    start();
} else {
    process.on('SIGUSR2', function() {
        if (wss) {
            stop();
        } else {
            start();
        }
    });
}

process.on('uncaughtException', function (err) {
    console.error('webkit-devtools-agent: uncaughtException: ');
    console.error(err.stack);
});
