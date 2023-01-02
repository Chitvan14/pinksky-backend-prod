const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`),
});


module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  FIRESTORE_URL: process.env.FIRESTORE_URL,
  RAPID_USERINFO_URL: process.env.RAPID_USERINFO_URL,
  RapidAPIKey: process.env.RapidAPIKey,
  RapidAPIHost: process.env.RapidAPIHost,
  SPREADSHEET: process.env.SPREADSHEET,
  SPREADSHEET_URL: process.env.SPREADSHEET_URL,
  KEY_ID: process.env.KEY_ID,
  KEY_SECRET: process.env.KEY_SECRET,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  PLN_CAFE: process.env.PLN_CAFE,
  PLN_CLUB: process.env.PLN_CLUB,
  PLN_BOOTH: process.env.PLN_BOOTH,
  PLN_SALON: process.env.PLN_SALON,
  PLN_GYM: process.env.PLN_GYM,
  PLN_PROFESSIONAL: process.env.PLN_PROFESSIONAL,
  MEM_AMOUNT: process.env.MEM_AMOUNT,
  FRNT_SUBSCRIPTION_HEADING: process.env.FRNT_SUBSCRIPTION_HEADING,
  FRNT_MEMBERSHIP_HEADING: process.env.FRNT_MEMBERSHIP_HEADING,
  ADMIN_BRAND_FILTER_TEXT: process.env.ADMIN_BRAND_FILTER_TEXT,
  ADMIN_EVENT_FILTER_TEXT: process.env.ADMIN_EVENT_FILTER_TEXT,
  ADMIN_COUPON_FILTER_TEXT: process.env.ADMIN_COUPON_FILTER_TEXT,
  ADMIN_INFLUENCER_FILTER_TEXT: process.env.ADMIN_INFLUENCER_FILTER_TEXT,
  WAPP_SENDMESSTEXT_UATURL_PRMNTOKN:
    process.env.WAPP_SENDMESSTEXT_UATURL_PRMNTOKN,
  WAPP_AUTH_PRMNTOKN: process.env.WAPP_AUTH_PRMNTOKN,
  EML_USER: process.env.EML_USER,
  EML_PASS: process.env.EML_PASS,
  EML_PROVIDER: process.env.EML_PROVIDER,
};
