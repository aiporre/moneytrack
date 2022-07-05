const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// import database
const sqlite3 = require('sqlite3');

// import enchryption modules
const _ = require('lodash');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const bcrypt = require('bcrypt');
const { request } = require('express');
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
                    '${req.body.name}', 
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
    // return res.json({
    //     "status": true,
    //     "message": "User created"
    //  });
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

// Post /invoice - add a new purchase to the database with fields: name, user_id, and price
app.post('/invoice', upload.none(), (req, res) => {
    // check data is not empty
    if (!req.body.name || !req.body.user_id || !req.body.price) {
        // return json with status and message
        response = res.json({"status": false, "message": "Please fill in all fields"});
        return response;
    }

    // add purchase to database
    let db = new sqlite3.Database('./database/InvApp.db');

    let sqlCommand = `INSERT INTO invoices(
                            name,
                            user_id,
                            price
                        )
                        VALUES (
                            '${req.body.name}',
                            '${req.body.user_id}',
                            '${req.body.price}
                        )`;
    db.serialize(() => {
        db.run(sqlCommand, (err) => {
            if (err) {
                throw err;
            }
        
            let invoice_id = this.lastID;

            for (let i=0; i< req.body.items.length; i++) {
                let sqlItemCommamnd = `INSERT INTO transactions(
                                            name,
                                            price,
                                            invoice_id
                                        ) VALUES (
                                            '${req.body.items[i].name}',
                                            '${req.body.items[i].price}',
                                            '${invoice_id}'
                                        )`;
                db.run(sqlItemCommamnd, (err) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log('Item added');
                    }
                });
            }

            response = res.json({"status": true, "message": "Invoice added"});
            return response;
        });

    });
    db.close();
});

// GET /invoice/user/{user_id} - get all invoices for a user
app.get('/invoice/user/:user_id', upload.none(), (req, res) => {
    // check data is not empty
    if (!req.params.user_id) {
        // return json with status and message
        response = res.json({"status": false, "message": "Please fill in all fields"});
        return response;
    }
    // search all invoice where user_id equal to user_id in url
    let db = new sqlite3.Database('./database/InvApp.db');
    let sqlCommand = `SELECT * FROM 
                        invoices 
                        WHERE 
                            user_id = '${req.params.user_id}'
                        ORDER BY 
                            invoice_id DESC`;
    db.all(sqlCommand, [], (err, row) => {
        if (err) {
            throw err;
        } else {
            if (row.length === 0) {
                response = res.json({"status": false, "message": "User not found"});
                return response;
            } else {
                response = res.json({"status": true, "message": "Invoices found", "invoices": row});
                return response;
            }
        }
    });
});


// GET /invoice/user/{user_id}/{invoice_id} - get all items for a user
app.get('/invoice/user/:user_id/:invoice_id', upload.none(), (req, res) => {
    // check data is not empty
    if (!req.params.user_id || !req.params.invoice_id) {
        // return json with status and message
        response = res.json({"status": false, "message": "Please fill in all fields"});
        return response;
    }
    // search invoices and transaction with user_id and invoice_id in url
    let db = new sqlite3.Database('./database/InvApp.db');
    let sqlCommand = `SELECT * FROM invoices LEFT JOIN transactions
                        ON invoices.invoice_id = transactions.invoice_id
                        WHERE invoices.user_id = '${req.params.user_id}'
                        AND invoices.invoice_id = '${req.params.invoice_id}
                        ORDER BY transactions.transaction_id ASC`;
    db.all(sqlCommand, [], (err, row) => {
        if (err) {
            throw err;
        } else {
            // return row found
            response = res.json({"status": true, "message": "Invoices found", "transactions": row});
            return response;
        }
    });
});
// listen to port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});






