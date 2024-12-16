const { User } = require('../models/User');

const { Router } = require('express');
const { extractAdhaarNumber } = require('../vision');
const ID = require('../models/ID.');

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
      await ID.create({ type: 'adhaar', uid, id: adhaarNumber });
      return res.status(200).json({ msg: 'Adhaar Added Successfully' });
    }
    return res.end();
  } catch (error) {
    console.log(error.message);
    return res.sendStatus(500);
  }
});


router.get('/ids/:uid', async (req, res,next)=> {
  try {
    const  uid = req.params.uid;
     const ids = await ID.find({uid});
     return res.json(ids);
  } catch (error) {
    return res.status(500).json({msg: error.message})
  }
})

module.exports = router;
