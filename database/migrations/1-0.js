"use strict";

const path = require("path");
const Promise = require("bluebird");
const sqlite3 = require("sqlite3");


module.exports = {
    up: function(){
        // returns a promise that initializes the database
        return new Promise((resolve, reject) => {
            let db = new sqlite3.Database('./database/InvApp.db');
            console.log('running migrations: 1.0')
            db.run('PRAGMA foreign_keys = ON');
            // serialize an produce tables
            db.serialize( () => {
                console.log('create the table: users');
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    password TEXT NOT NULL)`);
                console.log('create the table: invoices');
                db.run(`CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    paid NUMERIC NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id))`);
                console.log('create the table: items');
                db.run(`CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price INTEGER NOT NULL,
                    invoice_id INTEGER NOT NULL,
                    FOREIGN KEY(invoice_id) REFERENCES invoices(id))`);
            });
            db.close(); // close the database
        })     
    }
}