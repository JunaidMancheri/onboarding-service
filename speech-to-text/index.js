const speech = require('@google-cloud/speech');
const { join } = require('path');

const client = new speech.SpeechClient({
  keyFile: join(__dirname, '..', 'giggr-gcp.json'),
});


exports.transcribeAudio = async function (audioBuffer) {
  const request = {
    audio: { content: audioBuffer },
    config: {
      languageCode: 'en-US',
    },
  };
  const [response] = await client.recognize(request);
  console.log(response);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  return transcription;
};
