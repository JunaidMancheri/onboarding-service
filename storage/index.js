const { Storage } = require('@google-cloud/storage');
const { join } = require('path');
const { v4 } = require('uuid');

const storage = new Storage({
  keyFilename: join(__dirname, '..', 'giggr-gcp.json'),
  projectId:'335427969026'
});

const bucket = storage.bucket('giggr_users');

exports.uploadUsersImage = async imageBase64 => {
  const base64Data = imageBase64.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const fileName = v4();
  const file = bucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: { contentType: 'image/jpeg' },
    resumable: false,
  });

  const publicUrl = `https://storage.googleapis.com/giggr_users/${fileName}`;
  return publicUrl;
};
