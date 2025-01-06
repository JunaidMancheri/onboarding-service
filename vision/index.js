const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { join } = require('path');

const keyFilePath = join(__dirname, '..', 'giggr-gcp.json');
const client = new ImageAnnotatorClient({
  keyFilename: keyFilePath,
  projectId: '335427969026',
});

exports.validateUserImage = async base64Url => {
  try {
    const base64String = base64Url.split(',')[1];

    const [result] = await client.faceDetection({
      image: { content: base64String },
    });

    const faces = result.faceAnnotations;

    if (!faces || faces.length === 0) {
      return { success: false, error: 'No face detected in the image.' };
    }

    if (faces.length > 1) {
      return {
        success: false,
        error: 'Multiple faces detected. Ensure only one face is present.',
      };
    }

    const face = faces[0];

    const { rollAngle, panAngle, tiltAngle } = face;
    if (
      Math.abs(rollAngle) > 15 ||
      Math.abs(panAngle) > 15 ||
      Math.abs(tiltAngle) > 15
    ) {
      return {
        success: false,
        error: 'Face is not properly aligned. Keep it straight and centered.',
      };
    }

    if (
      face.headwearLikelihood === 'LIKELY' ||
      face.headwearLikelihood === 'VERY_LIKELY'
    ) {
      return {
        success: false,
        error: 'Please remove any headwear and try again.',
      };
    }

    return { success: true, message: 'Image is valid for registration.' };
  } catch (error) {
    console.error('Error validating image:', error);
    return {
      success: false,
      error: 'Failed to process the image. Please try again.',
    };
  }
};

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

exports.extractPassportNumber = async base64Url => {
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

exports.extractPANNumber = async base64Url => {
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
