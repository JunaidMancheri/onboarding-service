const { User } = require('../models/User');

const { Router } = require('express');
const {
  extractAdhaarNumber,
  extractPassportNumber,
  extractPANNumber,
} = require('../vision');
const ID = require('../models/ID');
const { uploadID, getIDUrl } = require('../storage');

const router = Router();

router.get('/machine-id/:machineId', async (req, res, next) => {
  try {
    const machineId = req.params.machineId;
    const userDoc = await User.findOne({ machineIds: machineId });
    return res.json(userDoc);
  } catch (error) {
    return res.sendStatus(500);
  }
});

router.post('/verify-id', async (req, res, next) => {
  try {
    const { image, type, uid } = req.body;
    if (type == 'adhaar') {
      const adhaarNumber = await extractAdhaarNumber(image);
      if (!adhaarNumber)
        return res.status(400).json({ msg: 'Adhaar Not Verified' });
      const [url, fileName] = await uploadID(image);
      await ID.create({ type: 'adhaar', uid, id: adhaarNumber, fileName });
      return res
        .status(200)
        .json({ msg: 'Adhaar Added Successfully', url, id: adhaarNumber });
    }

    if (type == 'passport') {
      const passportID = await extractPassportNumber(image);
      if (!passportID)
        return res.status(400).json({ msg: 'Passport Not verified' });
      const [url, fileName] = await uploadID(image);
      await ID.create({ type: 'passport', uid, id: passportID, fileName });
      return res.json({
        msg: 'Passport Added Successfully',
        url,
        id: passportID,
      });
    }

    if (type == 'pan') {
      const panID = await extractPANNumber(image);
      if (!panID) return res.status(400).json({ msg: 'PAN Not verified' });
      const [url, fileName] = await uploadID(image);
      await ID.create({ type: 'pan', uid, id: panID, fileName });
      return res.json({ msg: 'PAN Added Successfully', url, id: panID });
    }
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
});

router.get('/ids/:uid', async (req, res, next) => {
  try {
    const uid = req.params.uid;
    const idDocs = await ID.find({ uid });
    const ids = [];
    for (let i = 0; i < idDocs.length; i++) {
      const id = idDocs[i];
      ids.push({
        ...id._doc,
        url: await getIDUrl(id.fileName),
      });
    }
    return res.json(ids);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

module.exports = router;
