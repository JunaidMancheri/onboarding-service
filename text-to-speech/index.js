const textToSpeech = require('@google-cloud/text-to-speech');
const { join } = require('path');

const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFile: join(__dirname, 'giggr.json'),
});

async function getTTSAudioContent(text) {
  const request = {
    input: { text: text },
    voice: {
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      name: 'en-US-Studio-O',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      effectsProfileId: ['telephony-class-application'],
      pitch: 2.4,
      speakingRate: 0.80
    },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response?.audioContent;
}

exports.getTTSAudioContent = getTTSAudioContent;
