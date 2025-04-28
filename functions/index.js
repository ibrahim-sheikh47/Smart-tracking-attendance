const functions = require("firebase-functions");

// HTTP request triggered function
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase Cloud Functions!");
});

