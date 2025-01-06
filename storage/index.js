const { Storage } = require('@google-cloud/storage');
const { join } = require('path');
const { v4 } = require('uuid');

const storage = new Storage({
  keyFilename: join(__dirname, '..', 'giggr-gcp.json'),
  projectId: '335427969026',
});

const bucket = storage.bucket('giggr_users');
const idBucket = storage.bucket('giggr_ids');

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



exports.uploadID = async imageBase64 => {
  const base64Data = imageBase64.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  const fileName = v4();
  const file = idBucket.file(fileName);

  await file.save(imageBuffer, {
    metadata: { contentType: 'image/jpeg' },
    resumable: false,
  });

  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  };

  const [signedUrl] = await file.getSignedUrl(options);
  return [signedUrl, fileName];
};

exports.getIDUrl = async filename => {

  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  };
  const [signedUrl] = await idBucket.file(filename).getSignedUrl(options);
  return signedUrl;
};
