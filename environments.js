const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`),
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "5000",
  BASE_URL: process.env.BASE_URL || "https://pinksky-new.onrender.com/api/",
  apiKey: process.env.apiKey || "AIzaSyCqlWc1tzWj4D4cat7VRdY_DVCS2nTbuuY",
  authDomain: process.env.authDomain || "pinksky-8804c.firebaseapp.com",
  databaseURL:
    process.env.databaseURL || "https://pinksky-8804c-default-rtdb.firebaseio.com",
  projectId: process.env.projectId || "pinksky-8804c",
  storageBucket: process.env.storageBucket || "pinksky-8804c.appspot.com",
  messagingSenderId: process.env.messagingSenderId || "990382988239",
  appId: process.env.appId || "1:990382988239:web:37da001dd993d7f5ad50ba",
  FIRESTORE_URL:
    process.env.FIRESTORE_URL ||
    "https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/",
  RAPID_USERINFO_URL:
    process.env.RAPID_USERINFO_URL ||
    "https://instagram-scraper-data.p.rapidapi.com/userinfo/",
  RapidAPIKey:
    process.env.RapidAPIKey || "27103e4958msh490b2225533b947p146fcfjsn05f9ddf3803c",
  RapidAPIHost: process.env.RapidAPIHost || "instagram-scraper-data.p.rapidapi.com",
  SPREADSHEET: process.env.SPREADSHEET || "3sk63ko72tcjl",
  SPREADSHEET_URL:
    process.env.SPREADSHEET_URL ||
    "https://docs.google.com/spreadsheets/d/1dy0vtW_snRTOytWy8NJ8yhV-27mV9PRW1nBlzejQO3I/edit?usp:sharing",
  KEY_ID: process.env.KEY_ID || "rzp_test_5rCCf0RQfpS4ik",
  KEY_SECRET: process.env.KEY_SECRET || "VkG7W6cQUmV3lpodAVPpY3Bu",
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || "12345678",
  PLN_CAFE: process.env.PLN_CAFE || "plan_Kt4TCvVFFGqAc2",
  PLN_CLUB: process.env.PLN_CLUB || "",
  PLN_BOOTH: process.env.PLN_BOOTH || "",
  PLN_SALON: process.env.PLN_SALON || "",
  PLN_GYM: process.env.PLN_GYM || "",
  PLN_PROFESSIONAL: process.env.PLN_PROFESSIONAL || "",
  MEM_AMOUNT: process.env.MEM_AMOUNT || "200000",
  FRNT_SUBSCRIPTION_HEADING: process.env.FRNT_SUBSCRIPTION_HEADING || "Subscription",
  FRNT_MEMBERSHIP_HEADING: process.env.FRNT_MEMBERSHIP_HEADING || "Membership",
  ADMIN_BRAND_FILTER_TEXT: process.env.ADMIN_BRAND_FILTER_TEXT || "allbranddata",
  ADMIN_EVENT_FILTER_TEXT: process.env.ADMIN_EVENT_FILTER_TEXT || "alleventdata",
  ADMIN_COUPON_FILTER_TEXT: process.env.ADMIN_COUPON_FILTER_TEXT || "allcoupondata",
  ADMIN_INFLUENCER_FILTER_TEXT:
    process.env.ADMIN_INFLUENCER_FILTER_TEXT || "allinfluencerdata",
  WAPP_SENDMESSTEXT_UATURL_PRMNTOKN:
    process.env.WAPP_SENDMESSTEXT_UATURL_PRMNTOKN ||
    "https://graph.facebook.com/v15.0/100331042949316/messages",
  WAPP_AUTH_PRMNTOKN:
    process.env.WAPP_AUTH_PRMNTOKN ||
    "Bearer EAAJ8OfiOf9wBAHZBZBeBTltwFeEUcZBHMItA9KRIsvFKdRUrR4TPaZBOwk5kMlvWfld4vBLTYu7PXgy2yiA2SqoDy8o2HN7NZBHS0IPHFS9bZBvqMyAqZCZCzhfT7ZBzVRnhBxdzQEZCttnzAZCjNpx0uHTxZA9deQFsDDx5mCPeXVS1ndVBZAj7U2y1X",
  EML_USER: process.env.EML_USER || "chitvangarg14@gmail.com",
  EML_PASS: process.env.EML_PASS || "odgnsyerxpyvdqog",
  EML_PROVIDER: process.env.EML_PROVIDER || "gmail",
};
