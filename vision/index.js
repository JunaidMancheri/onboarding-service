const { ImageAnnotatorClient } = require('@google-cloud/vision');
const { join } = require('path');

const keyFilePath = join(__dirname, '..', 'giggr-gcp.json');
const client = new ImageAnnotatorClient({
  keyFilename: keyFilePath,
  projectId: '335427969026',
});

exports.extractEmbeddings = async base64Url => {
  const base64String = base64Url.split(',')[1];
  const [result] = await client.annotateImage({
    image: { content: base64String },
    features: [{ type: 'FACE_DETECTION' }],
  });

  if (!result.faceAnnotations || result.faceAnnotations.length === 0) {
    console.log('No faces detected.');
    return null;
  }

  const faces = result.faceAnnotations;

  return faces[0];
};

exports.extractLandmarks = function (face) {
  return face.landmarks.map(landmark => ({
    type: landmark.type,
    position: {
      x: landmark.position.x,
      y: landmark.position.y,
      z: landmark.position.z,
    },
  }));
};
