const { VertexAI } = require('@google-cloud/vertexai');
const {join} = require('path');

const keyFilePath = join(__dirname, 'giggr.json')
const vertex_ai = new VertexAI({
  project: '335427969026',
  location: 'us-central1',
  googleAuthOptions: { keyFile: keyFilePath },
});
const model =
  'projects/335427969026/locations/us-central1/endpoints/4787054824522776576';



// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    },
  ],
});

exports.generativeModel = generativeModel;
