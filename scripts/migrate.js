const path = require('path');
const Umzug = require('umzug');

let umzug = new Umzug({
    logging: () => {
        console.log.apply(null, arguments)
    },
    migrations: {
        path: './database/migrations',
        // pattern: /\.js/
    },
    upName: 'up'
});

// logging function events
function logUmzugEvents(eventName) {
    console.log(' this action: ' + eventName);
    return function(name, migration){
        console.log(`${eventName}: ${name}`);
    } 
};

// Use the event listeners to log when migrations are starting and complete
umzug.on('migrating', logUmzugEvents('migrating'));
umzug.on('migrated', logUmzugEvents('migrated'));
umzug.on('reverting', logUmzugEvents('reverting'));
umzug.on('reverted', logUmzugEvents('reverted'));

// this wil run all pending migrations

umzug.up().then(console.log('Migrations complete'));
