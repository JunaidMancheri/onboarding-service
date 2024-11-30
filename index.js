const { Server } = require('socket.io');
const http = require('http');

const httpServer = http.createServer();
const socketServer = new Server(httpServer);

const onboardingSocket = socketServer.of('/onboarding');

onboardingSocket.on('connection', socket => {
  console.log('Onboarding user started');
  socket.emit('welcome', 'Hi hello how are you doing');

  socket.on('message', msg => {
    console.log(msg);
  })
});

httpServer.listen(8000, () => console.log('Server listening on port 8000'));
