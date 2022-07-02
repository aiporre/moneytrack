const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// import enchryption modules
const _ = require('lodash');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const bcrypt = require('bcrypt');
const saltRounds = 10;

const PORT = process.env.PORT || 3128;

const app = express();

app.use(express.urlencoded({ extended: false}));
app.use(express.json());

app.use(cors());

// crate a new router
app.get('/', (req, res) => {
    res.send('Hello World');
});

// POST /register - register a new user
app.post('/register', upload.single('avatar'), (req, res) => {
    // check data is not empty
    if (!req.body.name || !req.body.email || !req.body.company_name || !req.body.password) {
        // return json with status and message
        response = res.json({
            status: false, 
            message: 'Please fill in all fields'
        })
        return response;
    }

    // checj password hash same as in database sqlite3
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        let db = new sqlite3.Database('./database/InvApp.db');
        let sqlCommand = `INSERT INTO 
            users (
                name, 
                email, 
                company_name,
                password) 
                VALUES (
                    '${red.body.name}', 
                    '${req.body.email}', 
                    '${req.body.company_name}', 
                    '${hash}'
            )`;
        db.run(sqlCommand, (err) => {
            if (err) {
                throw err;
            } else{
                response = res.json({
                    status: true, 
                    message: 'User created'
                })
                return response;
            }
        });
        
        db.close();
    });
});
// POST /login - login a user
app.post('/login', (req, res) => {
    // search in database for user with email
    let db = new sqlite3.Database('./database/InvApp.db');
    let sqlCommand = `SELECT * FROM users WHERE email = '${req.body.email}'`;
    db.all(sqlCommand,[], (err, row) => {
        if (err) {
            throw err;
        } else {
            if (row.length === 0) {
                response = res.json({
                    status: false, 
                    message: 'User not found'
                })
                return response;
            } else {
                // compare password hash with database
                bcrypt.compare(req.body.password, row[0].password, (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        if (result) {
                            response = res.json({
                                status: true, 
                                message: 'User logged in'
                            })
                            return response;
                        } else {
                            response = res.json({
                                status: false, 
                                message: 'Wrong password'
                            })
                            return response;
                        }
                    }
                });
            }
        }
    });

    db.close();
});


// listen to port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});






