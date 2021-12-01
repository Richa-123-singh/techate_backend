var express = require('express'),
    router = express.Router(),
    passport = require('passport'),
    db = require('../models'),
    middleware = require('../middleware'),
    multer = require('multer'),
    fs = require('fs'),
    path = require('path'),
    qrcode = require('qrcode-generator'),
    { spawn } = require('child_process'),
    DOWNLOAD_PATH = require('../config').DOWNLOAD_PATH,
    ENCODING_PATH = require('../config').ENCODING_PATH;

// Setting up Environment Variables
const SECRET_KEY = process.env.SECRET_KEY || '123456';

// Setting Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("file uploaded to " + DOWNLOAD_PATH)
        cb(null, DOWNLOAD_PATH)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[1])
    }
})
const upload = multer({ dest: DOWNLOAD_PATH, storage: storage })

// Setting Python Spawn
create_encoding_script = function (file_path, save_path, person_name) {
    return spawn('python3', ["-u", path.join(__dirname, '../scripts/create_encodings.py'),
        file_path, save_path, person_name])
}

check_image_script = function (file_path, encodings_path) {
    return spawn('python3', ["-u", path.join(__dirname, '../scripts/check_image.py'),
        file_path, encodings_path], { stdio: [null, null, null, 'ipc'] });
}


router.get('/', function (req, res) {
    res.render('login');
});

//==========================
// Authentication Routes
//==========================

// New User Form
router.get('/register', function (req, res) {
    res.render("register");
});

// Create User
router.post('/register', function (req, res) {
    if (req.body.secretKey !== SECRET_KEY) {
        req.flash('error', 'Wrong Secret Key!!');
        return res.redirect('/register');
    }
    db.User.register(new db.User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/register');
        }
        passport.authenticate('local')(req, res, function () {
            req.flash('success', 'Hi ' + req.user.username + ' ,You Have Been Successfully Registered');
            res.redirect('/home');
        });
    });
});

// Authentication 
router.post('/', passport.authenticate('local', {
    successReturnToOrRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true
}));

router.get('/home', middleware.isLoggedIn, function (req, res) {
    res.render('home');
});

router.get('/student_form', middleware.isLoggedIn, function (req, res) {
    res.render('student_form');
});

router.get('/teacher_form', middleware.isLoggedIn, function (req, res) {
    res.render('teacher_form');
});

router.post('/add_student', middleware.isLoggedIn, upload.single('image'), function (req, res) {
    const file = req.file
    console.log(DOWNLOAD_PATH);
    console.log(ENCODING_PATH);
    if (!file) {
        req.flash('error', "Image Not Uploaded");
        return res.redirect('/student_form');
    }
    let filename = req.body.registration;
    let save_path = ENCODING_PATH;
    const subprocess = create_encoding_script(file.path, save_path, filename)
    subprocess.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    subprocess.stderr.on('data', (data) => {
        console.log(`error:${data}`);
    });
    subprocess.stderr.on('close', () => {
        console.log("Spawn Completed");
    });
    let student = req.body;
    student.section = student.section || 'Not Alloted';
    student.password = student.password || '123456';
    db.Student.create(student, function (err, newStudent) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/student_form');
        }
        req.flash('success', 'New Student Added Successfully');
        res.redirect('/student_form');
    })
});

router.post('/add_teacher', middleware.isLoggedIn, function (req, res) {
    let teacher = {
        username: req.body.username,
        registration: 't' + req.body.registration,
        mobile: req.body.mobile,
        email: req.body.email,
        section: req.body.section || 'Not Alloted',
        password: req.body.password || '123456'
    };
    db.Teacher.create(teacher, function (err, newTeacher) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/teacher_form');
        }
        req.flash('success', 'New Teacher Added Successfully');
        res.redirect('/teacher_form');
    })
});

router.post('/search', middleware.isLoggedIn, function (req, res) {
    let data = '';
    db.Student.findOne({ registration: req.body.search }, function (err, foundStudent) {
        if (err) {
            data = '';
            res.render('search', { data: data });
        } else {
            data = foundStudent;
            res.render('search', { data: data });
        }
    });
});

router.post('/edit_images', middleware.isLoggedIn, function (req, res) {
    let registration = req.body.registration;
    if (!registration) {
        req.flash('error', 'No registration number mentioned!!');
        return res.redirect('/home');
    }
    res.render('edit_images', { registration: registration });
});

