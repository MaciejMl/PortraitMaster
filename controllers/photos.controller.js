const Photo = require('../models/photo.model');
const Voter = require('../models/Voters.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      // if fields are not empty...
      const escapedTitle = escapeHTML(title);
      const escapedAuthor = escapeHTML(author);
      const escapedEmail = escapeHTML(email);

      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(escapedEmail)) {
        throw new Error('Invalid email format!');
      }

      if (escapedTitle.length <= 25 && escapedAuthor.length <= 50) {
        const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
        const fileExt = fileName.split('.').slice(-1)[0];

        if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') {
          const newPhoto = new Photo({
            title: escapedTitle,
            author: escapedAuthor,
            email: escapedEmail,
            src: fileName,
            votes: 0,
          });
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);
        } else {
          throw new Error('Invalid file format!');
        }
      } else {
        throw new Error('Title or author is too long!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoId = req.params.id;
    const userIp = requestIp.getClientIp(req);
    console.log(userIp);

    let voter = await Voter.findOne({ user: userIp });

    if (!voter) {
      voter = new Voter({
        user: userIp,
        votes: [photoId],
      });

      await voter.save();
    } else {
      if (voter.votes.includes(photoId)) {
        throw new Error('Already voted for this photo!');
      }

      voter.votes.push(photoId);
      await voter.save();
    }

    const photoToUpdate = await Photo.findOne({ _id: photoId });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
