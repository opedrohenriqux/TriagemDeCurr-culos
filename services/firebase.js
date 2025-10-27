"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analytics = exports.auth = exports.db = void 0;
// Import the functions you need from the SDKs you need
var app_1 = require("firebase/app");
var analytics_1 = require("firebase/analytics");
var firestore_1 = require("firebase/firestore");
var auth_1 = require("firebase/auth");
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyD-QXjo04ILGfGf8HMOMW_UOWM8DB2D2Xs",
    authDomain: "lacoste-burger-atsl.firebaseapp.com",
    projectId: "lacoste-burger-atsl",
    storageBucket: "lacoste-burger-atsl.firebasestorage.app",
    messagingSenderId: "144666091802",
    appId: "1:144666091802:web:516ea8a845f297c9a48ca3"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var analytics;
if (typeof window !== 'undefined') {
    exports.analytics = analytics = (0, analytics_1.getAnalytics)(app);
}
var db = (0, firestore_1.getFirestore)(app);
exports.db = db;
var auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
