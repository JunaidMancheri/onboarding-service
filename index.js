const { Server } = require('socket.io');
const http = require('http');
const { LLMChat } = require('./llm-config/chat');
const { getTTSAudioContent } = require('./text-to-speech');
const { transcribeAudio } = require('./speech-to-text');
const { sendOtpMail } = require('./sendEmail');
require('dotenv').config();
require('./llm-config');

const otpCache = {};

const httpServer = http.createServer();
const socketServer = new Server(httpServer, { cors: { origin: '*' } });

const onboardingSocket = socketServer.of('/onboarding');
onboardingSocket.on('connection', async socket => {
  const llmChat = new LLMChat();
  try {
    const welcomeMessage = await llmChat.signalLLM('start onboarding');
    const audioContent = await getTTSAudioContent(welcomeMessage.response);
    socket.emit('tts', audioContent);
    socket.emit('welcome', welcomeMessage.response);
  } catch (error) {
    console.log(error.message);
  }

  socket.on('audio', async audioChunk => {
    try {
      let transcribedText = await transcribeAudio(audioChunk);
      socket.emit('transcribe', transcribedText);
      await interactWithLLm(transcribedText, llmChat, socket);
    } catch (error) {
      console.log(error.message);
      return console.log('Error transcribing');
    }
  });

  socket.on('message', async msg => {
    try {
      await interactWithLLm(msg, llmChat, socket);
    } catch (error) {
      console.log(error.message);
    }
  });
});

async function interactWithLLm(msg, llmChat, socket) {
  const llmResponse = await llmChat.interactWithLLM(msg);
  console.log(llmResponse);
  const audioContent = await getTTSAudioContent(llmResponse.response);
  socket.emit('tts', audioContent);
  socket.emit('ai', llmResponse?.response);

  await handleEmailOtpVerify(llmResponse, socket, llmChat);
  await handleEmailVerify(llmResponse, socket, llmChat);
  await handleGenerateUID(llmResponse, socket, llmChat);
  await handleOnboardingSessionEnd(llmResponse, socket);

}

async function handleOnboardingSessionEnd(llmResponse, socket) {
  if (!llmResponse.isComplete) return;
  if (!llmResponse.isConfirmed) return;
  if (!llmResponse.isEmailVerified) return;
  if (!llmResponse.isUIDSaved) return;
  socket.emit('events', 'session_end');
}

async function handleGenerateUID(llmResponse, socket, llmChat) {
  if (!llmResponse.isComplete) return;
  if (!llmResponse.isConfirmed) return;
  if (!llmResponse.isEmailVerified) return;
  if (!llmResponse.isUIDSaved) return;
  const uid = generateUID(llmResponse.collectedData.firstName);
  return await signalLLM(
    `Have generated UID for the user.
    This is  their uid ${uid}. 
    Please let them save it confirm it`,
    socket,
    llmChat
  );
}

async function handleEmailOtpVerify(llmResponse, socket, llmChat) {
  if (llmResponse.isEmailVerified) return;
  const email = llmResponse.collectedData.email;
  const otp = llmResponse.emailOtp;
  if (!email) return;
  if (!otp) return;
  if (otpCache[email] != otp) {
    return await signalLLM(
      'The otp provided by user is wrong. Please let them know and kindly ask them to recheck. Also make the variable <emailOtp> null again ',
      socket,
      llmChat
    );
  }

  return await signalLLM(
    'The otp is correct. mark the users email is verified and kindly let them know they have verified their email',
    socket,
    llmChat
  );
}

async function handleEmailVerify(llmResponse, socket, llmChat) {
  const email = llmResponse.collectedData.email;
  if (!email) return;
  if (llmResponse.isEmailVerified) return;
  if (llmResponse.emailVerificationSent >= 3) return;
  if (
    llmResponse.sentEmailVerification &&
    !llmResponse.userRequestedForEmailVerification
  )
  return;
  const otp = await sendOtpMail(email);
  otpCache[email] = otp;

  if (llmResponse.userRequestedForEmailVerification) {
    return await signalLLM(
      'Have resend a verification mail to the user. Please notify them and update the variable sentEmailVerification to true and userRequestedForEmailVerification to false again',
      socket,
      llmChat
    );
  }

  await signalLLM(
    'Have sent a verification mail to the user. Please notify them and update the variable sentEmailVerification to true',
    socket,
    llmChat
  );
}

async function signalLLM(message, socket, llmChat) {
  const llmResponse = await llmChat.signalLLM(message);
  const audioContent = await getTTSAudioContent(llmResponse.response);
  socket.emit('tts', audioContent);
  socket.emit('ai', llmResponse.response);
}

function generateUID(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string');
  }

  const initials = name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3);

  const randomPart = Array.from({ length: 13 }, () =>
    Math.random().toString(36).charAt(2)
  )
    .join('')
    .toUpperCase();

  return initials + randomPart;
}

httpServer.listen(8000, () => console.log('Server listening on port 8000'));