router.post('/update_images', middleware.isLoggedIn, upload.single('image'), function (req, res) {
    const file = req.file
    if (!file) {
        req.flash('error', "Image Not Uploaded");
        return res.redirect('/');
    }
    let filename = req.body.registration;
    let save_path = ENCODING_PATH;
    const subprocess = create_encoding_script(file.path, save_path, filename)
    subprocess.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    subprocess.stderr.on('data', (data) => {
        console.log(`error:${data}`);
    });
    subprocess.stderr.on('close', () => {
        console.log("Spawn Completed");
    });
    req.flash('success', "Image Updated Sucessfully");
    res.redirect('/home');
});

//  Logout 
router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', 'You Have Been Successfully Logout!!');
    res.redirect('/');
});


//===================================
//      API ROUTES
//===================================
router.get('/api/', function (req, res) {
    let result = {};
    db.Student.find({}, function (err, studentData) {
        if (err) {
            result.student = [];
        } else {
            result.student = studentData;
            db.Teacher.find({}, function (err, teacherData) {
                if (err) {
                    result.teacher = [];
                } else {
                    result.teacher = teacherData;
                    // console.log(teacherData);
                    res.status(200).json(result);
                }
            });
            // console.log(studentData);
        }
    });
    res.status(500);
});

// QR CODE
router.get('/api/qrcode/open', function (req, res) {
    let message = Date.now().toString();
    // let message = '123456';
    let typeNumber = 4;
    let errorCorrectionLevel = 'L';
    let qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(message);
    qr.make();
    let result = {};
    result.tag = qr.createImgTag(5);
    result.code = message;
    db.QR.create({ code: message, username: message }, function (err, newQR) {
        if (err) {
            console.log(err);
            res.status(500).json({ 'message': 'Unable to create QRCode' });
        } else {
            res.status(200).send(result);
        }
    });
});
router.get('/api/qrcode/close/:code', function (req, res) {
    let code = req.params.code;
    db.QR.findOneAndRemove({ code: code }, function (err, removedQR) {
        if (err) {
            res.status(500).json({ 'message': 'Invalid QRCode!!' });
        } else {
            res.status(200).json(removedQR);
        }
    });
});
router.get('/api/qrcode/:code/:registration', function (req, res) {
    let registration = req.params.registration;
    let code = req.params.code;
    db.QR.findOneAndUpdate({ code: code }, { $addToSet: { students: registration } }, function (err, updatedQR) {
        if (err) {
            res.status(500).json({ 'message': 'Invalid QRCode!!' });
        } else {
            console.log(updatedQR);
            res.status(200).json({ 'message': 'Attendance Marked Successfully' });
        }
    })
});

// router.post('/api/qrcode/',function(req,res){
//     let date = Date.now().getDate();
//     date = toString(date);
//     let obj = {
//         date: date,
//         username: date,
//         students: req.body 
//     };
//     db.Attendance.create(obj,function(err,newAtt){
//         if(err)
//         {
//             res.status(500).send({'message': 'Internal Server Error'});
//         } else {
//             res.status(200);
//         }
//     });
// });

// Testing Image for Known Person
router.post('/api/testimage', upload.single('image'), (req,res,next) => {
    const file = req.file
    if(!file)
    {
      const error = new Error("File Not Uploaded")
      error.httpStausCode = 400
      return next(error)
    }
    // console.log("Found Image");
    let file_path = file.path
    let faces = []
    const subprocess = check_image_script(file_path,ENCODING_PATH)
    subprocess.stdout.on('data', (data) => {
      console.log(`${data}`);
      tmp = `${data}`;
      faces.push(tmp);
    });
    subprocess.stderr.on('data', (data) => {
      console.log(`error:${data}`);
    });
    subprocess.stderr.on('close', () => {
      console.log("Spawn Completed");
      faces = faces.map((i) => { return i.replace(/\n|\r/g, ""); });
      console.log(faces);
      db.Store.remove({},function(err,tmpStore){
          if(err)
          {
            res.status(500).send({'message': 'Some Error Occured!!'});
          } else {
              db.Store.create({students: faces},function(err,newStore){
                  if(err) {
                    res.status(500).send({'message': 'Some Error Occured!!'});
                  } else {
                      res.writeHead(301, {Location: 'http://techate-front.herokuapp.com/presentFaces'});
                      res.end();
                    //   res.status(200).send(faces);
                  }
              })
          }
      });
    });
});
router.get('/api/testimage', function(req,res){
    db.Store.find({},function(err,foundStore){
        if(err) {
            res.status(500).send({'message': 'Some Error Occured!!'});
        } else {
            res.status(200).send(foundStore);
        }
    });
})
module.exports = router;
