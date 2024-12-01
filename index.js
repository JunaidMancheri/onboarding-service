const { Server } = require('socket.io');
const http = require('http');
const { LLMChat } = require('./llm-config/chat');
require('./llm-config')

const httpServer = http.createServer();
const socketServer = new Server(httpServer, { cors: { origin: '*' } });

const onboardingSocket = socketServer.of('/onboarding');

onboardingSocket.on('connection', async socket => {
  console.log('Onboarding user started');
  const llmChat = new LLMChat();
  socket.emit('welcome', await llmChat.sendGreetings());

  socket.on('message', async msg => {
    const llmResponse = await  llmChat.interactWithLLM(msg);
    console.log(llmResponse)
    socket.emit('ai', llmResponse?.response)
  });
});

httpServer.listen(8000, () => console.log('Server listening on port 8000'));
