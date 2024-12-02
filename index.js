const { Server } = require('socket.io');
const http = require('http');
const { LLMChat } = require('./llm-config/chat');
const { getTTSAudioContent } = require('./text-to-speech');
const { transcribeAudio } = require('./speech-to-text');
require('dotenv').config()

require('./llm-config');



const httpServer = http.createServer();
const socketServer = new Server(httpServer, { cors: { origin: '*' } });

const onboardingSocket = socketServer.of('/onboarding');
onboardingSocket.on('connection', async socket => {
  const llmChat = new LLMChat();
  const welcomeMessage = await llmChat.sendGreetings();
  const audioContent = await getTTSAudioContent(welcomeMessage);
  socket.emit('tts', audioContent);
  socket.emit('welcome', welcomeMessage);

  socket.on('audio', async audioChunk => {
    const transcribedText = await transcribeAudio(audioChunk);
    socket.emit('transcribe', transcribedText);
    await interactWithLLm(transcribedText, llmChat, socket);
  });

  socket.on('message', async msg => {
    await interactWithLLm(msg, llmChat, socket);
  });
});

async function interactWithLLm(msg, llmChat, socket) {
  const llmResponse = await llmChat.interactWithLLM(msg);
  console.log(llmResponse);
  const audioContent = await getTTSAudioContent(llmResponse.response);
  socket.emit('tts', audioContent);
  socket.emit('ai', llmResponse?.response);
}

httpServer.listen(8000, () => console.log('Server listening on port 8000'));
