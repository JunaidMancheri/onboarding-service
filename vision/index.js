const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { join } = require('path');

const keyFilePath = join(__dirname, '..', 'giggr-gcp.json');
const client = new ImageAnnotatorClient({
  keyFilename: keyFilePath,
  projectId: '335427969026',
});

exports.extractAdhaarNumber = async base64Url => {
  const base64String = base64Url.split(',')[1];
  const [result] = await client.textDetection({
    image: { content: base64String },
  });

  const detections = result.textAnnotations;
  
  if (detections.length > 0) {
    const text = detections[0].description;

    const aadhaarRegex = /\d{4}\s\d{4}\s\d{4}/; 
    const match = text.match(aadhaarRegex);
    
    if (match) {
      return match[0].replace(/\s/g, '');
    } else {
      return null;
    }
  } else {
     return null;
  }
};

exports.extractPassportNumber = async (base64Url) => {
  const base64String = base64Url.split(',')[1];

  try {
    const [result] = await client.textDetection({
      image: { content: base64String },
    });

    const detections = result.textAnnotations;

    if (detections.length > 0) {
      const text = detections[0].description;
      
      const passportRegex = /[A-Z][0-9]{7}/;
      const match = text.match(passportRegex);

      if (match) {
        return match[0];
      } else {
        return null;
      }
    } else {
      return null; 
    }
  } catch (error) {
    console.log('Error extracting passport number:', error);
    throw error; 
  }
};

exports.extractPANNumber = async (base64Url) => {
  const base64String = base64Url.split(',')[1];

  try {
    const [result] = await client.textDetection({
      image: { content: base64String },
    });

    const detections = result.textAnnotations;

    if (detections.length > 0) {
      const text = detections[0].description;


      const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
      const match = text.match(panRegex);

      if (match) {
        return match[0]; 
      } else {
        return null; 
      }
    } else {
      return null; 
    }
  } catch (error) {
    console.log('Error extracting PAN number:', error);
    throw error; 
  }
};
