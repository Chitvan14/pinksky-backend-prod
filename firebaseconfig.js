const firebase = require("firebase");
const admin = require("firebase-admin");
const credientialsdev = require("./serviceaccount_dev.json");
const credientialsprod = require("./serviceaccount_prod.json");
const Multer = require("multer");
const FirebaseStorage = require("multer-firebase-storage");
const environments = require("./environments.js");
let credientials =
  environments.NODE_ENV === "production" ? credientialsprod : credientialsdev;
const firebaseConfig = {
  apiKey: environments.apiKey,
  authDomain: environments.authDomain,
  databaseURL: environments.databaseURL,
  projectId: environments.projectId,
  storageBucket: environments.storageBucket,
  messagingSenderId: environments.messagingSenderId,
  appId: environments.appId,
};
firebase.initializeApp(firebaseConfig);
admin.initializeApp({
  credential: admin.credential.cert(credientials),
  storageBucket: environments.storageBucket,
});

const db = firebase.firestore();
const Influencer = db.collection("Influencer");
const Brand = db.collection("Brand");
const Campaign = db.collection("Campaign");
const Event = db.collection("Event");
const NonInfluencer = db.collection("NonInfluencer");
const PinkskyPopup = db.collection("PinkskyPopup");
const Coupons = db.collection("Coupons");
const RandomData = db.collection("RandomData");
const Gallery = db.collection("Gallery");
const Feedback = db.collection("Feedback");

const multer = Multer({
  storage: FirebaseStorage({
    bucketName: environments.storageBucket,
    credentials: {
      clientEmail: credientials.client_email,
      privateKey: credientials.private_key,
      projectId: credientials.project_id,
    },
  }),
});

const gallerymulter = Multer({
  storage: FirebaseStorage({
    bucketName: environments.storageBucket,
    directoryPath: "gallery",
    credentials: {
      clientEmail: credientials.client_email,
      privateKey: credientials.private_key,
      projectId: credientials.project_id,
    },
  }),
});

module.exports.Firebase = {
  Influencer,
  RandomData,
  Gallery,
  Brand,
  Campaign,
  Coupons,
  Event,
  NonInfluencer,
  PinkskyPopup,
  admin,
  firebase,
  multer,
  gallerymulter,
  Feedback,
};
