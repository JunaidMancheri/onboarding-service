const { default: axios } = require('axios');

exports.extractFaceEmbeddings = async function (imageData) {
  const url = process.env.AUTH_SERVICE_URL + '/api/face/extract';
  const response = await axios.post(url, { image: imageData });
  return response.data.embedding;
};

exports.authenticateUserImage = async function (imageData, storedEmbeddings) {
  const url = process.env.AUTH_SERVICE_URL + '/api/face/authenticate';
  const response = await axios.post(url, {
    live_image: imageData,
    stored_embedding: storedEmbeddings,
  });
  return response.data;
};
