const { Server } = require('socket.io');
const http = require('http');
const { LLMChat } = require('./llm-config/chat');
const { getTTSAudioContent } = require('./text-to-speech');
const { transcribeAudio } = require('./speech-to-text');
const { sendOtpMail } = require('./sendEmail');
const { sendOtpPhone } = require('./sendSMS');
const { default: mongoose } = require('mongoose');
const { User } = require('./models/User');
const { uploadUsersImage } = require('./storage');
const { extractEmbeddings, extractLandmarks } = require('./vision');
require('dotenv').config();
require('./llm-config');

const mailOtpCache = {};
const phoneOtpCache = {};
const uidCache = {};

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
      let transcribedText;
      try {
        transcribedText = await transcribeAudio(audioChunk);
        if (
          transcribedText == '' ||
          transcribedText == null ||
          !transcribedText
        )
          throw new Error('Error transcribing');
      } catch (error) {
        return socket.emit('events', 'error_transcribing');
      }
      socket.emit('transcribe', transcribedText);
      await interactWithLLm(transcribedText, llmChat, socket);
    } catch (error) {
      console.log(error.message);
      return console.log('Error transcribing');
    }
  });

  socket.on('image', async imageData => {
    try {
      // public acces disabled  by  org;
     const publicUrl = await uploadUsersImage(imageData);
     console.log(publicUrl);
     const  faceData = await extractEmbeddings(imageData);
     const landmarks = extractLandmarks(faceData);
     console.log(landmarks);     
      
    } catch (error) {
      console.log('ERror  in Image processing: ', error.message);
    }
  })
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
  
  await handleCapturePicture(llmResponse, socket)
  await handleEmailOtpVerify(llmResponse, socket, llmChat);
  await handleEmailVerify(llmResponse, socket, llmChat);
  await handleGenerateUID(llmResponse, socket, llmChat);
  await handleOnboardingSessionEnd(llmResponse, socket);
  await handlePhoneVerify(llmResponse, socket, llmChat);
  await handlePhoneOtpVerify(llmResponse, socket, llmChat);
}


async  function  handleCapturePicture(llmResponse, socket) {
 if (llmResponse.signal !== 'capture_picture') return;
 socket.emit('events', 'capture_picture');
}

async function handleOnboardingSessionEnd(llmResponse, socket) {
  if (llmResponse.signal !== 'session_end') return;
  socket.emit('events', 'session_end');
  const email = llmResponse.collectedData.email;
  await User.updateOne({ email }, { uid: uidCache[email] });
}

async function handlePhoneOtpVerify(llmResponse, socket, llmChat) {
  if (llmResponse.signal !== 'verify_otp_phone') return;
  const phoneNumber = llmResponse.collectedData.phoneNumber;
  const otp = llmResponse.phoneOtp;
  if (!phoneNumber) return;
  if (!otp) return;
  if (phoneOtpCache[phoneNumber] != otp) {
    return await signalLLM(
      'The otp for phone verification provided by user is wrong. Please let them know and kindly ask them to recheck. Also make the variable <phoneOtp> null again ',
      socket,
      llmChat
    );
  }

  return await signalLLM(
    `The otp for phone verification is correct. mark the users phoneNumber is verified and kindly let them know they have verified their phoneNumber.`,
    socket,
    llmChat
  );
}

async function handlePhoneVerify(llmResponse, socket, llmChat) {
  if (llmResponse.signal !== 'send_verification_phone') return;
  const phoneNumber = llmResponse.collectedData.phoneNumber;
  const userDoc = await User.findOne({ phoneNumber });
  if (userDoc) {
    return signalLLM(
      `This phone number is already in use. Please notify the user we can't continue
      with a already in use phoneNumber. Ask if they have alternative options else convey  we can't proceed with this phoneNumber`,
      socket,
      llmChat
    );
  }
  const otp = await sendOtpPhone(phoneNumber);
  phoneOtpCache[phoneNumber] = otp;
  await signalLLM(
    "Have sent a verification sms to the user's phone number. Please notify them",
    socket,
    llmChat
  );
}

async function generateUniqueUID(firstName) {
  let uid;
  let user;
  do {
    uid = generateUID(firstName);
    user = await User.findOne({ uid });
  } while (user);
  return uid;
}

async function handleGenerateUID(llmResponse, socket, llmChat) {
  if (llmResponse.signal !== 'generate_uid') return;
  await User.create({
    ...llmResponse.collectedData,
    machineIds: [socket.handshake?.query?.machineId],
  });
  const uid = await generateUniqueUID(llmResponse.collectedData.firstName);
  uidCache[llmResponse.collectedData.email] = uid;
  return await signalLLM(
    `Have generated UID for the user.
    This is  their uid ${uid}. 
    Please let them save it and confirm it`,
    socket,
    llmChat
  );
}

async function handleEmailOtpVerify(llmResponse, socket, llmChat) {
  if (llmResponse.signal !== 'verify_otp_mail') return;
  const email = llmResponse.collectedData.email;
  const otp = llmResponse.emailOtp;
  if (!email) return;
  if (!otp) return;
  if (mailOtpCache[email] != otp) {
    return await signalLLM(
      'The otp provided by user for mail verification is wrong. Please let them know and kindly ask them to recheck. Also make the variable <emailOtp> null again ',
      socket,
      llmChat
    );
  }

  return await signalLLM(
    `The otp for mail verification is correct. mark the users email is verified and kindly let them know they have verified their email.
`,
    socket,
    llmChat
  );
}

async function handleEmailVerify(llmResponse, socket, llmChat) {
  if (llmResponse.signal !== 'send_verification_mail') return;
  const email = llmResponse.collectedData.email;

  const userDoc = await User.findOne({ email });
  if (userDoc) {
    return signalLLM(
      'The email is already in use. Please notify the user this. Ask them if they have any alternative options else convey them we cant proceed with a email that is  already in use',
      socket,
      llmChat
    );
  }
  const otp = await sendOtpMail(email);
  mailOtpCache[email] = otp;
  await signalLLM(
    'Have sent a verification mail to the user. Please notify them',
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

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(8000, () => console.log('Server listening on port 8000'));
  })
  .catch(err => console.log(err));
