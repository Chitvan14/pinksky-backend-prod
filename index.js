const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const shortid = require("shortid");
const environments = require("./environments.js");
const request = require("request");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { Firebase } = require("./firebaseconfig.js");
var emailtemplate = require("./emailtemplate.js");

const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: environments.KEY_ID,
  key_secret: environments.KEY_SECRET,
});

const sheetdb = require("sheetdb-node");
const clientBrand = sheetdb({
  address: environments.SPREADSHEET + "?sheet=Brand",
});
const clientSpreadsheetToDB = sheetdb({
  address: environments.SPREADSHEET + "?sheet=SpreadsheetToDB",
});
const clientInfluencer = sheetdb({
  address: environments.SPREADSHEET + "?sheet=Influencer",
});
// const clientCampaign = sheetdb({
//   address: environments.SPREADSHEET + "?sheet=Campaign",
// });
const clientInternData = sheetdb({
  address: environments.SPREADSHEET + "?sheet=Intern",
});
const clientNonInfluencer = sheetdb({
  address: environments.SPREADSHEET + "?sheet=NonInfluencer",
});
const clientPinkskyPopup = sheetdb({
  address: environments.SPREADSHEET + "?sheet=PinkskyPopup",
});
const clientNamePhonenumber = sheetdb({
  address: environments.SPREADSHEET + "?sheet=NamePhonenumber",
});
const clientFeedback = sheetdb({
  address: environments.SPREADSHEET + "?sheet=Feedback",
});

const app = express();
const PORT = environments.PORT;
let logging = fs.createWriteStream("log.txt", { flags: "a" });
app.use(express.json());
app.use(cors());

// WHATSAPP AND EMAIL SECTION
// 1. Logging
// app.post("/api/testmail", async (req, res) => {
//   // sendMail("registerdetailmail", {
//   //   tomail: environments.EML_USER,
//   //   ccmail: "",
//   //   subjectmail: "Influencer Details | Pinksky",
//   //   text: "Hi"+" <br/>"+" Chitvan Garg",
//   //   href: environments.EML_HREF_WEBSITE,
//   // });
//   await Firebase.admin
//     .auth()
//     .generateEmailVerificationLink("gargchitvan99@gmail.com")
//     .then((response) => {
//     });
// });
// 2. creating mail to send
const sendMail = (sendType, data) => {
  //console.log("sendMail started 🚀");
  var transporter = nodemailer.createTransport({
    service: environments.EML_PROVIDER,
    auth: {
      user: environments.EML_USER,
      pass: environments.EML_PASS,
    },
  });
  let html = "";
  html = emailtemplate(sendType, data);
  setTimeout(() => {
    var mailOptions = {
      from: environments.EML_USER,
      to:
        environments.NODE_ENV === "production"
          ? data.tomail
          : environments.EML_USER,
      subject: data.subjectmail,
      html: html,
      cc: data.ccmail,
      bcc: sendType === "registerdetailmail" ? environments.EML_USER : "",
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("sendMail Failed ❌ with error - ", error);
      } else {
        //console.log("sendMail success ✅ with response - ", {${data.href}
        //   response: info.response,
        //   sendType,
        //   data,
        // });
      }
    });
  }, 2000);
};

// 3. creating whatspp messages to send
// const sendWhatsappMess = (sendType, data) => {
//   var dataString = {};
//   if (sendType === "sendingCouponDetails") {
//     dataString = JSON.stringify({
//       messaging_product: "whatsapp",
//       to: data.receiverNumber, //reciever number
//       type: "template",
//       template: {
//         name: "sample_shipping_confirmation", //template
//         language: {
//           code: "en_US",
//         },
//         components: [
//           {
//             type: "body",
//             parameters: [
//               {
//                 type: "text",
//                 text: "something",
//               },
//             ],
//           },
//         ],
//       },
//     });
//   }
//   const size = Object.keys(dataString).length;
//   if (size > 0) {
//     var config = {
//       method: "post",
//       url: environments.WAPP_SENDMESSTEXT_UATURL_PRMNTOKN,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: environments.WAPP_AUTH_PRMNTOKN,
//       },
//       data: dataString,
//     };

//     axios(config)
//       .then(function (response) {
//         logging.end();
//         res.status(200).json({ data: response, status: 1 });
//       })
//       .catch(function (error) {
//         logging.end();
//         res.status(200).json({ data: error, status: 0 });
//       });
//   }
// };

// RAZORPAY SECTION
// 1. Webhook callback
app.post("/api/verify/razorpay", async (req, res) => {
  logging.write(new Date() + " - verify/razorpay POST 🚀 \n");
  console.log(new Date() + " - verify/razorpay POST 🚀 \n");
  try {
    const secret = environments.WEBHOOK_SECRET;

    const crypto = require("crypto");

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest === req.headers["x-razorpay-signature"]) {
      //console.log("something ", req.body.event);
      if (req.body.event === "subscription.activated") {
        const updating = await Firebase.Brand.doc(
          req.body.payload.subscription.entity.notes.pinksky_id.replace(
            "\n",
            ""
          )
        ).get();
        await Firebase.Brand.doc(
          req.body.payload.subscription.entity.notes.pinksky_id.replace(
            "\n",
            ""
          )
        ).update({
          subscription:
            updating.data().subscription.length > 0
              ? [...updating.data().subscription, req.body]
              : [req.body],
        });

        logging.end();
        res.status(200).json({ message: "Subscription Activated" });
      }

      if (req.body.event === "payment_link.paid") {
        if (req.body.payload.payment_link.entity.notes.influencer === "true") {
          const snapshot = await Firebase.Influencer.doc(
            req.body.payload.payment_link.entity.notes.pinksky_id.replace(
              "\n",
              ""
            )
          ).get();
          if (snapshot.data().pinkskymember.isMember !== true) {
            const updated = await Firebase.Influencer.doc(
              req.body.payload.payment_link.entity.notes.pinksky_id.replace(
                "\n",
                ""
              )
            ).update({
              pinkskymember: {
                isMember: true,
                cooldown: new Date(
                  new Date().setFullYear(new Date().getFullYear() + 1)
                ),
                history: req.body,
              },
            });

            logging.end();
            res.status(200).json({ message: "Mapped User as member" });
          }
        } else if (
          req.body.payload.payment_link.entity.notes.non_Influencer === "true"
        ) {
          const nonsnapshot = await Firebase.NonInfluencer.doc(
            req.body.payload.payment_link.entity.notes.pinksky_id.replace(
              "\n",
              ""
            )
          ).get();
          if (nonsnapshot.data().pinkskymember.isMember !== true) {
            await Firebase.NonInfluencer.doc(
              req.body.payload.payment_link.entity.notes.pinksky_id.replace(
                "\n",
                ""
              )
            ).update({
              pinkskymember: {
                isMember: true,
                cooldown: new Date(
                  new Date().setFullYear(new Date().getFullYear() + 1)
                ),
                history: req.body,
              },
            });

            logging.end();
            res.status(200).json({ message: "Mapped User as member" });
          }
        } else if (
          req.body.payload.payment_link.entity.notes.brand === "true"
        ) {
          const brandsnapshot = await Firebase.Brand.doc(
            req.body.payload.payment_link.entity.notes.pinksky_id.replace(
              "\n",
              ""
            )
          ).get();
          if (brandsnapshot.data().pinkskymember.isMember !== true) {
            await Firebase.Brand.doc(
              req.body.payload.payment_link.entity.notes.pinksky_id.replace(
                "\n",
                ""
              )
            ).update({
              pinkskymember: {
                isMember: true,
                cooldown: new Date(
                  new Date().setFullYear(new Date().getFullYear() + 1)
                ),
                history: req.body,
              },
            });

            logging.end();
            res.status(200).json({ message: "Mapped User as member" });
          }
        }
      }
    }
  } catch (error) {
    //console.log(error);
    logging.write(new Date() + " - verify/razorpay ❌ - " + error + " \n");
    console.log(new Date() + " - verify/razorpay ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({
      message:
        "Error Occured Webhook configuring! Malicious Happening. " + error,
    });
  }
});

// 2. Pinksky subscription
app.post("/api/subscription/razorpay", async (req, res) => {
  logging.write(new Date() + " - subscription/razorpay POST 🚀 \n");
  console.log(new Date() + " - subscription/razorpay POST 🚀 \n");

  try {
    let data = req.body;
    //console.log(data);
    let planid = "";

    const snapshot = await Firebase.Brand.doc(data.id).get();
    if (snapshot.data().subscription.length > 0) {
      logging.end();
      res.status(200).json({
        message: "AlreadySubscribed",
      });
    } else {
      planid =
        data.plans === "PLNIMPCAFE6"
          ? environments.PLNIMPCAFE6
          : data.plans === "PLNCMPCAFE6"
          ? environments.PLNCMPCAFE6
          : data.plans === "PLNIMPCLUB6"
          ? environments.PLNIMPCLUB6
          : data.plans === "PLNCMPCLUB6"
          ? environments.PLNCMPCLUB6
          : data.plans === "PLNIMPBOOTH6"
          ? environments.PLNIMPBOOTH6
          : data.plans === "PLNCMPBOOTH6"
          ? environments.PLNCMPBOOTH6
          : data.plans === "PLNIMPSALON6"
          ? environments.PLNIMPSALON6
          : data.plans === "PLNCMPSALON6"
          ? environments.PLNCMPSALON6
          : data.plans === "PLNIMPGYM6"
          ? environments.PLNIMPGYM6
          : data.plans === "PLNCMPGYM6"
          ? environments.PLNCMPGYM6
          : data.plans === "PLNIMPPROFESSIONAL6"
          ? environments.PLNIMPPROFESSIONAL6
          : data.plans === "PLNCMPPROFESSIONAL6"
          ? environments.PLNCMPPROFESSIONAL6
          : data.plans === "PLNIMPCAFE12"
          ? environments.PLNIMPCAFE12
          : data.plans === "PLNCMPCAFE12"
          ? environments.PLNCMPCAFE12
          : data.plans === "PLNIMPCLUB12"
          ? environments.PLNIMPCLUB12
          : data.plans === "PLNCMPCLUB12"
          ? environments.PLNCMPCLUB12
          : data.plans === "PLNIMPBOOTH12"
          ? environments.PLNIMPBOOTH12
          : data.plans === "PLNCMPBOOTH12"
          ? environments.PLNCMPBOOTH12
          : data.plans === "PLNIMPSALON12"
          ? environments.PLNIMPSALON12
          : data.plans === "PLNCMPSALON12"
          ? environments.PLNCMPSALON12
          : data.plans === "PLNIMPGYM12"
          ? environments.PLNIMPGYM12
          : data.plans === "PLNCMPGYM12"
          ? environments.PLNCMPGYM12
          : data.plans === "PLNIMPPROFESSIONAL12"
          ? environments.PLNIMPPROFESSIONAL12
          : data.plans === "PLNCMPPROFESSIONAL12"
          ? environments.PLNCMPPROFESSIONAL12
          : "";

      const options = {
        plan_id: planid,
        customer_notify: 1,
        quantity: 1,
        total_count: data.monthFormValue,
        notes: {
          pinksky_id: data.id,
          displayName: data.displayName,
          comments: "",
        },
      };
      const response = await razorpay.subscriptions.create(options);

      logging.end();
      res.status(200).json({
        url: response.short_url,
        message: "SubscriptionLink",
        heading: environments.FRNT_SUBSCRIPTION_HEADING,
      });
    }
  } catch (error) {
    logging.write(
      new Date() + " - subscription/razorpay ❌ - " + error + " \n"
    );
    console.log(new Date() + " - subscription/razorpay ❌ - " + error + " \n");

    logging.end();
    res.status(500).json(error);
  }
});

// 3. Pinsky coupons
app.post("/api/getcouponmessage/razorpay", async (req, res) => {
  logging.write(new Date() + " - getcouponmessage/razorpay POST 🚀 \n");
  console.log(new Date() + " - getcouponmessage/razorpay POST 🚀 \n");

  try {
    let response = req.body;

    if (response.isMember === false) {
      let paymentLink = {};
      let snapshot = null;
      if (response.isInfluencer === "true") {
        snapshot = await Firebase.Influencer.doc(response.id).get();
      }
      if (response.isBrand === "true") {
        snapshot = await Firebase.Brand.doc(response.id).get();
      }
      if (response.isNonInfluencer === "true") {
        snapshot = await Firebase.NonInfluencer.doc(response.id).get();
      }
      paymentLink = await razorpay.paymentLink.create({
        amount: parseInt(environments.MEM_AMOUNT),
        currency: "INR",
        accept_partial: true,
        customer: {
          name: snapshot.data().name,
          email: snapshot.data().email,
          contact: snapshot.data().whatsappnumber,
        },
        notify: {
          sms: true,
          email: true,
          whatsapp: true,
        },
        reminder_enable: true,
        notes: {
          pinksky_id: response.id,
          influencer: response.isInfluencer,
          non_Influencer: response.isNonInfluencer,
          brand: response.isBrand,
        },
        // callback_url: "https://example-callback-url.com/",
        // callback_method: "get"
      });
      //console.log(paymentLink);

      logging.end();
      res.status(200).json({
        url: paymentLink.short_url,
        message: "Generate Coupon Payment Link",
        heading: environments.FRNT_MEMBERSHIP_HEADING,
      });
    } else {
      const snapshot = await Firebase.Coupons.doc(response.data.id).get();
      const influesnapshot = await Firebase.Influencer.doc(response.id).get();
      const brandsnapshot = await Firebase.Brand.doc(
        snapshot.data().brandcategory.id
      ).get();
      let generateshortid = shortid.generate();
      await Firebase.Coupons.doc(response.data.id).update({
        userCouponMapping: [
          ...snapshot.data().userCouponMapping,
          {
            influencerid: response.id,
            shortid: generateshortid,
            createdDate: new Date(),
            email: influesnapshot.data().email,
            name:
              influesnapshot.data().name + ", " + influesnapshot.data().surname,
          },
        ],
      });
      //console.log("here 1");

      //send mail and message with short id, coupon details and influencer detials to
      // influencer, brand, pinksky 3 mails/messages
      let text = `Hi ${influesnapshot.data().name},<br/><br/>
      Congratulations 🎉<br/>
      You have successfully accessed the coupon from Pinksky Premium, which you can use at your next purchase at ${
        snapshot.data().brandcategory.companyname
      } <br/>
      Use code <strong>${generateshortid}</strong> while making payment<br/><br/>
      Terms & Conditions:<br/><br/>
      ${snapshot.data().tandc}<br/><br/>`;

      sendMail("couponredeembyuser", {
        tomail: influesnapshot.data().email,
        ccmail: brandsnapshot.data().email,
        subjectmail: "Coupon Redeem | Pinksky",
        text: text,
        href: environments.EML_HREF_WEBSITE,
        hrefText: "pinkskyclub.com",
      });

      logging.end();
      setTimeout(() => {
        //console.log("text", {
        //   tomail: influesnapshot.data().email,
        //   ccmail: brandsnapshot.data().email,
        //   subjectmail: "Coupon Redeem | Pinksky",
        //   text: text,
        //   href: environments.EML_HREF_WEBSITE,
        //   hrefText: "pinkskyclub.com",
        // });
        res.status(200).json({ message: "Notified" });
      }, 1700);
    }
  } catch (error) {
    logging.write(
      new Date() + " - getcouponmessage/razorpay ❌ - " + error + " \n"
    );
    console.log(
      new Date() + " - getcouponmessage/razorpay ❌ - " + error + " \n"
    );

    logging.end();
    res.status(500).json(error);
  }
});

// SPREADSHEET SECTION
// 1. Sending data from firebase to spreadsheet
app.post("/api/firebasetospreadsheet", async (req, res) => {
  logging.write(new Date() + " - firebasetospreadsheet POST 🚀 \n");
  console.log(new Date() + " - firebasetospreadsheet POST 🚀 \n");

  try {
    let isValid = 1;
    //Influencer
    const snapshot = await Firebase.Influencer.get();
    let influencerData = [];
    snapshot.docs.map(async (doc) => {
      if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
        influencerData.push({
          id: doc.id,
          city: doc.data().city,
          email: doc.data().email,
          gender: doc.data().gender,
          instagramurl: doc.data().instagramurl,
          name: doc.data().name,
          phonenumber: doc.data().phonenumber,
          surname: doc.data().surname,
          whatsappnumber: doc.data().whatsappnumber,
        });
        await Firebase.Influencer.doc(doc.id).update({
          dbInserted: 1,
        });
      } else {
        //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
      }
    });
    if (influencerData.length > 0) {
      clientInfluencer.create(influencerData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    //Brand
    const brandsnapshot = await Firebase.Brand.get();
    let brandData = [];
    brandsnapshot.docs.map(async (doc) => {
      if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
        brandData.push({
          id: doc.id,
          companyname: doc.data().companyname,
          designation: doc.data().designation,
          email: doc.data().email,
          instagramurl: doc.data().instagramurl,
          name: doc.data().name,
          phonenumber: doc.data().phonenumber,
          city: doc.data().city,
          whatsappnumber: doc.data().whatsappnumber,
        });
        await Firebase.Brand.doc(doc.id).update({
          dbInserted: 1,
        });
      } else {
        //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
      }
    });

    if (brandData.length > 0) {
      clientBrand.create(brandData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    //Campaign
    // const campaignsnapshot = await Firebase.Campaign.get();
    // let campaignData = [];
    // campaignsnapshot.docs.map(async (doc) => {
    //   if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
    //     campaignData.push({
    //       id: doc.id,
    //       brandcategory: doc.data().brandcategory,
    //       city: doc.data().city,
    //       name: doc.data().name,
    //       paidPrivilege: doc.data().viewerDetails.paidPrivilege,
    //       pinkskyPrivilege: doc.data().viewerDetails.pinkskyPrivilege,
    //     });
    //     await Firebase.Campaign.doc(doc.id).update({
    //       dbInserted: 1,
    //     });
    //   } else {
    //     //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
    //   }
    // });

    // if (campaignData.length > 0) {
    //   clientCampaign.create(campaignData).then(
    //     function (data) {
    //       //console.log(data);
    //     },
    //     function (err) {
    //       isValid = 0;
    //       throw err;
    //     }
    //   );
    // }

    //NonInfluencer
    const noninfluencersnapshot = await Firebase.NonInfluencer.get();
    let noninfluencerData = [];
    noninfluencersnapshot.docs.map(async (doc) => {
      if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
        noninfluencerData.push({
          id: doc.id,
          email: doc.data().email,
          instagramid: doc.data().instagramid,
          name: doc.data().name,
          whatsappnumber: doc.data().whatsappnumber,
        });
        await Firebase.NonInfluencer.doc(doc.id).update({
          dbInserted: 1,
        });
      } else {
        //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
      }
    });

    if (noninfluencerData.length > 0) {
      clientNonInfluencer.create(noninfluencerData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    //Pinksky Popup
    const pinkskyPopupsnapshot = await Firebase.PinkskyPopup.get();
    let pinkskyPopupData = [];
    pinkskyPopupsnapshot.docs.map(async (doc) => {
      if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
        pinkskyPopupData.push({
          id: doc.id,
          // targetage: doc.data().age,
          brandname: doc.data().brandname,
          email: doc.data().email,
          // targetgender: doc.data().gender,
          instagramid: doc.data().instagramid,
          name: doc.data().name,
          // whatdoyousell: doc.data().whatdoyousell,
          // yesnoppe: doc.data().yesnoppe,
          whatsappnumber: doc.data().whatsappnumber,
        });
        await Firebase.PinkskyPopup.doc(doc.id).update({
          dbInserted: 1,
        });
      } else {
        //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
      }
    });

    if (pinkskyPopupData.length > 0) {
      clientPinkskyPopup.create(pinkskyPopupData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    //Random Data
    const randomDatasnapshot = await Firebase.RandomData.get();
    let randomData = [];
    let internData = [];

    randomDatasnapshot.docs.map(async (doc) => {
      if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
        if (doc.data().category.toLowerCase().indexOf("intern") !== -1) {
          internData.push({
            id: doc.id,
            category: doc.data().category,
            name: doc.data().name,
            number: doc.data().number,
            userid: doc.data().userid,
            internCategory: doc.data().internCat,
            resumelink: doc.data().resumelink,
          });
        } else {
          randomData.push({
            id: doc.id,
            category: doc.data().category,
            name: doc.data().name,
            number: doc.data().number,
            userid: doc.data().userid,
          });
        }

        await Firebase.RandomData.doc(doc.id).update({
          dbInserted: 1,
        });
      } else {
        //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
      }
    });

    if (internData.length > 0) {
      clientInternData.create(internData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    if (randomData.length > 0) {
      clientNamePhonenumber.create(randomData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    //Feedback
    const feedbackDatasnapshot = await Firebase.Feedback.get();
    let feedbackData = [];
    feedbackDatasnapshot.docs.map(async (doc) => {
      if (doc.data().dbInserted === 0 || doc.data().dbInserted === undefined) {
        feedbackData.push({
          id: doc.id,

          name: doc.data().name,
          message: doc.data().message,
        });
        await Firebase.Feedback.doc(doc.id).update({
          dbInserted: 1,
        });
      } else {
        //console.log({ id: doc.id, dbInserted: doc.data().dbInserted });
      }
    });

    if (feedbackData.length > 0) {
      clientFeedback.create(feedbackData).then(
        function (data) {
          //console.log(data);
        },
        function (err) {
          isValid = 0;
          throw err;
        }
      );
    }

    if (isValid === 1) {
      res
        .status(200)
        .json({ message: "Excel Updated", url: environments.SPREADSHEET_URL });
    }
  } catch (err) {
    logging.write(new Date() + " - firebasetospreadsheet ❌ - " + err + " \n");
    console.log(new Date() + " - firebasetospreadsheet ❌ - " + err + " \n");

    logging.end();
    res.status(500).json(err);
  }
});

// 2. Sending data from spreadsheet to firebase
app.get("/api/spreadsheettofirebase", async (req, res) => {
  logging.write(new Date() + " - spreadsheettofirebase GET 🚀 \n");
  console.log(new Date() + " - spreadsheettofirebase GET 🚀 \n");

  try {
    clientSpreadsheetToDB.read().then(
      function (data) {
        let value = JSON.parse(data);
        let interval = 60000;

        value.forEach((item, index) => {
          setTimeout(() => {
            let addvalue = {
              ...item,
              admin: false,
              isActive: 1,
              campaignmapping: [],
              eventmapping: [],
              pinkskymember: {
                isMember: false,
                cooldown: null,
              },
              paymentdetails: {},
              isTeam: "new",
              status: "new",
              dob: "",
              address: "",
              isNonInfluencer: "",
              city: "",
              category: [
                {
                  href: "/influencer",
                  id: 2,
                  status: false,
                  label: "Lifestyle Category",
                  value: "Lifestyle",
                  icon: {
                    _store: {},
                    key: null,
                    _owner: null,
                    type: "img",
                    ref: null,
                    props: {
                      loading: "lazy",
                      src: "/static/media/healthy-lifestyle.adbd2600d92cbd99718b.png",
                      width: "25px",
                      height: "25px",
                    },
                  },
                },
              ],
            };
            axios
              .post(
                environments.BASE_URL +
                  "influencer/create?isProfileCompleted=0",
                addvalue
              )
              .then((response) => {
                logging.end();
                res.status(200).json(response.data);
              })
              .catch((error) => {
                throw error;
              });
          }, index * interval);
        });
      },
      function (error) {
        throw error;
      }
    );
  } catch (error) {
    logging.write(
      new Date() + " - spreadsheettofirebase ❌ - " + error + " \n"
    );
    console.log(new Date() + " - spreadsheettofirebase ❌ - " + error + " \n");

    logging.end();
    res.status(500).json(error);
  }
});

// AUTHENTICATION SECTION
// 1. Forgot Password
app.post("/api/forgotpassword", async (req, res) => {
  logging.write(new Date() + " - forgotpassword POST 🚀 \n");
  console.log(new Date() + " - forgotpassword POST 🚀 \n");

  try {
    await Firebase.firebase
      .auth()
      .sendPasswordResetEmail(req.body.email)
      .catch((error) => {
        throw error;
      });
    //console.log("email sent1");

    logging.end();
    res.status(200).json({ message: "Forgot Password" });
  } catch (error) {
    logging.write(new Date() + " - forgotpassword ❌ - " + error + " \n");
    console.log(new Date() + " - forgotpassword ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 2. Sign into pinksky
app.post("/api/signin", async (req, res) => {
  try {
    const createUser = {
      email: req.body.email,
      password: req.body.password,
    };
    logging.write(
      new Date() + " - signin POST 🚀 - " + createUser.email + " \n"
    );
    console.log(new Date() + " - signin POST 🚀 - " + createUser.email + " \n");

    const userResponse = await Firebase.firebase
      .auth()
      .signInWithEmailAndPassword(createUser.email, createUser.password)
      .catch((error) => {
        throw error;
      });
    let verify = true;

    if (userResponse.user.displayName != null) {
      if (userResponse.user.displayName.indexOf("Brand") != -1) {
        //Brand

        const snapshot = await Firebase.Brand.get();
        let brandData = [];
        snapshot.docs.map((doc) => {
          if (doc.data().email === createUser.email) {
            brandData.push({ id: doc.id, ...doc.data() });
          }
        });

        if (brandData[0].isActive === 0) {
          verify = true;
          sendMail("verifyemail", {
            tomail: brandData[0].email,
            ccmail: "",
            subjectmail: "Verify your account | Pinksky",
            text:
              "Hey " +
              brandData[0].companyname +
              ", Use the link below to verify your email.",

            href:
              environments.VERIFY_EMAIL +
              "?registeras=Brand&id=" +
              brandData[0].id,
            hrefText: "Verify Email",
          });
        } else {
          verify = false;
          if (userResponse.user.displayName.toString().slice(0, 1) === "0") {
            sendMail("signincompleteprofile", {
              tomail: brandData[0].email,
              ccmail: "",
              subjectmail: "Complete your profile | Pinksky",
              text: `Hi ${brandData[0].companyname},<br/><br/>

             You have successfully created an account at Pinksky! 
             <br/><br/>
             Our team will contact you shortly to discuss your requirements. On that note, <strong>we would request you to proceed with the completion of your profile.</strong>
             <br/><br/>
             Thanks for choosing Pinksky💕`,
              href: environments.EML_HREF_WEBSITE,
              hrefText: "pinkskyclub.com",
            });
          }
        }
        // text:
        // "Hey " +
        // brandData[0].companyname +
        // ", Please complete your profile.",
        let isMember = false;
        if (brandData[0].pinkskymember.cooldown === null) {
          isMember = false;
        } else {
          if (
            new Date(brandData[0].pinkskymember.cooldown.seconds * 1000) <
            new Date()
          ) {
            await Firebase.Brand.doc(brandData[0].id).update({
              pinkskymember: {
                isMember: false,
                cooldown: null,
              },
            });
            isMember = false;
          } else {
            isMember = true;
          }
        }
        //console.log("brandData", {
        //   message: {
        //     displayName: userResponse.user.displayName,
        //     id: brandData[0].id,
        //     email: brandData[0].email,
        //     type: "Brand",
        //     status: brandData[0].status,
        //     member: isMember,
        //     uuid: userResponse.user.uid,
        //   },
        //   verify: verify,
        // });

        logging.end();
        res.status(200).json({
          message: {
            displayName: userResponse.user.displayName,
            id: brandData[0].id,
            email: brandData[0].email,
            type: "Brand",
            status: brandData[0].status,
            member: isMember,
            uuid: userResponse.user.uid,
          },
          verify: verify,
        });
        //}
      } else if (
        userResponse.user.displayName.indexOf("Non_Influencer") != -1
      ) {
        let noninfluencerData = [];
        const snapshot = await Firebase.NonInfluencer.get();
        snapshot.docs.map((doc) => {
          if (doc.data().email === createUser.email) {
            noninfluencerData.push({ id: doc.id, ...doc.data() });
          }
        });
        if (noninfluencerData[0].isActive === 0) {
          verify = true;
          sendMail("verifyemail", {
            tomail: noninfluencerData[0].email,
            ccmail: "",
            subjectmail: "Verify your account | Pinksky",
            text:
              "Hey " +
              noninfluencerData[0].name +
              ", Use the link below to verify your email.",

            href:
              environments.VERIFY_EMAIL +
              "?registeras=Noninfluencer&id=" +
              noninfluencerData[0].id,
            hrefText: "Verify Email",
          });
        } else {
          verify = false;
        }
        let isMember = false;
        if (noninfluencerData[0].pinkskymember.cooldown === null) {
          isMember = false;
        } else {
          if (
            new Date(
              noninfluencerData[0].pinkskymember.cooldown.seconds * 1000
            ) < new Date()
          ) {
            await Firebase.NonInfluencer.doc(noninfluencerData[0].id).update({
              pinkskymember: {
                isMember: false,
                cooldown: null,
              },
            });
            isMember = false;
          } else {
            isMember = true;
          }
        }

        logging.end();
        res.status(200).json({
          message: {
            displayName: userResponse.user.displayName,
            id: noninfluencerData[0].id,
            // email: createUser.email,
            email: noninfluencerData[0].email,

            type: "Non_Influencer",
            status: "",
            member: isMember,
            uuid: userResponse.user.uid,
          },
          verify: verify,
        });
      } else {
        //console.log("2");
        let influencerData = [];
        // const snapshot = await Firebase.Influencer.where(
        //   "email",
        //   "==",
        //   createUser.email.toString()
        // );
        const snapshot = await Firebase.Influencer.get();
        // console.log("snapshot influencer signin ", snapshot);

        snapshot.docs.map((doc) => {
          if (doc.data().email === createUser.email) {
            influencerData.push({ id: doc.id, ...doc.data() });
          }
        });
        if (influencerData[0].isActive === 0) {
          verify = true;
          sendMail("verifyemail", {
            tomail: influencerData[0].email,
            ccmail: "",
            subjectmail: "Verify your account | Pinksky",
            text:
              "Hey " +
              influencerData[0].name +
              ", Use the link below to verify your email.",

            href:
              environments.VERIFY_EMAIL +
              "?registeras=Influencer&id=" +
              influencerData[0].id,
            hrefText: "Verify Email",
          });
        } else {
          verify = false;
          if (userResponse.user.displayName.toString().slice(0, 1) === "0") {
            sendMail("signincompleteprofile", {
              tomail: influencerData[0].email,
              ccmail: "",
              subjectmail: "Complete your profile | Pinksky",
              text: `Hi ${influencerData[0].name},<br/><br/>

              You have successfully created an account at Pinksky! <br/><br/>
              
              Updates of all the new events will be shown on the website. On that note, <strong>we would request you to proceed with the completion of your profile. </strong>
              <br/><br/>
              Thanks for choosing Pinksky💕`,

              href: environments.EML_HREF_WEBSITE,
              hrefText: "pinkskyclub.com",
            });
          }
        }
        // text:
        //   "Hey " +
        //   influencerData[0].name +
        //   ", Please complete your profile.",
        let isMember = false;
        if (influencerData[0].pinkskymember.cooldown === null) {
          //console.log("Here 1");
          isMember = false;
        } else {
          if (
            new Date(influencerData[0].pinkskymember.cooldown.seconds * 1000) <
            new Date()
          ) {
            await Firebase.Influencer.doc(influencerData[0].id).update({
              pinkskymember: {
                isMember: false,
                cooldown: null,
              },
            });
            isMember = false;
          } else {
            isMember = true;
          }
        }

        logging.end();
        res.status(200).json({
          message: {
            displayName: userResponse.user.displayName,
            id: influencerData[0].id,
            email: influencerData[0].email,
            type: "Influencer",
            status: influencerData[0].status,
            member: isMember,
            uuid: userResponse.user.uid,
          },
          verify: verify,
        });
        //}
      }
    } else {
      // logging.end();
      // res.status(500).json({ message: "Invalid User" });
      const error = new TypeError("Invalid User");
      throw console.error();
    }
  } catch (error) {
    logging.write(new Date() + " - signin ❌ - " + error + " \n");
    console.log(new Date() + " - signin ❌ - " + error + " \n");
    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Updating on signin into pinksky
app.post("/api/signin/profileupdating", async (req, res) => {
  logging.write(new Date() + " - signin/profileupdating POST 🚀 \n");
  console.log(new Date() + " - signin/profileupdating POST 🚀 \n");

  try {
    let { data } = req.body;
    if (data.displayName.slice(0, 1) === "1") {
      if (data.displayName.indexOf("Brand") != -1) {
        //Brand
        const snapshot = await Firebase.Brand.doc(data.id).get();

        var difference =
          new Date().getTime() - snapshot.data().updatedDate.toDate().getTime();

        var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
        //console.log("daysDifference", daysDifference);
        if (daysDifference > 15) {
          let brandSchema = null;
          const options = {
            method: "GET",
            url: environments.RAPID_USERINFO_URL + snapshot.data().instagramurl,
            headers: {
              "X-RapidAPI-Key": environments.RapidAPIKey,
              "X-RapidAPI-Host": environments.RapidAPIHost,
            },
          };

          await axios
            .request(options)
            .then(function (response) {
              // //console.log("inside2", response.data);

              brandSchema = {
                ...snapshot.data(),
                instagram: {
                  id: response.data.data.id,
                  is_business_account: response.data.data.is_business_account,
                  external_url: response.data.data.external_url,
                  followers: response.data.data.edge_followed_by.count,
                  edge_follow: response.data.data.edge_follow.count,
                  is_private: response.data.data.is_private,
                  is_verified: response.data.data.is_verified,
                },
                updatedDate: new Date(),
              };
              setTimeout(async () => {
                await Firebase.Brand.doc(data.id).update(brandSchema);

                logging.end();
                res.status(200).json({
                  message: "Updated Profile",
                });
              }, 1000);
            })
            .catch(function (error) {
              throw error;
            });
        } else {
          logging.end();
          res.status(200).json({
            message: "Nothing to Update in Profile",
          });
        }
      } else {
        const snapshot = await Firebase.Influencer.doc(data.id).get();

        var difference =
          new Date().getTime() - snapshot.data().updatedDate.toDate().getTime();

        var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
        //console.log("daysDifference", daysDifference);
        if (daysDifference > 15) {
          //console.log("inside");
          let influencerSchema = null;
          const options = {
            method: "GET",
            url: environments.RAPID_USERINFO_URL + snapshot.data().instagramurl,
            headers: {
              "X-RapidAPI-Key": environments.RapidAPIKey,
              "X-RapidAPI-Host": environments.RapidAPIHost,
            },
          };
          let instagramPostDetails = [];
          await axios
            .request(options)
            .then(function (response) {
              let sum = 0;
              let count = 0;

              response.data.data.edge_owner_to_timeline_media.edges.map(
                (item) => {
                  // //console.log(item);
                  sum =
                    sum +
                    item.node.edge_media_to_comment.count +
                    item.node.edge_liked_by.count;

                  if (count <= 4) {
                    // //console.log("item.node.shortcode", item.node.shortcode);
                    let itemData = {
                      id: item.node.id,
                      shortcode: item.node.shortcode,
                      display_url: item.node.display_url,
                      caption:
                        item.node.edge_media_to_caption.edges[0].node.text,
                      edge_media_to_comment:
                        item.node.edge_media_to_comment.count,
                      edge_liked_by: item.node.edge_liked_by.count,
                    };

                    instagramPostDetails.push(itemData);
                  }
                  count++;
                }
              );
              //console.log("SUM", sum);
              let engagementRate =
                sum / response.data.data.edge_followed_by.count;
              //* 1000;
              //console.log("ENGAGEMENT RATE", engagementRate);

              influencerSchema = {
                ...snapshot.data(),
                imgURL1: instagramPostDetails[0].display_url,
                imgURL2: instagramPostDetails[1].display_url,
                imgURL3: instagramPostDetails[2].display_url,
                imgURL4: instagramPostDetails[3].display_url,
                imgURL5: instagramPostDetails[4].display_url,
                instagram: {
                  engagementRate:
                    engagementRate.toString().replace(".", "").substring(0, 1) +
                    "." +
                    engagementRate.toString().replace(".", "").substring(1, 3),
                  id: response.data.data.id,
                  is_business_account: response.data.data.is_business_account,
                  external_url: response.data.data.external_url,
                  followers: response.data.data.edge_followed_by.count,
                  edge_follow: response.data.data.edge_follow.count,
                  is_private: response.data.data.is_private,
                  is_verified: response.data.data.is_verified,
                },
                updatedDate: new Date(),
              };
            })
            .catch(function (error) {
              throw error;
            });

          let interval = 8500;
          let lengthOfArray = instagramPostDetails.length - 1;
          // let influencerArr = [];
          //console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            setTimeout(() => {
              //console.log("hi people", interval * index);

              const d = new Date();
              let month = d.getMonth() + 1;
              let date = d.getDate();
              let year = d.getFullYear();
              let time = d.getTime();
              const fileName =
                data.displayName +
                "_" +
                month +
                "_" +
                date +
                "_" +
                year +
                "_" +
                time +
                "_" +
                index +
                ".jpeg";
              let filePath = path.join(__dirname, "/images", fileName);
              //let filePath = "./images/" + fileName;
              const options = {
                url: file.display_url,
                method: "GET",
              };
              //console.log("fileName", fileName);
              let getDownloadURL = "";
              request(options, async (err, resp, body) => {
                if (resp.statusCode === 200) {
                  //console.log("res.statusCode", resp.statusCode);
                  var bucket = Firebase.admin.storage().bucket();

                  await bucket.upload(filePath);
                  let fileFirebaseURL = environments.FIRESTORE_URL + fileName;
                  //console.log("------Here------");
                  //console.log(fileFirebaseURL);
                  axios
                    .get(fileFirebaseURL)
                    .then((response) => {
                      getDownloadURL =
                        environments.FIRESTORE_URL +
                        `${fileName}?alt=media&token=${response.data.downloadTokens}`;
                      instagramPostDetails[index].new_url = getDownloadURL;
                      //console.log("index", index);
                      fs.unlinkSync(filePath);
                      if (index === lengthOfArray) {
                        //console.log("inside");

                        influencerSchema = {
                          ...influencerSchema,
                          imgURL1: instagramPostDetails[0]?.new_url,
                          imgURL2: instagramPostDetails[1]?.new_url,
                          imgURL3: instagramPostDetails[2]?.new_url,
                          imgURL4: instagramPostDetails[3]?.new_url,
                          imgURL5: instagramPostDetails[4]?.new_url,
                        };
                        //console.log("influencerSchema", influencerSchema);
                        setTimeout(async () => {
                          //console.log("inside2");

                          await Firebase.Influencer.doc(data.id).update(
                            influencerSchema
                          );

                          logging.end();
                          res.status(200).json({
                            message: "Updated Profile",
                          });
                        }, 4000);
                      }
                    })
                    .catch((error) => {
                      throw error;
                    });
                }
              }).pipe(fs.createWriteStream(filePath));
            }, index * interval);
          });
        } else {
          logging.end();
          res.status(200).json({
            message: "Nothing to Update in Profile",
          });
        }
      }
    } else {
      logging.end();
      res.status(200).json({
        message: "Nothing to Update in Profile",
      });
    }
  } catch (error) {
    logging.write(
      new Date() + " - signin/profileupdating ❌ - " + error + " \n"
    );
    console.log(new Date() + " - signin/profileupdating ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// PROFILE PAGE SECTION
// 1. Influencer
app.post("/api/influencer", async (req, res) => {
  logging.write(new Date() + " - influencer POST 🚀 \n");
  console.log(new Date() + " - influencer POST 🚀 \n");

  try {
    //console.log(req.body);
    const snapshot = await Firebase.Influencer.doc(req.body.id).get();

    let list = [];
    //add event and campaign different and show on profile
    snapshot.data().message.map(async (doc) => {
      if (doc.eventId) {
        //console.log(doc.statusID);
        const eventsnapshot = await Firebase.Event.doc(doc.eventId).get();
        list.push({ ...doc, eventDetails: { ...eventsnapshot.data() } });
      }
      if (doc.campaignID) {
        //console.log(doc.statusID);
        const campaignsnapshot = await Firebase.Campaign.doc(
          doc.campaignID
        ).get();
        list.push({ ...doc, campaignDetails: { ...campaignsnapshot.data() } });
      }
    });
    //console.log("list", list);
    setTimeout(() => {
      let influencerprofiledata = {
        ...snapshot.data(),
        message: list,
      };
      //console.log("influencerprofiledata", influencerprofiledata);

      res
        .status(200)
        .json({ data: [influencerprofiledata], message: "Fetched Influencer" });
    }, 1500);
  } catch (error) {
    logging.write(new Date() + " - influencer ❌ - " + error + " \n");
    console.log(new Date() + " - influencer ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 2. Non-influencer
app.post("/api/noninfluencer", async (req, res) => {
  logging.write(new Date() + " - noninfluencer POST 🚀 \n");
  console.log(new Date() + " - noninfluencer POST 🚀 \n");

  try {
    //console.log(req.body);
    const snapshot = await Firebase.NonInfluencer.doc(req.body.id).get();

    setTimeout(() => {
      let noninfluencerprofiledata = {
        ...snapshot.data(),
        // message: list,
      };
      //console.log("noninfluencerprofiledata", noninfluencerprofiledata);

      logging.end();
      res.status(200).json({
        data: [noninfluencerprofiledata],
        message: "Fetched Non Influencer",
      });
    }, 2000);
  } catch (error) {
    logging.write(new Date() + " - noninfluencer ❌ - " + error + " \n");
    console.log(new Date() + " - noninfluencer ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Brand
app.post("/api/brand", async (req, res) => {
  logging.write(new Date() + " - brand POST 🚀 \n");
  console.log(new Date() + " - brand POST 🚀 \n");
  try {
    //console.log(req.body);
    const snapshot = await Firebase.Brand.doc(req.body.id).get();

    //console.log("yahaan hoon");
    let brandprofiledata = {
      ...snapshot.data(),
    };

    res
      .status(200)
      .json({ data: [brandprofiledata], message: "Fetched Brand" });
  } catch (error) {
    logging.write(new Date() + " - brand ❌ - " + error + " \n");
    console.log(new Date() + " - brand ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Advance Brand - Event, Campaign, Coupon Mappings
app.post("/api/brand/advance", async (req, res) => {
  logging.write(new Date() + " - brand/advance POST 🚀 \n");
  console.log(new Date() + " - brand/advance POST 🚀 \n");

  try {
    //console.log("2 ");

    //coupons
    const couponsnapshot = await Firebase.Coupons.get();
    let couponsArr = [];
    couponsnapshot.docs.map((item) => {
      if (item.data().brandcategory.id === req.body.id) {
        couponsArr.push({
          ...item.data(),
          id: item.id,
        });
      }
    });
    //console.log("3 ");

    const campaignsnapshot = await Firebase.Campaign.get();
    let campaignArr = [];
    campaignsnapshot.docs.map((item) => {
      if (item.data().brandcategory.id === req.body.id) {
        campaignArr.push({
          ...item.data(),
          id: item.id,
        });
      }
    });
    //console.log("4 ");

    const eventsnapshot = await Firebase.Event.get();
    let eventArr = [];
    eventsnapshot.docs.map((item) => {
      if (item.data().brandcategory.id === req.body.id) {
        eventArr.push({
          ...item.data(),
          id: item.id,
        });
      }
    });

    //console.log("5 ");

    logging.end();
    res.status(200).json({
      data: {
        couponsArr: couponsArr,
        campaignArr: campaignArr,
        eventArr: eventArr,
      },
      message: "Fetched Advanced Brand",
    });
  } catch (error) {
    //console.log("1 ");
    logging.write(new Date() + " - brand/advance ❌ - " + error + " \n");
    console.log(new Date() + " - brand/advance ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// COUPON, HOME, ADMIN PAGE SECTION
// 1. Coupons Page
app.get("/api/coupons", async (req, res) => {
  logging.write(new Date() + " - coupons GET 🚀 \n");
  console.log(new Date() + " - coupons GET 🚀 \n");

  try {
    const snapshotcoupon = await Firebase.Coupons.get();
    let couponlist = [];
    var q = new Date();
    var m = q.getMonth();
    var d = q.getDay();
    var y = q.getFullYear();

    var date = new Date(y, m, d);

    snapshotcoupon.docs.map((doc) => {
      if (doc.data().isActive === 1) {
        var mydate = new Date(doc.data().date.toString());
        //console.log("mydate >= date", mydate >= date);
        //console.log("mydate,date", { mydate, date });
        if (mydate >= date) {
          couponlist.push({ id: doc.id, ...doc.data() });
        }
      }
    });

    logging.end();
    res.status(200).json({
      couponlist: couponlist,
      message: "Fetched Coupon Page",
    });
  } catch (error) {
    logging.write(new Date() + " - coupons ❌ - " + error + " \n");
    console.log(new Date() + " - coupons ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 2. Home Page
app.post("/api/home", async (req, res) => {
  logging.write(new Date() + " - home POST 🚀 \n");
  console.log(new Date() + " - home POST 🚀 \n");

  try {
    const gallerySnapshot = await Firebase.Gallery.get();
    let gallery = [];
    let exhibitiongallery = [];
    gallerySnapshot.docs.map((doc) => {
      if (doc.data().isActive === 1) {
        if (doc.data().type === "event") {
          gallery.push({ id: doc.id, ...doc.data() });
        } else if (doc.data().type === "exhibition") {
          exhibitiongallery.push({ id: doc.id, ...doc.data() });
        } else {
          //nothing
        }
      }
    });

    //campaign
    const snapshot = await Firebase.Campaign.get();
    let campaignlist = [];
    snapshot.docs.map((doc) => {
      if (doc.data().isActive === 1) {
        campaignlist.push({ id: doc.id, ...doc.data() });
      }
    });

    //influencer
    const snapshotInfl = await Firebase.Influencer.get();
    let influencerlist = [];
    let isMember = false;
    let status = "new";
    snapshotInfl.docs.map((doc) => {
      if (doc.data().status === "accepted") {
        influencerlist.push({ id: doc.id, ...doc.data() });
      }
      if (doc.id === req.body.id) {
        isMember = doc.data().pinkskymember.isMember;
        status = doc.data().status;
      }
    });

    const snapshotNonInfluencer = await Firebase.NonInfluencer.get();
    snapshotNonInfluencer.docs.map((doc) => {
      if (doc.id === req.body.id) {
        isMember = doc.data()?.pinkskymember?.isMember;
      }
    });

    const snapshotBrand = await Firebase.Brand.get();
    snapshotBrand.docs.map((doc) => {
      if (doc.id === req.body.id) {
        isMember = doc.data()?.pinkskymember?.isMember;
        status = doc.data().status;
      }
    });

    //event
    const snapshotevent = await Firebase.Event.get();
    let eventlist = [];
    snapshotevent.docs.map((doc) => {
      if (doc.data().isActive === 1) {
        eventlist.push({ id: doc.id, ...doc.data() });
      }
    });

    //coupon
    var q = new Date();
    var m = q.getMonth();
    var d = q.getDay();
    var y = q.getFullYear();

    var date = new Date(y, m, d);
    const snapshotcoupon = await Firebase.Coupons.get();
    let couponlist = [];
    snapshotcoupon.docs.map((doc) => {
      if (doc.data().isActive === 1) {
        var mydate = new Date(doc.data().date.toString());

        if (mydate >= date) {
          couponlist.push({ id: doc.id, ...doc.data() });
        }
      }
    });

    logging.end();
    res.status(200).json({
      isMember: isMember,
      status: status,
      gallerylist: gallery.sort((a, b) => b.createdDate - a.createdDate),
      exhibitiongallerylist: exhibitiongallery.sort(
        (a, b) => b.createdDate - a.createdDate
      ),
      campaignlist: campaignlist
        .sort((a, b) => b.createdDate - a.createdDate)
        .slice(0, 6),
      influencerlist: influencerlist
        .sort((a, b) => b.createdDate - a.createdDate)
        .slice(0, 6),
      eventlist: eventlist.sort((a, b) => b.createdDate - a.createdDate),
      couponlist: couponlist
        .sort((a, b) => b.createdDate - a.createdDate)
        .slice(0, 10),
      message: "Fetched Home",
    });
  } catch (error) {
    logging.write(new Date() + " - home ❌ - " + error + " \n");
    console.log(new Date() + " - home ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Admin Pages
app.post("/api/admin/pinksky", async (req, res) => {
  logging.write(new Date() + " - admin/pinksky POST 🚀 \n");
  console.log(new Date() + " - admin/pinksky POST 🚀 \n");

  try {
    let data = req.body;

    const getAdmin = await Firebase.Influencer.doc(data.adminid).get();
    //console.log("entered", getAdmin.data().admin);

    if (getAdmin.data().admin) {
      if (data.changesTrigger === "" || data.changesTrigger === undefined) {
        //globalAdmin = false;
        //console.log("step00");
        const snapshotGallerydata = await Firebase.Gallery.get();
        let gallerylist = [];
        //console.log("step0");
        snapshotGallerydata.docs.map((doc) => {
          //console.log("step0");
          if (doc.data()?.isActive === 1) {
            gallerylist.push({ id: doc.id, ...doc.data() });
          } else {
            //move
          }
        });

        let ramdomdatalist = [];

        //console.log("step1");
        const snapshotCoupon = await Firebase.Coupons.get();
        let couponlist = [];
        snapshotCoupon.docs.map((doc) => {
          if (doc.data()?.isActive === 1) {
            couponlist.push({ id: doc.id, ...doc.data() });
          } else {
            //move
          }
        });
        //console.log("step2");
        const snapshotCamp = await Firebase.Campaign.get();
        let campaignlist = [];
        let rawcampaignlist = [];
        snapshotCamp.docs.map((doc) => {
          if (doc.data()?.isActive === 1) {
            campaignlist.push({ id: doc.id, ...doc.data() });
          }
          rawcampaignlist.push({ id: doc.id, ...doc.data() });
        });
        //console.log("step3");
        //event
        const snapshotevent = await Firebase.Event.get();
        let eventlist = [];
        let raweventlist = [];
        snapshotevent.docs.map((doc) => {
          if (doc.data().isActive === 1) {
            eventlist.push({ id: doc.id, ...doc.data() });
          }
          raweventlist.push({ id: doc.id, ...doc.data() });
        });
        //console.log("step4");
        //influencer
        const snapshotInfl = await Firebase.Influencer.get();
        let influencerlist = [];

        //console.log("step5");
        snapshotInfl.docs.map((doc) => {
          let localcampaignmapping = [];
          let localeventmapping = [];
          if (
            doc.data().status === "new" &&
            doc.data().isProfileCompleted === 1
          ) {
            influencerlist.push({
              id: doc.id,
              ...doc.data(),
            });
          } else if (doc.data().status === "accepted") {
            //console.log("influencerlist6", doc.id);
            //console.log("influencerlist6?", doc.data()?.campaignmapping);
            if (
              doc.data()?.campaignmapping === undefined ||
              doc.data()?.campaignmapping.length === 0
            ) {
              localcampaignmapping = [];
            } else {
              //console.log("influencerlist66");
              doc.data().campaignmapping.map((nesitem) => {
                //console.log("influencerlist666");
                localcampaignmapping.push({
                  ...nesitem,
                  name:
                    rawcampaignlist.filter(
                      (fun) => fun.id === nesitem.campaignId
                    )[0].name || "",
                  category:
                    rawcampaignlist.filter(
                      (fun) => fun.id === nesitem.campaignId
                    )[0].category || [],
                });
              });
            }

            //console.log("influencerlist7");
            if (
              doc.data()?.eventmapping === undefined ||
              doc.data()?.eventmapping.length === 0
            ) {
              localeventmapping = [];
            } else {
              //console.log("influencerlist77");
              doc.data().eventmapping.map((nesitem) => {
                //console.log("influencerlist777");
                raweventlist.filter((fun) => fun.id === nesitem.eventId)
                  .length > 0 &&
                  localeventmapping.push({
                    ...nesitem,
                    name:
                      raweventlist.filter(
                        (fun) => fun.id === nesitem.eventId
                      )[0].name || "",
                  });
              });
            }
            //console.log("influencerlist1");
            influencerlist.push({
              id: doc.id,
              ...doc.data(),
              campaignmapping: localcampaignmapping,
              eventmapping: localeventmapping,
            });
            //console.log("influencerlist2");
          } else {
            //console.log("influencerlist3");
          }
        });
        //console.log("influencerlist4");

        //console.log("step6");
        //brand
        const snapshotbrand = await Firebase.Brand.get();
        let brandlist = [];

        snapshotbrand.docs.map((doc) => {
          let localinfluemapping = [];
          let locallaunchmapping = [];
          //console.log("step6kyahai--");
          if (doc.data()?.status === "new") {
            brandlist.push({ id: doc.id, ...doc.data() });
          } else if (doc.data()?.status === "accepted") {
            doc.data().message.map((item) => {
              if (item?.isShowAdmin === true) {
                locallaunchmapping.push(item);
              } else {
                //continue
              }
            });
            //console.log("step6?");
            if (doc.data().influencermapping.length > 0) {
              doc.data().influencermapping.map((nesitem) => {
                //console.log("Datataatat", nesitem);
                localinfluemapping.push({
                  ...nesitem,
                  name:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.name || "",
                  surname:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.surname || "",
                  phonenumber:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.phonenumber || "",
                  whatsappnumber:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.whatsappnumber || "",
                  instagramurl:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.instagramurl || "",
                  email:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.email || "",
                  category:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0]?.category || "",
                });
              });
            }

            //console.log("step6??");
            brandlist.push({
              id: doc.id,
              ...doc.data(),
              influencermapping: localinfluemapping,
              launchmapping: locallaunchmapping,
            });
          }
        });

        let pinkskypopuplist = [];

        //console.log("step8");

        logging.end();
        res.status(200).json({
          campaignlist: campaignlist,
          influencerlist: influencerlist,
          brandlist: brandlist,
          eventlist: eventlist,
          pinkskypopuplist: pinkskypopuplist,
          couponlist: couponlist,
          ramdomdatalist: ramdomdatalist,
          gallerylist: gallerylist,
          message: "Fetched Admin",
        });
      } else if (data.changesTrigger === "influencer") {
        //console.log("step2");
        const snapshotCamp = await Firebase.Campaign.get();
        let rawcampaignlist = [];
        snapshotCamp.docs.map((doc) => {
          rawcampaignlist.push({ id: doc.id, ...doc.data() });
        });
        //console.log("step3");
        //event
        const snapshotevent = await Firebase.Event.get();
        // let eventlist = [];
        let raweventlist = [];
        snapshotevent.docs.map((doc) => {
          raweventlist.push({ id: doc.id, ...doc.data() });
        });
        //console.log("step4");
        //influencer
        const snapshotInfl = await Firebase.Influencer.get();
        let influencerlist = [];

        //console.log("step5");
        snapshotInfl.docs.map((doc) => {
          let localcampaignmapping = [];
          let localeventmapping = [];
          if (
            doc.data().status === "new" &&
            doc.data().isProfileCompleted === 1
          ) {
            influencerlist.push({
              id: doc.id,
              ...doc.data(),
            });
          } else if (doc.data().status === "accepted") {
            //console.log("influencerlist6");
            if (doc.data().campaignmapping.length > 0) {
              doc.data().campaignmapping.map((nesitem) => {
                //console.log("influencerlist66");
                localcampaignmapping.push({
                  ...nesitem,
                  name:
                    rawcampaignlist.filter(
                      (fun) => fun.id === nesitem.campaignId
                    )[0].name || "",
                  category:
                    rawcampaignlist.filter(
                      (fun) => fun.id === nesitem.campaignId
                    )[0].category || [],
                });
              });
            }

            if (doc.data().eventmapping.length > 0) {
              doc.data().eventmapping.map((nesitem) => {
                //console.log(
                //   "raweventlist.filter((fun) => fun.id === nesitem.eventId)[0].name",
                //   raweventlist.filter((fun) => fun.id === nesitem.eventId)[0].name
                // );
                localeventmapping.push({
                  ...nesitem,
                  name:
                    raweventlist.filter((fun) => fun.id === nesitem.eventId)[0]
                      .name || "",
                });
              });
            }

            //console.log("influencerlist1");
            influencerlist.push({
              id: doc.id,
              ...doc.data(),
              campaignmapping: localcampaignmapping,
              eventmapping: localeventmapping,
            });
            //console.log("influencerlist2");
          } else {
            //console.log("influencerlist3");
          }
        });

        logging.end();
        res.status(200).json({
          campaignlist: [],
          influencerlist: influencerlist,
          brandlist: [],
          eventlist: [],
          pinkskypopuplist: [],
          couponlist: [],
          gallerylist: [],
          message: "Fetched Admin",
        });
      } else if (data.changesTrigger === "brand") {
        //console.log("step2");
        const snapshotCamp = await Firebase.Campaign.get();

        let rawcampaignlist = [];
        snapshotCamp.docs.map((doc) => {
          rawcampaignlist.push({ id: doc.id, ...doc.data() });
        });
        //console.log("step3");
        //event
        const snapshotevent = await Firebase.Event.get();
        let raweventlist = [];
        snapshotevent.docs.map((doc) => {
          raweventlist.push({ id: doc.id, ...doc.data() });
        });
        //console.log("step4");
        //influencer
        const snapshotInfl = await Firebase.Influencer.get();
        let influencerlist = [];

        //console.log("step5");
        snapshotInfl.docs.map((doc) => {
          let localcampaignmapping = [];
          let localeventmapping = [];
          if (
            doc.data().status === "new" &&
            doc.data().isProfileCompleted === 1
          ) {
            influencerlist.push({
              id: doc.id,
              ...doc.data(),
            });
          } else if (doc.data().status === "accepted") {
            //console.log("influencerlist6");

            if (doc.data().campaignmapping.length > 0) {
              doc.data().campaignmapping.map((nesitem) => {
                //console.log("influencerlist66");

                localcampaignmapping.push({
                  ...nesitem,
                  name:
                    rawcampaignlist.filter(
                      (fun) => fun.id === nesitem.campaignId
                    )[0].name || "",
                  category:
                    rawcampaignlist.filter(
                      (fun) => fun.id === nesitem.campaignId
                    )[0].category || [],
                });
              });
            }
            if (doc.data().eventmapping.length > 0) {
              doc.data().eventmapping.map((nesitem) => {
                localeventmapping.push({
                  ...nesitem,
                  name:
                    raweventlist.filter((fun) => fun.id === nesitem.eventId)[0]
                      .name || "",
                });
              });
            }

            //console.log("influencerlist7");

            //console.log("influencerlist1");
            influencerlist.push({
              id: doc.id,
              ...doc.data(),
              campaignmapping: localcampaignmapping,
              eventmapping: localeventmapping,
            });
            //console.log("influencerlist2");
          } else {
            //console.log("influencerlist3");
          }
        });

        const snapshotbrand = await Firebase.Brand.get();
        let brandlist = [];

        snapshotbrand.docs.map((doc) => {
          let localinfluemapping = [];
          let locallaunchmapping = [];
          if (doc.data()?.status === "new") {
            brandlist.push({ id: doc.id, ...doc.data() });
          } else if (doc.data()?.status === "accepted") {
            doc.data().message.map((item) => {
              if (item.isShowAdmin === true) {
                locallaunchmapping.push(item);
              }
            });
            if (doc.data().influencermapping.length > 0) {
              doc.data().influencermapping.map((nesitem) => {
                localinfluemapping.push({
                  ...nesitem,
                  name:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].name || "",
                  surname:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].surname || "",
                  phonenumber:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].phonenumber || "",
                  whatsappnumber:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].whatsappnumber || "",
                  instagramurl:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].instagramurl || "",
                  email:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].email || "",
                  category:
                    influencerlist.filter(
                      (fun) => fun.id === nesitem.influencerId
                    )[0].category || "",
                });
              });
            }

            brandlist.push({
              id: doc.id,
              ...doc.data(),
              influencermapping: localinfluemapping,
              launchmapping: locallaunchmapping,
            });
          }
        });

        logging.end();
        res.status(200).json({
          campaignlist: [],
          influencerlist: [],
          brandlist: brandlist,
          eventlist: [],
          pinkskypopuplist: [],
          couponlist: [],
          gallerylist: [],
          message: "Fetched Admin",
        });
      } else if (data.changesTrigger === "campaign") {
        //console.log("step2");
        const snapshotCamp = await Firebase.Campaign.get();
        let campaignlist = [];

        snapshotCamp.docs.map((doc) => {
          if (doc.data()?.isActive === 1) {
            campaignlist.push({ id: doc.id, ...doc.data() });
          }
        });

        logging.end();
        res.status(200).json({
          campaignlist: campaignlist,
          influencerlist: [],
          brandlist: [],
          eventlist: [],
          pinkskypopuplist: [],
          couponlist: [],
          gallerylist: [],
          message: "Fetched Admin",
        });
      } else if (data.changesTrigger === "event") {
        const snapshotevent = await Firebase.Event.get();
        let eventlist = [];

        snapshotevent.docs.map((doc) => {
          if (doc.data().isActive === 1) {
            eventlist.push({ id: doc.id, ...doc.data() });
          }
        });

        logging.end();
        res.status(200).json({
          campaignlist: [],
          influencerlist: [],
          brandlist: [],
          eventlist: eventlist,
          pinkskypopuplist: [],
          couponlist: [],
          gallerylist: [],
          message: "Fetched Admin",
        });
      } else if (data.changesTrigger === "member") {
        //console.log("step1");
        const snapshotCoupon = await Firebase.Coupons.get();
        let couponlist = [];
        snapshotCoupon.docs.map((doc) => {
          if (doc.data()?.isActive === 1) {
            couponlist.push({ id: doc.id, ...doc.data() });
          } else {
            //move
          }
        });

        logging.end();
        res.status(200).json({
          campaignlist: [],
          influencerlist: [],
          brandlist: [],
          eventlist: [],
          pinkskypopuplist: [],
          couponlist: couponlist,
          gallerylist: [],
          message: "Fetched Admin",
        });
      } else if (data.changesTrigger === "gallery") {
        const snapshotGallerydata = await Firebase.Gallery.get();
        let gallerylist = [];
        //console.log("step0");
        snapshotGallerydata.docs.map((doc) => {
          //console.log("step0");
          if (doc.data()?.isActive === 1) {
            gallerylist.push({ id: doc.id, ...doc.data() });
          } else {
            //move
          }
        });

        logging.end();
        res.status(200).json({
          campaignlist: [],
          influencerlist: [],
          brandlist: [],
          eventlist: [],
          pinkskypopuplist: [],
          couponlist: [],
          gallerylist: gallerylist,
          message: "Fetched Admin",
        });
      } else {
        res.status(401).json({ message: "Failed!" });
      }
    } else {
      res.status(401).json({ message: "Failed!" });
    }
  } catch (error) {
    logging.write(new Date() + " - admin/pinksky ❌ - " + error + " \n");
    console.log(new Date() + " - admin/pinksky ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// FILTER SECTION
// 1. City filter
// app.post("/api/city/filter", async (req, res) => {
//   try {
//     const data = req.body;
//     //console.log(data.city);

//     let cityvaluearray = [];
//     cityArrWithAllCity.map((m) => {
//       if (m.value.toLowerCase().indexOf(data.city) !== -1) {
//         cityvaluearray.push({ ...m, status: true });
//       }
//       // else {
//       //   cityvaluearray.push({ ...m, status: false });
//       // }
//     });
//     setTimeout(() => {
//
//logging.end();
//res.status(200).json({
//         data: cityvaluearray,
//         message: "Filtered City",
//       });
//     }, 1200);
//   } catch (error) {
//
//logging.end();
//res.status(500).json({ message: error });
//   }
// });

// 2. Admin brand filter
app.post("/api/brands/filter", async (req, res) => {
  logging.write(new Date() + " - brand/filter POST 🚀 \n");
  console.log(new Date() + " - brand/filter POST 🚀 \n");

  try {
    let data = req.body;

    const snapshot = await Firebase.Brand.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;

    if (
      data.inputValue.toLowerCase() === environments.ADMIN_BRAND_FILTER_TEXT
    ) {
      namesorted = list;
    } else if (data.inputValue !== "") {
      namesorted = list.filter((item) => {
        if (
          item.companyname
            .toLowerCase()
            .indexOf(data.inputValue.toString().toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    } else {
      namesorted = list;
    }
    //console.log("citysorted length", namesorted.length);

    logging.end();
    res.status(200).json({ data: namesorted, message: "Filtered Brand" });
  } catch (error) {
    logging.write(new Date() + " - brand/filter ❌ - " + error + " \n");
    console.log(new Date() + " - brand/filter ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Admin event filter
app.post("/api/events/filter", async (req, res) => {
  logging.write(new Date() + " - events POST 🚀 \n");
  console.log(new Date() + " - events POST 🚀 \n");

  try {
    let data = req.body;

    const snapshot = await Firebase.Event.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;
    //console.log("step 1");
    if (
      data.inputValue.toLowerCase() === environments.ADMIN_EVENT_FILTER_TEXT
    ) {
      namesorted = list;
    } else if (data.inputValue !== "") {
      //console.log("step 2");
      namesorted = list.filter((item) => {
        if (
          item.name
            .toLowerCase()
            .indexOf(data.inputValue.toString().toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    } else {
      namesorted = list;
    }
    //console.log("citysorted length", namesorted.length);

    logging.end();
    res.status(200).json({ data: namesorted, message: "Filtered Event" });
  } catch (error) {
    logging.write(new Date() + " - events ❌ - " + error + " \n");
    console.log(new Date() + " - events ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 4. Admin coupons filter
app.post("/api/coupons/filter", async (req, res) => {
  logging.write(new Date() + " - coupons/filter POST 🚀 \n");
  console.log(new Date() + " - coupons/filter POST 🚀 \n");

  try {
    let data = req.body;

    const snapshot = await Firebase.Coupons.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;
    //console.log("step 1");
    if (
      data.inputValue.toLowerCase() === environments.ADMIN_COUPON_FILTER_TEXT
    ) {
      namesorted = list;
    } else if (data.inputValue !== "") {
      //console.log("step 2");
      namesorted = list.filter((item) => {
        if (
          item.description
            .toLowerCase()
            .indexOf(data.inputValue.toString().toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    } else {
      namesorted = list;
    }
    //console.log("namesorted length", namesorted.length);

    logging.end();
    res.status(200).json({ data: namesorted, message: "Filtered Coupons" });
  } catch (error) {
    logging.write(new Date() + " - coupons/filter ❌ - " + error + " \n");
    console.log(new Date() + " - coupons/filter ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 5. Influencer filter
app.post("/api/influencer/filter", async (req, res) => {
  logging.write(new Date() + " - influencer/filter POST 🚀 \n");
  console.log(new Date() + " - influencer/filter POST 🚀 \n");

  try {
    let data = req.body;

    const snapshot = await Firebase.Influencer.get();
    let list = [];

    snapshot.docs.map((doc) => {
      //console.log(doc.id);
      if (doc.data().status === "accepted") {
        list.push({ id: doc.id, ...doc.data() });
      } else {
        //nothing
      }
    });

    let namesorted;
    let agesorted;
    let gendersorted;
    let followersorted;
    let categorysorted;
    let citysorted;

    if (
      data.inputValue.toLowerCase() ===
      environments.ADMIN_INFLUENCER_FILTER_TEXT
    ) {
      namesorted = list;
    } else if (data.inputValue !== "") {
      namesorted = list.filter((item) => {
        if (
          item.name
            .toLowerCase()
            .indexOf(data.inputValue.toString().toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    } else {
      namesorted = list;
    }
    if (data.radioAgeValue !== "All") {
      agesorted = namesorted.filter((item) => {
        const ageDifMs = Date.now() - new Date(item.dob).getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        if (data.radioAgeValue === "lessthan20") {
          return age < 20;
        } else if (data.radioAgeValue === "lessthan25") {
          return age < 25;
        } else if (data.radioAgeValue === "lessthan30") {
          return age < 30;
        } else if (data.radioAgeValue === "greaterthan30") {
          return age > 30;
        }
      });
    } else {
      agesorted = namesorted;
    }
    if (data.radioGenderValue !== "All") {
      gendersorted = agesorted.filter((item) => {
        if (data.radioGenderValue === "Male") {
          return item.gender === "Male";
        } else if (data.radioGenderValue === "Female") {
          return item.gender === "Female";
        } else if (data.radioGenderValue === "Other") {
          return item.gender === "Other";
        }
      });
    } else {
      gendersorted = agesorted;
    }
    if (data.radioFollowerValue !== "All") {
      followersorted = gendersorted.filter((item) => {
        if (data.radioFollowerValue === "greaterthan1M") {
          return item.instagram.followers > 1000000;
        } else if (data.radioFollowerValue === "greaterthan100K") {
          return item.instagram.followers > 100000;
        } else if (data.radioFollowerValue === "greaterthan20K") {
          return item.instagram.followers > 20000;
        } else if (data.radioFollowerValue === "greaterthan1000") {
          return item.instagram.followers > 1000;
        } else if (data.radioFollowerValue === "lessthan1000") {
          return item.instagram.followers <= 1000;
        }
      });
    } else {
      followersorted = gendersorted;
    }
    let selectedCategory = [];
    let mySetCategory = new Set();
    data.radioInfluencerValue
      .filter((item) => item.status === true)
      .map((categ) => selectedCategory.push(categ.label));
    if (selectedCategory[0] !== "All") {
      followersorted.map((element) => {
        element.category.filter((nesele) => {
          if (Object.values(nesele).some((r) => selectedCategory.includes(r))) {
            mySetCategory.add(element);
          }
        });
      });
      categorysorted = Array.from(mySetCategory);
    } else {
      categorysorted = followersorted;
    }

    let selectedCity = [];
    let mySetCity = new Set();
    data.radioCityValue
      .filter((item) => item.status === true)
      .map((categ) => selectedCity.push(categ.value));
    if (selectedCity[0] !== "All") {
      categorysorted.map((element) => {
        if (Object.values(element).some((r) => selectedCity.includes(r))) {
          mySetCity.add(element);
        }
      });
      citysorted = Array.from(mySetCity);
    } else {
      citysorted = categorysorted;
    }
    //console.log("citysorted length", citysorted.length);

    logging.end();
    res.status(200).json({ data: citysorted, message: "Filtered Influencer" });
  } catch (error) {
    logging.write(new Date() + " - influencer/filter ❌ - " + error + " \n");
    console.log(new Date() + " - influencer/filter ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 6. Campaign filter
app.post("/api/campaign/filter", async (req, res) => {
  logging.write(new Date() + " - campaign/filter POST 🚀 \n");
  console.log(new Date() + " - campaign/filter POST 🚀 \n");

  try {
    let data = req.body;

    const snapshot = await Firebase.Campaign.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;

    let categorysorted;
    let citysorted;
    let specialValuesorted;
    let brandcategorysorted;
    //console.log("list length", list.length);
    if (data.inputValue.toLowerCase() === "allcampaigndata") {
      namesorted = list.filter((item) => item.isActive === 1);
    } else if (data.inputValue !== "") {
      namesorted = list.filter((item) => {
        if (
          item.name
            .toLowerCase()
            .indexOf(data.inputValue.toString().toLowerCase()) !== -1
        ) {
          return item;
        }
      });
    } else {
      namesorted = list.filter((item) => item.isActive === 1);
    }

    let selectedCategory = [];
    let mySetCategory = new Set();
    data.radioInfluencerValue
      .filter((item) => item.status === true)
      .map((categ) => selectedCategory.push(categ.label));
    if (selectedCategory[0] !== "All") {
      namesorted.map((element) => {
        element.category.filter((nesele) => {
          if (Object.values(nesele).some((r) => selectedCategory.includes(r))) {
            mySetCategory.add(element);
          }
        });
      });
      categorysorted = Array.from(mySetCategory);
    } else {
      categorysorted = namesorted;
    }
    let selectedCity = [];
    let mySetCity = new Set();
    data.radioCityValue
      .filter((item) => item.status === true)
      .map((categ) => selectedCity.push(categ.value));
    if (selectedCity[0] !== "All") {
      categorysorted.map((element) => {
        if (Object.values(element).some((r) => selectedCity.includes(r))) {
          mySetCity.add(element);
        }
      });
      citysorted = Array.from(mySetCity);
    } else {
      citysorted = categorysorted;
    }
    //console.log("citysorted length", citysorted.length);
    if (data.radioSpecialValue !== "All") {
      specialValuesorted = citysorted.filter((item) => {
        if (data.radioSpecialValue === "Pinksky Privilege") {
          return item.viewerDetails.pinkskyPrivilege === true;
        } else if (data.radioSpecialValue === "Paid Privilege") {
          return item.viewerDetails.paidPrivilege === true;
        }
      });
    } else {
      specialValuesorted = citysorted;
    }

    let brandselectedCategory = [];
    let myBrandSetCategory = new Set();
    data.radioBrandValue
      .filter((item) => item.status === true)
      .map((categ) => brandselectedCategory.push(categ.label));
    //console.log("check 1", brandselectedCategory);
    if (brandselectedCategory[0] !== "All") {
      specialValuesorted.map((element) => {
        if (brandselectedCategory.includes(element.brandcategory.category)) {
          myBrandSetCategory.add(element);
        }
      });
      brandcategorysorted = Array.from(myBrandSetCategory);
    } else {
      brandcategorysorted = specialValuesorted;
    }
    //console.log("brandcategorysorted length", brandcategorysorted.length);

    logging.end();
    res.status(200).json({
      data: brandcategorysorted.sort((a, b) => b.createdDate - a.createdDate),
      message: "Filtered Campaign",
    });
  } catch (error) {
    logging.write(new Date() + " - campaign/filter ❌ - " + error + " \n");
    console.log(new Date() + " - campaign/filter ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// REGISTER SECTION
// 1. Influencer registeration
app.post("/api/influencer/create", async (req, res) => {
  logging.write(new Date() + " - influencer/create POST 🚀 \n");
  console.log(new Date() + " - influencer/create POST 🚀 \n");

  let userResponse = { uid: "" };

  let influencerData = req.body;
  let isProfileCompletedQuery = req.query.isProfileCompleted;
  //console.log("influencerData", req.body);
  //console.log("isProfileCompletedQuery", isProfileCompletedQuery);

  const createUser = {
    email: influencerData.email,
    password: influencerData.password,
    name:
      isProfileCompletedQuery +
      "_Influencer_" +
      influencerData.name.replace(/\s/g, "") +
      "_" +
      influencerData.surname.replace(/\s/g, ""),
  };
  //console.log("createUser", createUser);
  try {
    //login here
    if (createUser.email != undefined && createUser.password != undefined) {
      if (influencerData.isNonInfluencer.uuid.toString().length > 2) {
        let getUserByUuid = await Firebase.admin
          .auth()
          .getUser(influencerData.isNonInfluencer.uuid.toString());

        await Firebase.admin.auth().updateUser(getUserByUuid?.uid, {
          password: createUser.password,
          emailVerified: false,
          disabled: false,
          displayName: createUser.name,
        });

        userResponse = {
          email: influencerData.email,
          uid: getUserByUuid?.uid,
        };
        //console.log("def", userResponse);
      } else {
        //console.log("abc");
        userResponse = await Firebase.admin.auth().createUser({
          email: createUser.email,
          password: createUser.password,
          emailVerified: false,
          disabled: false,
          displayName: createUser.name,
        });
      }

      //console.log(
      //   "userResponse email",
      //   environments.NODE_ENV,
      //   userResponse.email,
      //   userResponse.uid
      // );
      if (userResponse.email !== undefined && userResponse.uid !== undefined) {
        let influencerSchema = null;
        const options = {
          method: "GET",
          url: environments.RAPID_USERINFO_URL + influencerData.instagramurl,
          headers: {
            "X-RapidAPI-Key": environments.RapidAPIKey,
            "X-RapidAPI-Host": environments.RapidAPIHost,
          },
        };

        //Here -- axios
        let instagramPostDetails = [];
        let onGoingStatus = 200;
        // let breakMovement = true;
        await axios
          .request(options)
          .then(function (response) {
            if (response.data.data.is_private === false) {
              let sum = 0;
              let count = 0;
              //console.log(
              //   "response.data.data.edge_owner_to_timeline_media.edges",
              //   response.data.data.edge_owner_to_timeline_media.edges.length
              // );
              if (
                response.data.data.edge_owner_to_timeline_media.edges.length > 4
              ) {
                response.data.data.edge_owner_to_timeline_media.edges.map(
                  (item) => {
                    // //console.log(item);
                    //console.log(count);
                    sum =
                      sum +
                      item?.node.edge_media_to_comment.count +
                      item?.node.edge_liked_by.count;

                    if (count <= 4) {
                      //console.log(
                      //   "item.node.shortcode - ",
                      //   item?.node.shortcode
                      // );
                      let itemData = {
                        id: item?.node.id,
                        shortcode: item?.node.shortcode,
                        display_url: item?.node.display_url,
                        caption:
                          item?.node.edge_media_to_caption.edges[0]?.node.text,
                        edge_media_to_comment:
                          item?.node.edge_media_to_comment.count,
                        edge_liked_by: item?.node.edge_liked_by.count,
                      };

                      instagramPostDetails.push(itemData);
                    }
                    count++;
                  }
                );
              } else {
                const err = new TypeError(
                  "We cant't calculate your profile. Please login in with public instagram profile with more than 5 posts."
                );
                throw err;
              }

              let engagementRate =
                sum / response.data.data.edge_followed_by.count;
              // * 1000;

              //console.log(
              //   "engagementRate",
              //   engagementRate.toString().replace(".", "")
              // );
              influencerSchema = {
                ...influencerData,
                instagram: {
                  engagementRate:
                    engagementRate.toString().replace(".", "").substring(0, 1) +
                    "." +
                    engagementRate.toString().replace(".", "").substring(1, 3),
                  id: response.data.data.id,
                  is_business_account: response.data.data.is_business_account,
                  external_url: response.data.data.external_url,
                  followers: response.data.data.edge_followed_by.count,
                  edge_follow: response.data.data.edge_follow.count,
                  is_private: response.data.data.is_private,
                  is_verified: response.data.data.is_verified,
                },
              };
              onGoingStatus = 200;
            } else {
              onGoingStatus = 401;
            }
          })
          .catch(function (error) {
            throw error;
          });

        if (onGoingStatus === 401) {
          const err = new TypeError(
            "Please Register With Public Instagram Account"
          );
          throw err;
        } else {
          let interval = 8500;
          let lengthOfArray = instagramPostDetails.length - 1;
          let influencerArr = [];
          //console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            setTimeout(() => {
              //console.log("hi people", interval * index);

              const d = new Date();
              let month = d.getMonth() + 1;
              let date = d.getDate();
              let year = d.getFullYear();
              let time = d.getTime();
              const fileName =
                createUser.name +
                "_" +
                month +
                "_" +
                date +
                "_" +
                year +
                "_" +
                time +
                "_" +
                index +
                ".jpeg";
              let filePath = path.join(__dirname, "/images", fileName);
              //let filePath = "./images/" + fileName;
              const options = {
                url: file.display_url,
                method: "GET",
              };
              //console.log("fileName", fileName);
              let getDownloadURL = "";
              request(options, async (err, resp, body) => {
                if (resp.statusCode === 200) {
                  //console.log("res.statusCode", resp.statusCode);
                  var bucket = Firebase.admin.storage().bucket();

                  await bucket.upload(filePath);
                  let fileFirebaseURL = environments.FIRESTORE_URL + fileName;
                  //console.log("------Here------");
                  //console.log(fileFirebaseURL);
                  axios
                    .get(fileFirebaseURL)
                    .then(async (response) => {
                      getDownloadURL =
                        environments.FIRESTORE_URL +
                        `${fileName}?alt=media&token=${response.data.downloadTokens}`;
                      instagramPostDetails[index].new_url = getDownloadURL;
                      //console.log("index", index);
                      fs.unlinkSync(filePath);
                      if (index === lengthOfArray) {
                        //console.log("inside");
                        if (
                          influencerData.isNonInfluencer.uuid.toString()
                            .length > 2
                        ) {
                          const snapshotNonInfluencer =
                            await Firebase.NonInfluencer.doc(
                              influencerData.isNonInfluencer.id.toString()
                            ).get();
                          influencerSchema = {
                            ...influencerSchema,
                            pinkskymember:
                              snapshotNonInfluencer.data().pinkskymember,
                            isProfileCompleted: isProfileCompletedQuery,
                            imgURL1: instagramPostDetails[0]?.new_url,
                            imgURL2: instagramPostDetails[1]?.new_url,
                            imgURL3: instagramPostDetails[2]?.new_url,
                            imgURL4: instagramPostDetails[3]?.new_url,
                            imgURL5: instagramPostDetails[4]?.new_url,
                            message: [
                              {
                                statusID: "100",
                                campaignID: "",
                                campaignName: "",
                              },
                            ],
                            createdDate: new Date(),
                            updatedDate: new Date(),
                          };
                        } else {
                          influencerSchema = {
                            ...influencerSchema,
                            isProfileCompleted: isProfileCompletedQuery,
                            imgURL1: instagramPostDetails[0]?.new_url,
                            imgURL2: instagramPostDetails[1]?.new_url,
                            imgURL3: instagramPostDetails[2]?.new_url,
                            imgURL4: instagramPostDetails[3]?.new_url,
                            imgURL5: instagramPostDetails[4]?.new_url,
                            message: [
                              {
                                statusID: "100",
                                campaignID: "",
                                campaignName: "",
                              },
                            ],
                            createdDate: new Date(),
                            updatedDate: new Date(),
                          };
                        }

                        //console.log("influencerSchema", influencerSchema);
                        Firebase.Influencer.add(influencerSchema);
                        //console.log("hello");
                        setTimeout(async () => {
                          //console.log("inside2");

                          const snapshot = await Firebase.Influencer.get();
                          snapshot.docs.map((doc) => {
                            if (doc.data().email === createUser.email) {
                              influencerArr.push({ id: doc.id, ...doc.data() });
                            }
                          });
                          //setting up coupon from noninfluencer
                          if (
                            influencerData.isNonInfluencer.uuid.toString()
                              .length > 2 &&
                            influencerSchema.pinkskymember.isMember === true
                          ) {
                            const snapshotCoupon = await Firebase.Coupons.get();
                            snapshotCoupon.docs.map(async (doc) => {
                              if (
                                doc
                                  .data()
                                  .userCouponMapping.includes(
                                    influencerData.isNonInfluencer.id.toString()
                                  )
                              ) {
                                await Firebase.Coupons.doc(doc.id).update({
                                  userCouponMapping: [
                                    ...doc.data().userCouponMapping,
                                    influencerArr[0].id,
                                  ],
                                });
                              }
                            });
                          }
                          setTimeout(() => {
                            sendMail("verifyemail", {
                              tomail: influencerArr[0].email,
                              ccmail: "",
                              subjectmail: "Verify your account | Pinksky",
                              text:
                                "Hey " +
                                influencerArr[0].name +
                                ", Use the link below to verify your email.",

                              href:
                                environments.VERIFY_EMAIL +
                                "?registeras=Influencer&id=" +
                                influencerArr[0].id,
                              hrefText: "Verify Email",
                            });
                            sendMail("registerdetailmail", {
                              tomail: environments.EML_USER,
                              ccmail: "",
                              subjectmail: "Influencer Details | Pinksky",
                              text:
                                "Name : " +
                                influencerArr[0].name +
                                ", " +
                                influencerArr[0].surname +
                                " <br/>" +
                                "Whatapp Number : " +
                                influencerArr[0].whatsappnumber +
                                " <br/>" +
                                "Instagram : " +
                                influencerArr[0].instagramurl +
                                " <br/>" +
                                "Email : " +
                                influencerArr[0].email +
                                " <br/>",
                              href: environments.EML_HREF_WEBSITE,
                            });
                            logging.end();
                            res.status(200).json({
                              message: {
                                displayName: createUser.name,
                                id: influencerArr[0].id,
                                // email: createUser.email,
                                email: influencerArr[0].email,
                                type: "Posted Influencer",
                                uuid: userResponse?.uid,
                                member: false,
                                status: "new",
                              },
                            });
                          }, 1000);
                        }, 2000);
                      }
                    })
                    .catch((error) => {
                      throw error;
                    });
                }
              }).pipe(fs.createWriteStream(filePath));
            }, index * interval);
          });
        }
      } else {
        logging.write(
          new Date() + " - influencer/create ❌ - " + error + " \n"
        );
        console.log(new Date() + " - influencer/create ❌ - " + error + " \n");

        logging.end();
        res.status(500).json({
          message:
            "Something Went wrong. User response is not defined. Please try again.",
        });
      }
    }
  } catch (error) {
    if (userResponse?.uid === "") {
      logging.write(new Date() + " - influencer/create ❌ - " + error + " \n");
      console.log(new Date() + " - influencer/create ❌ - " + error + " \n");

      logging.end();
      res.status(402).json({
        message:
          createUser.email +
          " is already an pinksky user. Try sigging up with another user id.",
      });
    } else {
      //console.log(userResponse?.uid);
      if (influencerData.isNonInfluencer.uuid.length > 2) {
        //non influencer is safe
      } else {
        await Firebase.admin.auth().deleteUser(userResponse?.uid);
      }
      //console.log("error", error.message);
      logging.write(new Date() + " - influencer/create ❌ - " + error + " \n");
      console.log(new Date() + " - influencer/create ❌ - " + error + " \n");

      logging.end();
      res.status(500).json({ message: error.message });
    }
  }
});

// 2. Brand registeration
app.post("/api/brand/create", async (req, res) => {
  logging.write(new Date() + " - brand/create POST 🚀 \n");
  console.log(new Date() + " - brand/create POST 🚀 \n");

  let brandData = req.body;
  let isProfileCompletedQuery = req.query.isProfileCompleted;
  //console.log("brandData", req.body);
  const createUser = {
    email: brandData.email,
    password: brandData.password,
    name:
      isProfileCompletedQuery +
      "_Brand_" +
      brandData.companyname.replace(/\s/g, ""),
  };
  let userResponse = { uid: "" };
  try {
    //console.log("createUser", createUser);

    if (createUser.email != undefined && createUser.password != undefined) {
      userResponse = await Firebase.admin.auth().createUser({
        email: createUser.email,
        password: createUser.password,
        emailVerified: false,
        disabled: false,
        displayName: createUser.name,
      });

      //console.log("userResponse email", userResponse.email);
      if (userResponse.email != undefined && userResponse.uid != undefined) {
        let brandSchema = null;
        const options = {
          method: "GET",
          url: environments.RAPID_USERINFO_URL + brandData.instagramurl,
          headers: {
            "X-RapidAPI-Key": environments.RapidAPIKey,
            "X-RapidAPI-Host": environments.RapidAPIHost,
          },
        };
        let instagramPostDetails = [];
        let onGoingStatus = 200;
        //console.log("options ", options);
        await axios
          .request(options)
          .then(function (response) {
            if (response.data.data.is_private === false) {
              let profileItemData = {
                id: "1",
                display_url: response.data.data.profile_pic_url_hd,
              };

              instagramPostDetails.push(profileItemData);

              brandSchema = {
                ...brandData,
                instagram: {
                  id: response.data.data.id,
                  is_business_account: response.data.data.is_business_account,
                  external_url: response.data.data.external_url,
                  followers: response.data.data.edge_followed_by.count,
                  edge_follow: response.data.data.edge_follow.count,
                  is_private: response.data.data.is_private,
                  is_verified: response.data.data.is_verified,
                },
              };
              onGoingStatus = 200;
            } else {
              onGoingStatus = 401;
            }
          })
          .catch(function (error) {
            throw error;
          });
        if (onGoingStatus === 401) {
          const err = new TypeError(
            "Please Register With Public Instagram Account"
          );
          throw err;
        } else {
          let interval = 9000;
          let lengthOfArray = instagramPostDetails.length - 1;
          let brandArr = [];

          //console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            setTimeout(() => {
              //console.log("hi people", interval * index);

              const d = new Date();
              let month = d.getMonth() + 1;
              let date = d.getDate();
              let year = d.getFullYear();
              let time = d.getTime();
              const fileName =
                createUser.name +
                "_" +
                month +
                "_" +
                date +
                "_" +
                year +
                "_" +
                time +
                "_" +
                index +
                ".jpeg";
              let filePath = path.join(__dirname, "/images", fileName);
              //console.log("filePath", filePath);
              //let filePath = "./images/" + fileName;
              const options = {
                url: file.display_url,
                method: "GET",
              };
              //console.log("fileName", fileName);
              let getDownloadURL = "";
              request(options, async (err, resp, body) => {
                if (resp.statusCode === 200) {
                  //console.log("res.statusCode", resp.statusCode);
                  var bucket = Firebase.admin.storage().bucket();

                  await bucket.upload(filePath);
                  let fileFirebaseURL = environments.FIRESTORE_URL + fileName;
                  //console.log("------Here------");
                  //console.log(fileFirebaseURL);

                  axios
                    .get(fileFirebaseURL)
                    .then((response) => {
                      getDownloadURL =
                        environments.FIRESTORE_URL +
                        `${fileName}?alt=media&token=${response.data.downloadTokens}`;
                      instagramPostDetails[index].new_url = getDownloadURL;
                      //console.log("index", index);
                      fs.unlinkSync(filePath);
                      if (index === lengthOfArray) {
                        //console.log("inside");

                        brandSchema = {
                          ...brandSchema,
                          isProfileCompleted: isProfileCompletedQuery,
                          imgURL: instagramPostDetails[0].new_url,
                          message: [
                            {
                              statusID: "100",
                              influencerID: "",
                              influencerName: "",
                            },
                          ],

                          createdDate: new Date(),
                          updatedDate: new Date(),
                        };
                      }

                      Firebase.Brand.add(brandSchema);
                      setTimeout(async () => {
                        //console.log("inside2");

                        const snapshot = await Firebase.Brand.get();
                        setTimeout(() => {
                          snapshot.docs.map((doc) => {
                            if (doc.data().email === createUser.email) {
                              brandArr.push({ id: doc.id, ...doc.data() });
                            }
                          });

                          sendMail("verifyemail", {
                            tomail: brandArr[0].email,
                            ccmail: "",
                            subjectmail: "Verify your account | Pinksky",
                            text:
                              "Hey " +
                              brandArr[0].companyname +
                              ", Use the link below to verify your email.",

                            href:
                              environments.VERIFY_EMAIL +
                              "?registeras=Brand&id=" +
                              brandArr[0].id,
                            hrefText: "Verify Email",
                          });
                          sendMail("registerdetailmail", {
                            tomail: environments.EML_USER,
                            ccmail: "",
                            subjectmail: "Brand Details | Pinksky",
                            text:
                              "Brand Name : " +
                              brandArr[0].companyname +
                              " <br/>" +
                              "City : " +
                              brandArr[0].city +
                              " <br/>" +
                              "Whatapp Number : " +
                              brandArr[0].whatsappnumber +
                              " <br/>" +
                              "Instagram : " +
                              brandArr[0].instagramurl +
                              " <br/>" +
                              "Email : " +
                              brandArr[0].email +
                              " <br/>",
                            href: environments.EML_HREF_WEBSITE,
                            hrefText: "pinkskyclub.com",
                          });
                          logging.end();
                          res.status(200).json({
                            message: {
                              displayName: createUser.name,
                              id: brandArr[0].id,
                              // email: createUser.email,
                              email: brandArr[0].email,
                              type: "Posted Brand",
                              uuid: userResponse?.uid,
                              member: false,
                              status: "new",
                            },
                          });
                        }, 1000);
                      }, 2000);
                    })
                    .catch((error) => {
                      throw error;
                    });
                }
              }).pipe(fs.createWriteStream(filePath));
            }, index * interval);
          });
        }
      }
    }
  } catch (error) {
    logging.write(new Date() + " - brand/create ❌ - " + error + " \n");
    console.log(new Date() + " - brand/create ❌ - " + error + " \n");

    logging.end();
    // if (error instanceof ReferenceError) {

    //   // Output expected ReferenceErrors.

    //   //console.log("braaaannndd error",error);
    // }else{
    //console.log(userResponse);
    if (userResponse?.uid === "") {
      //console.log(createUser.email);

      res.status(402).json({
        message:
          createUser.email +
          " is already an pinksky user. Try sigging up with another user id.",
      });
    } else {
      await Firebase.admin.auth().deleteUser(userResponse?.uid);

      //console.log("error", error.message);

      res.status(500).json({ message: error.message });
    }
    //}
    // //console.log("error", error);
    //

    // res.status(500).json({ message: error.message });
  }
});

// 3. Non-influencer registeration
app.post("/api/noninfluencer/create", async (req, res) => {
  logging.write(new Date() + " - noninfluencer/create POST 🚀 \n");
  console.log(new Date() + " - noninfluencer/create POST 🚀 \n");

  try {
    let data = req.body;

    const createUser = {
      email: data.email,
      password: data.password,
      name: "Non_Influencer_" + data.name.replace(/\s/g, ""),
    };

    const userResponse = await Firebase.admin.auth().createUser({
      email: createUser.email,
      password: createUser.password,
      emailVerified: false,
      disabled: false,
      displayName: createUser.name,
    });
    if (userResponse.email != undefined && userResponse.uid != undefined) {
      let noninfluencerData = {
        ...data,
        createdDate: new Date(),
        updatedDate: new Date(),
      };
      const response = await Firebase.NonInfluencer.add(noninfluencerData);

      setTimeout(async () => {
        let noninfluencerArr = [];
        const snapshot = await Firebase.NonInfluencer.get();
        snapshot.docs.map((doc) => {
          if (doc.data().email === createUser.email) {
            noninfluencerArr.push({ id: doc.id, ...doc.data() });
          }
        });
        setTimeout(() => {
          sendMail("verifyemail", {
            tomail: noninfluencerArr[0].email,
            ccmail: "",
            subjectmail: "Verify your account | Pinksky",
            text:
              "Hey " +
              noninfluencerArr[0].name +
              ", Use the link below to verify your email.",

            href:
              environments.VERIFY_EMAIL +
              "?registeras=Noninfluencer&id=" +
              noninfluencerArr[0].id,
            hrefText: "Verify Email",
          });
          sendMail("registerdetailmail", {
            tomail: environments.EML_USER,
            ccmail: "",
            subjectmail: "Non-Influencer Details | Pinksky",
            text:
              "Name : " +
              noninfluencerArr[0].name +
              ", " +
              noninfluencerArr[0].surname +
              " <br/>" +
              "Whatapp Number : " +
              noninfluencerArr[0].whatsappnumber +
              " <br/>" +
              "Instagram : " +
              noninfluencerArr[0].instagramid +
              " <br/>" +
              "Email : " +
              noninfluencerArr[0].email +
              " <br/>",
            href: environments.EML_HREF_WEBSITE,
            hrefText: "pinkskyclub.com",
          });
          logging.end();
          res.status(200).json({
            message: {
              displayName: createUser.name,
              id: noninfluencerArr[0].id,
              email: noninfluencerArr[0].email,
              type: "Posted Non Influencer",
              uuid: userResponse?.uid,
              member: false,
              status: "",
            },
          });
        }, 1500);
      }, 1500);
    }
  } catch (error) {
    //console.log("error", error);
    logging.write(new Date() + " - noninfluencer/create ❌ - " + error + " \n");
    console.log(new Date() + " - noninfluencer/create ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// ADMIN SECTION
// 1. Campaign create
app.post(
  "/api/campaign/create",
  Firebase.multer.single("file"),
  async (req, res) => {
    logging.write(new Date() + " - campaign/create FILE POST 🚀 \n");
    console.log(new Date() + " - campaign/create FILE POST 🚀 \n");

    try {
      let { file, body } = req;
      let campaignFile = file;
      let campaignFileSplit = campaignFile.fileRef.metadata.id.split("/");
      let campaignFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}`;
      //console.log("campaignFileSplit", campaignFileSplit);
      //console.log("campaignFileFirebaseURL", campaignFileFirebaseURL);
      let getDownloadURL = "";
      await axios
        .get(campaignFileFirebaseURL)
        .then((response) => {
          getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
        })
        .catch((error) => {
          logging.write(
            new Date() + " - campaign/create FILE ❌ - " + error + " \n"
          );
          console.log(
            new Date() + " - campaign/create FILE ❌ - " + error + " \n"
          );

          logging.end();
          res.status(500).json({ message: error });
        });
      var object = JSON.parse(body.data);
      let campaignData = {
        ...object,
        getDownloadURL: getDownloadURL,
        createdDate: new Date(),
        updatedDate: new Date(),
      };

      setTimeout(async () => {
        const response = await Firebase.Campaign.add(campaignData);
        //console.log("response", response.data);

        logging.end();
        res.status(200).json({ message: "Posted Campaign" });
      }, 2000);
    } catch (error) {
      //console.log("error", error);
      logging.write(
        new Date() + " - campaign/create FILE ❌ - " + error + " \n"
      );
      console.log(new Date() + " - campaign/create FILE ❌ - " + error + " \n");

      logging.end();
      res.status(500).json({ message: error });
    }
  }
);

// 2. Event create
app.post(
  "/api/event/create",
  Firebase.multer.single("file"),
  async (req, res) => {
    logging.write(new Date() + " - event/create FILE POST 🚀 \n");
    console.log(new Date() + " - event/create FILE POST 🚀 \n");

    try {
      let { file, body } = req;
      let couponFile = file;
      let couponFileSplit = couponFile.fileRef.metadata.id.split("/");
      let couponFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/${couponFileSplit[1]}`;
      //console.log("couponFileSplit", couponFileSplit);
      //console.log("couponFileFirebaseURL", couponFileFirebaseURL);
      let getDownloadURL = "";
      await axios
        .get(couponFileFirebaseURL)
        .then((response) => {
          getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/${couponFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
        })
        .catch((error) => {
          logging.write(
            new Date() + " - event/create FILE ❌ - " + error + " \n"
          );
          console.log(
            new Date() + " - event/create FILE ❌ - " + error + " \n"
          );

          logging.end();
          res.status(500).json({ message: error });
        });
      var object = JSON.parse(body.data);
      let eventData = {
        ...object,
        getDownloadURL: getDownloadURL,
        createdDate: new Date(),
        updatedDate: new Date(),
      };

      setTimeout(async () => {
        const response = await Firebase.Event.add(eventData);

        logging.end();
        res.status(200).json({ message: "Posted Event" });
      }, 2000);
    } catch (error) {
      //console.log("error");
      logging.write(new Date() + " - event/create FILE ❌ - " + error + " \n");
      console.log(new Date() + " - event/create FILE ❌ - " + error + " \n");

      logging.end();
      res.status(500).json({ message: error });
    }
  }
);

// 3. Coupon create
app.post(
  "/api/coupon/create",
  Firebase.multer.single("file"),
  async (req, res) => {
    logging.write(new Date() + " - coupon/create FILE POST 🚀 \n");
    console.log(new Date() + " - coupon/create FILE POST 🚀 \n");

    try {
      let { file, body } = req;
      let couponFile = file;
      let couponFileSplit = couponFile.fileRef.metadata.id.split("/");
      let couponFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/${couponFileSplit[1]}`;
      //console.log("couponFileSplit", couponFileSplit);
      //console.log("couponFileFirebaseURL", couponFileFirebaseURL);
      let getDownloadURL = "";
      await axios
        .get(couponFileFirebaseURL)
        .then((response) => {
          getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/${couponFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
        })
        .catch((error) => {
          logging.write(
            new Date() + " - coupon/create FILE ❌ - " + error + " \n"
          );
          console.log(
            new Date() + " - coupon/create FILE ❌ - " + error + " \n"
          );

          logging.end();
          res.status(500).json({ message: error });
        });
      var object = JSON.parse(body.data);
      let couponData = {
        ...object,
        url: getDownloadURL,
        createdDate: new Date(),
        updatedDate: new Date(),
      };

      setTimeout(async () => {
        const response = await Firebase.Coupons.add(couponData);
        //console.log("response", response.data);

        logging.end();
        res.status(200).json({ message: "Posted coupon" });
      }, 2000);
    } catch (error) {
      //console.log("error", error);
      logging.write(new Date() + " - coupon/create FILE ❌ - " + error + " \n");
      console.log(new Date() + " - coupon/create FILE ❌ - " + error + " \n");

      logging.end();
      res.status(500).json({ message: error });
    }
  }
);

// 4. Gallery create
app.post(
  "/api/gallery/create",
  Firebase.gallerymulter.single("file"),
  async (req, res) => {
    logging.write(new Date() + " - gallery/create FILE POST 🚀 \n");
    console.log(new Date() + " - gallery/create FILE POST 🚀 \n");

    try {
      let { file, body } = req;
      let couponFile = file;
      let couponFileSplit = couponFile.fileRef.metadata.id.split("/");
      let couponFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/gallery%2F${couponFileSplit[2]}`;
      //console.log("couponFileSplit", couponFileSplit);
      //console.log("couponFileFirebaseURL", couponFileFirebaseURL);
      let getDownloadURL = "";
      await axios
        .get(couponFileFirebaseURL)
        .then((response) => {
          getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/gallery%2F${couponFileSplit[2]}?alt=media&token=${response.data.downloadTokens}`;
        })
        .catch((error) => {
          logging.write(
            new Date() + " - gallery/create FILE ❌ - " + error + " \n"
          );
          console.log(
            new Date() + " - gallery/create FILE ❌ - " + error + " \n"
          );

          logging.end();
          res.status(500).json({ message: error });
        });
      var object = JSON.parse(body.data);

      let couponData = {
        ...object,

        url: getDownloadURL,
        createdDate: new Date(),
        updatedDate: new Date(),
      };

      setTimeout(async () => {
        const response = await Firebase.Gallery.add(couponData);
        //console.log("response gallery create", response);

        logging.end();
        res.status(200).json({ message: "Posted Gallery" });
      }, 2000);
    } catch (error) {
      //console.log("error", error);
      logging.write(
        new Date() + " - gallery/create FILE ❌ - " + error + " \n"
      );
      console.log(new Date() + " - gallery/create FILE ❌ - " + error + " \n");

      logging.end();
      res.status(500).json({ message: error });
    }
  }
);

// 5. Get gallery links
app.post(
  "/api/firestorelink/create",
  Firebase.gallerymulter.single("file"),
  async (req, res) => {
    logging.write(new Date() + " - firestorelink/create FILE POST 🚀 \n");

    try {
      let { file } = req;
      let newFile = file;
      //console.log(newFile);
      let newFileSplit = newFile.fileRef.metadata.id.split("/");
      let newFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${newFileSplit[0]}/o/gallery%2F${newFileSplit[2]}`;
      //console.log("newFileSplit", newFileSplit);
      //console.log("newFileFirebaseURL", newFileFirebaseURL);
      let getDownloadURL = "";
      await axios
        .get(newFileFirebaseURL)
        .then((response) => {
          getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${newFileSplit[0]}/o/gallery%2F${newFileSplit[2]}?alt=media&token=${response.data.downloadTokens}`;
          //console.log("getDownloadURL", getDownloadURL);
        })
        .catch((error) => {
          logging.write(
            new Date() + " - firestorelink/create FILE ❌ - " + error + " \n"
          );
          console.log(
            new Date() + " - firestorelink/create FILE ❌ - " + error + " \n"
          );

          logging.end();
          res.status(500).json({ message: error });
        });

      setTimeout(() => {
        //console.log("up");
        res
          .status(200)
          .json({ data: getDownloadURL, message: "Posted coupon" });
      }, 1500);
    } catch (error) {
      //console.log("down");
      //console.log("error", error);
      logging.write(
        new Date() + " - firestorelink/create FILE ❌ - " + error + " \n"
      );
      console.log(
        new Date() + " - firestorelink/create FILE ❌ - " + error + " \n"
      );

      logging.end();
      res.status(500).json({ message: error });
    }
  }
);

// 6. Accept Handle
app.put("/api/acceptstatus/update", async (req, res) => {
  logging.write(new Date() + " - acceptstatus/update PUT 🚀 \n");
  console.log(new Date() + " - acceptstatus/update PUT 🚀 \n");

  try {
    //console.log("hello");
    const data = req.body;
    //console.log("Here");

    //checked
    if (data.type === "influencerNewRequest") {
      const id = data.id;
      //console.log(id);
      const snapshot = await Firebase.Influencer.doc(id).get();
      let influencerData = [
        ...snapshot.data().message,
        {
          statusID: "101",
          campaignID: "",
          campaignName: "",
        },
      ];

      await Firebase.Influencer.doc(id).update({
        status: "accepted",
        message: influencerData,
      });
      sendMail("influencernewrequestaccepted", {
        tomail: snapshot.data().email,
        ccmail: "",
        subjectmail: "Profile Approved | Pinksky",
        text: `Hi ${snapshot.data().name},<br/><br/>

        You have been approved to access : <br/>
          ⁃	Exclusive #itsapinkskyevent Invites <br/>
          ⁃	Pinksky Privilege<br/>
          ⁃	Paid Campaigns <br/><br/>
        
        Thanks for choosing Pinksky💕`,
        href: environments.EML_HREF_WEBSITE,
        hrefText: "pinkskyclub.com",
      });
      // text: "Hi " + snapshot.data().name + ", your profile has been approved",

      logging.end();
      res.status(200).json({ message: "Accepted Influencer" });
    }
    //checked
    else if (data.type === "influencerCampaignRequest") {
      const data = req.body;
      const snapshotcampaign = await Firebase.Campaign.doc(
        data.campaignid
      ).get();

      await Firebase.Campaign.doc(data.campaignid).update({
        userCampaignMapping: [
          ...snapshotcampaign.data().userCampaignMapping,
          {
            influencerid: data.influencerid,
            closingPrice: data.closingPrice,
          },
        ],
      });
      const snapshot = await Firebase.Influencer.get();

      let influencerData = [];
      let influencerDataMessage = [];
      let useremail = "";
      let username = "";

      snapshot.docs.map((doc) => {
        if (doc.id === data.influencerid) {
          useremail = doc.data().email;
          username = doc.data().name;
          influencerData.push(...doc.data().campaignmapping);
          influencerDataMessage.push(...doc.data().message);
        }
      });

      let objIndex = influencerData.findIndex(
        (obj) => obj.campaignId === data.campaignid
      );

      influencerData[objIndex].status = "accepted";
      influencerData[objIndex].closingPrice = data.closingPrice;
      //console.log("influencerData ", influencerData);
      const campaignsnapshot = await Firebase.Campaign.doc(
        data.campaignid
      ).get();

      influencerDataMessage.push({
        statusID: "201",
        campaignID: data.campaignid,
        campaignName: campaignsnapshot.data().name,
        closingPrice: data.closingPrice,
      });

      await Firebase.Influencer.doc(data.influencerid).update({
        campaignmapping: influencerData,
        message: influencerDataMessage,
      });
      sendMail("influencercampaignaccepted", {
        tomail: useremail,
        ccmail: "",
        subjectmail: "Approved request for campaign | Pinksky",
        text: `Hi ${username},<br/><br/>
        You’ve been approved to access the campaign ${
          campaignsnapshot.data().name
        } by the brand. Go ahead and complete the deliverables in the given time. 
        <br/><br/>
        Thanks for choosing Pinksky💕`,
        href: environments.EML_HREF_WEBSITE,
        hrefText: "pinkskyclub.com",
      });
      // text:
      // "Hi " +
      // username +
      // ", your profile has been approved for campaign " +
      // campaignsnapshot.data().name,
      logging.end();
      res.status(200).json({ message: "Mapped Campaign with Influencer" });
    } else if (data.type === "influencerCampaignPaymentRequest") {
      //console.log("inside influencerCampaignPaymentRequest");
      const data = req.body;

      const snapshot = await Firebase.Influencer.doc(data.influencerid).get();

      let influencerData = [...snapshot.data().campaignmapping];
      let influencerDataMessage = [...snapshot.data().message];

      //console.log("inside influencerCampaignPaymentRequest 2");
      let objIndex = snapshot
        .data()
        .campaignmapping.findIndex((obj) => obj.campaignId === data.campaignid);

      influencerData[objIndex].paymentStatus = "accepted";

      //console.log("inside influencerCampaignPaymentRequest 3");
      const campaignsnapshot = await Firebase.Campaign.doc(
        data.campaignid
      ).get();
      //console.log("inside influencerCampaignPaymentRequest 4");
      var dateObj = new Date();
      var month = dateObj.getUTCMonth() + 1; //months from 1-12
      var year = dateObj.getUTCFullYear();

      influencerDataMessage.push({
        statusID: "401",
        campaignID: data.campaignid,
        campaignName: campaignsnapshot.data().name,
        closingPrice: influencerData[objIndex].closingPrice,
        settlementMonth: year + "/" + month,
        viewerDetails: campaignsnapshot.data().viewerDetails,
      });
      //console.log("inside influencerCampaignPaymentRequest 5", influencerData);
      await Firebase.Influencer.doc(data.influencerid).update({
        campaignmapping: influencerData,
        message: influencerDataMessage,
      });
      res
        .status(200)
        .json({ message: "Mapped Payment Campaign with Influencer" });
    } else if (data.type === "brandNewRequest") {
      const id = req.body.id;
      const snapshot = await Firebase.Brand.get();
      let brandData = [];
      let useremail = "";
      let username = "";
      snapshot.docs.map((doc) => {
        if (doc.id === id) {
          useremail = doc.data().email;
          username = doc.data().companyname;
          brandData.push(...doc.data().message);
        }
      });
      brandData.push({
        statusID: "101",
        influencerID: "",
        influencerName: "",
      });

      await Firebase.Brand.doc(id).update({
        status: "accepted",
        message: brandData,
      });
      sendMail("brandnewrequestaccepted", {
        tomail: useremail,
        ccmail: "",
        subjectmail: "Profile Approved | Pinksky",
        text: `Hi ${username},<br/><br/>

        You have been approved to access : <br/>
          ⁃	Hire the influencers directly<br/>
          ⁃	Choose your subscription <br/>
          ⁃	Host a bloggers meet/promotional event<br/>
          ⁃	Run an influencer campaign <br/><br/>
        
        Thanks for choosing Pinksky💕`,
        href: environments.EML_HREF_WEBSITE,
        hrefText: "pinkskyclub.com",
      });
      // text: "Hi " + username + ", your profile has been approved",

      logging.end();
      res.status(200).json({ message: "Accepted Brand" });
    } else if (data.type === "influencerHireRequest") {
      const data = req.body;
      //console.log(data);
      const snapshot = await Firebase.Brand.doc(data.brandid).get();
      let brandData = [...snapshot.data().influencermapping];
      let brandDataMessage = [...snapshot.data().message];
      //console.log("step1");
      let objIndex = brandData.findIndex(
        (obj) => obj.influencerId === data.influencerid
      );
      brandData[objIndex].status = "accepted";
      const influencersnapshot = await Firebase.Influencer.doc(
        data.influencerid
      ).get();
      //console.log("step2", influencersnapshot.data().name);
      brandDataMessage.push({
        statusID: "201",
        influencerID: data.influencerid,
        influencerName: influencersnapshot.data().name,
      });
      //console.log("step3");
      await Firebase.Brand.doc(data.brandid).update({
        influencermapping: brandData,
        message: brandDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "Mapped Influencer with Brand" });
    }

    //working
    else if (data.type === "influencerEventRequest") {
      const data = req.body;
      const snapshotevent = await Firebase.Event.doc(data.eventid).get();

      await Firebase.Event.doc(data.eventid).update({
        userEventMapping: [
          ...snapshotevent.data().userEventMapping,
          {
            influencerid: data.influencerid,
          },
        ],
      });
      const snapshot = await Firebase.Influencer.doc(data.influencerid).get();
      let influencerData = [];
      let influencerDataMessage = [];
      influencerData.push(...snapshot.data().eventmapping);
      influencerDataMessage.push(...snapshot.data().message);

      //console.log("influencerData before", influencerData);
      let objIndex = influencerData.findIndex(
        (obj) => obj.eventId === data.eventid
      );
      influencerData[objIndex].status = "accepted";
      const eventsnapshot = await Firebase.Event.doc(data.eventid).get();

      influencerDataMessage.push({
        statusID: "301",
        eventId: data.eventid,
        eventName: eventsnapshot.data().name,
      });
      //console.log("data", {
      //   eventmapping: influencerData,
      //   message: influencerDataMessage,
      // });
      await Firebase.Influencer.doc(data.influencerid).update({
        eventmapping: influencerData,
        message: influencerDataMessage,
      });
      sendMail("influencereventaccepted", {
        tomail: snapshot.data().email,
        ccmail: "",
        subjectmail: "Approved request for event | Pinksky",
        text: `Hi ${snapshot.data().name},<br/><br/>
        We’re so excited to invite you to event ${
          eventsnapshot.data().name
        }. Make sure you follow the attire and reach on time so as to not miss any fun! 
        <br/><br/>
        Thanks for choosing Pinksky💕`,

        href: environments.EML_HREF_WEBSITE,
        hrefText: "pinkskyclub.com",
      });
      // "Hi " +
      // snapshot.data().name +
      // ", your profile has been approved for event " +
      // eventsnapshot.data().name,
      logging.end();
      res.status(200).json({ message: "Accept Event with Influencer" });
    } else if (data.type === "influencerPinkskyTeamNewRequest") {
      let snapshot = await Firebase.Influencer.doc(data.influencerid).get();

      let influencerDataMessage = [
        ...snapshot.data().message,
        {
          statusID: "104",
          influencerId: data.influencerid,
          influencerName: snapshot.data().name,
        },
      ];
      await Firebase.Influencer.doc(data.influencerid).update({
        isTeam: "accepted",
        message: influencerDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "Updated Influencer Hiring" });
    } else if (data.type === "launchAcceptReject") {
      let snapshot = await Firebase.Brand.doc(data.details.brandid).get();

      let brandDataMessage = [...snapshot.data().message];

      let objIndex = brandDataMessage.findIndex(
        (obj) => obj.launchName === data.details.launchName
      );

      brandDataMessage[objIndex].isShowAdmin = false;
      //console.log(brandDataMessage);
      await Firebase.Brand.doc(data.details.brandid).update({
        message: brandDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "Updated Message in Launch" });
    }
  } catch (error) {
    logging.write(new Date() + " - acceptstatus/update ❌ - " + error + " \n");
    console.log(new Date() + " - acceptstatus/update ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 7. Accept Handle Form Data
app.post(
  "/api/acceptstatus/update/formdata",
  Firebase.multer.single("file"),
  async (req, res) => {
    logging.write(
      new Date() + " - acceptstatus/update/formdata FILE POST 🚀 \n"
    );
    console.log(new Date() + " - acceptstatus/update/formdata FILE POST 🚀 \n");

    try {
      //console.log("hello");
      const data = req.body;
      var object = JSON.parse(data.data);
      //console.log("Here");

      //checked
      if (object.type === "influencerCampaignPaymentRequest") {
        let campaignFile = req.file;
        let campaignFileSplit = campaignFile.fileRef.metadata.id.split("/");
        let campaignFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}`;

        let getDownloadURL = "";
        await axios
          .get(campaignFileFirebaseURL)
          .then((response) => {
            getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
          })
          .catch((error) => {
            logging.write(
              new Date() +
                " - acceptstatus/update/formdata FILE ❌ - " +
                error +
                " \n"
            );
            console.log(
              new Date() +
                " - acceptstatus/update/formdata FILE ❌ - " +
                error +
                " \n"
            );

            logging.end();
            res.status(500).json({ message: error });
          });

        setTimeout(async () => {
          //console.log("1");
          let snapshot = await Firebase.Influencer.doc(
            object.influencerid
          ).get();

          let campaignmapping = [];

          snapshot.data().campaignmapping.map((camp) => {
            if (camp.paymentStatus === "accepted") {
              campaignmapping.push({
                ...camp,
                paymentURL: getDownloadURL,
                paymentStatus: "completed",
              });
            } else {
              campaignmapping.push({ ...camp });
            }
          });
          //console.log("3");
          let influencerDataMessage = [];

          snapshot.data().message.map((item) => {
            if (item.statusID === "401") {
              influencerDataMessage.push({
                ...item,
                paymentURL: getDownloadURL,
              });
            } else {
              influencerDataMessage.push({ ...item });
            }
          }),
            await Firebase.Influencer.doc(object.influencerid).update({
              campaignmapping: campaignmapping,
              message: influencerDataMessage,
            });
          //console.log("5");

          logging.end();
          res.status(200).json({ message: "Updated Influencer with payment" });
        }, 1500);
      }
    } catch (error) {
      logging.write(
        new Date() +
          " - acceptstatus/update/formdata FILE ❌ - " +
          error +
          " \n"
      );
      console.log(
        new Date() +
          " - acceptstatus/update/formdata FILE ❌ - " +
          error +
          " \n"
      );
      logging.end();
      res.status(500).json({ message: error });
    }
  }
);

// 8. Reject Handle
app.put("/api/rejectstatus/update", async (req, res) => {
  logging.write(new Date() + " - rejectstatus/update PUT 🚀 \n");
  console.log(new Date() + " - rejectstatus/update PUT 🚀 \n");

  try {
    let data = req.body;
    //console.log(req.body);

    if (data.type === "influencerNewRequest") {
      const id = req.body.id;
      const snapshot = await Firebase.Influencer.get();
      let influencerData = [];
      snapshot.docs.map((doc) => {
        if (doc.id === id) {
          influencerData.push(...doc.data().message);
        }
      });
      influencerData.push({
        statusID: "102",
        campaignID: "",
        campaignName: "",
      });
      await Firebase.Influencer.doc(id).update({
        status: "rejected",
        message: influencerData,
      });

      logging.end();
      res.status(200).json({ message: "Rejected Influencer" });
    } else if (data.type === "influencerCampaignRequest") {
      const data = req.body;

      const snapshot = await Firebase.Influencer.get();
      let influencerData = [];
      let influencerDataMessage = [];
      snapshot.docs.map((doc) => {
        if (doc.id === data.influencerid) {
          influencerData.push(...doc.data().campaignmapping);
          influencerDataMessage.push(...doc.data().message);
        }
      });
      //console.log("influencerData before", influencerData);
      let objIndex = influencerData.findIndex(
        (obj) => obj.campaignId === data.campaignid
      );
      influencerData[objIndex].status = "rejected";
      const campaignsnapshot = await Firebase.Campaign.doc(
        data.campaignid
      ).get();

      influencerDataMessage.push({
        statusID: "202",
        campaignID: data.campaignid,
        campaignName: campaignsnapshot.data().name,
      });

      await Firebase.Influencer.doc(data.influencerid).update({
        campaignmapping: influencerData,
        message: influencerDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "UnMapped Campaign with Influencer" });
    }
    //working
    else if (data.type === "influencerCampaignPaymentRequest") {
      let snapshot = await Firebase.Influencer.doc(data.influencerid).get();

      const campaignsnapshot = await Firebase.Campaign.doc(
        data.campaignid
      ).get();

      let campaignmapping = [];

      snapshot.data().campaignmapping.map((camp) => {
        if (camp.campaignId === data.campaignid) {
          campaignmapping.push({
            ...camp,
            paymentStatus: "rejected",
          });
        } else {
          campaignmapping.push(...camp);
        }
      });

      let influencerDataMessage = [
        ...snapshot.data().message,
        {
          statusID: "402",
          campaignID: data.campaignid,
          campaignName: campaignsnapshot.data().name,
          reason: data.reason,
        },
      ];

      await Firebase.Influencer.doc(data.influencerid).update({
        campaignmapping: [...campaignmapping],
        message: influencerDataMessage,
      });
      res
        .status(200)
        .json({ message: "Updated Influencer with payment rejection" });
    } else if (data.type === "brandNewRequest") {
      const id = req.body.id;
      const snapshot = await Firebase.Brand.get();
      let brandData = [];
      snapshot.docs.map((doc) => {
        if (doc.id === id) {
          brandData.push(...doc.data().message);
        }
      });
      brandData.push({ statusID: "102", influencerID: "", influencerName: "" });
      await Firebase.Brand.doc(id).update({
        status: "rejected",
        message: brandData,
      });

      logging.end();
      res.status(200).json({ message: "Rejected Brand" });
    } else if (data.type === "influencerHireRequest") {
      const data = req.body;

      const snapshot = await Firebase.Brand.doc(data.brandid).get();
      let brandData = [...snapshot.data().influencermapping];
      let brandDataMessage = [...snapshot.data().message];
      //console.log("step1");
      let objIndex = brandData.findIndex(
        (obj) => obj.influencerId === data.influencerid
      );
      brandData[objIndex].status = "rejected";
      const influencersnapshot = await Firebase.Influencer.doc(
        data.influencerid
      ).get();
      //console.log("step2", influencersnapshot.data().name);
      brandDataMessage.push({
        statusID: "202",
        influencerID: data.influencerid,
        influencerName: influencersnapshot.data().name,
      });
      //console.log("step3");
      await Firebase.Brand.doc(data.brandid).update({
        influencermapping: brandData,
        message: brandDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "UnMapped Influencer with Brand" });
    } else if (data.type === "influencerEventRequest") {
      const data = req.body;
      const snapshot = await Firebase.Influencer.doc(data.influencerid).get();
      let influencerData = [];
      let influencerDataMessage = [];
      influencerData.push(...snapshot.data().eventmapping);
      influencerDataMessage.push(...snapshot.data().message);

      //console.log("influencerData before", influencerData);
      let objIndex = influencerData.findIndex(
        (obj) => obj.eventId === data.eventid
      );
      influencerData[objIndex].status = "rejected";
      const eventsnapshot = await Firebase.Event.doc(data.eventid).get();

      influencerDataMessage.push({
        statusID: "302",
        eventId: data.eventid,
        eventName: eventsnapshot.data().name,
      });
      //console.log("data", {
      //   eventmapping: influencerData,
      //   message: influencerDataMessage,
      // });
      await Firebase.Influencer.doc(data.influencerid).update({
        eventmapping: influencerData,
        message: influencerDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "Rejected Event with Influencer" });
    } else if (data.type === "influencerPinkskyTeamNewRequest") {
      let snapshot = await Firebase.Influencer.doc(data.influencerid).get();

      let influencerDataMessage = [
        ...snapshot.data().message,
        {
          statusID: "105",
          influencerId: data.influencerid,
          influencerName: snapshot.data().name,
        },
      ];
      await Firebase.Influencer.doc(data.influencerid).update({
        isTeam: "rejected",
        message: influencerDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "Updated Influencer Not Hiring" });
    }
  } catch (error) {
    logging.write(new Date() + " - rejectstatus/update ❌ - " + error + " \n");
    console.log(
      new Date() + " - rejectstatus/update FILE ❌ - " + error + " \n"
    );
    logging.end();
    res.status(500).json({ message: error });
  }
});

// 9. Remove Campaign - In-active
app.put("/api/removecampaign/update", async (req, res) => {
  logging.write(new Date() + " - removecampaign/update PUT 🚀 \n");
  console.log(new Date() + " - removecampaign/update PUT 🚀 \n");

  try {
    const id = req.body.id;
    delete req.body.id;
    const data = { isActive: 0 };

    await Firebase.Campaign.doc(id).update(data);

    logging.end();
    res.status(200).json({ message: "Updated Campaign" });
  } catch (error) {
    logging.write(
      new Date() + " - removecampaign/update ❌ - " + error + " \n"
    );
    console.log(
      new Date() + " - removecampaign/update FILE ❌ - " + error + " \n"
    );
    logging.end();
    res.status(500).json({ message: error });
  }
});

// 10. Remove Event - In-active
app.put("/api/removeevent/update", async (req, res) => {
  logging.write(new Date() + " - removeevent/update PUT 🚀 \n");
  console.log(new Date() + " - removeevent/update PUT 🚀 \n");

  try {
    const id = req.body.id;
    delete req.body.id;
    const data = { isActive: 0 };

    await Firebase.Event.doc(id).update(data);

    logging.end();
    res.status(200).json({ message: "Updated Event" });
  } catch (error) {
    logging.write(new Date() + " - removeevent/update ❌ - " + error + " \n");
    console.log(
      new Date() + " - removeevent/update FILE ❌ - " + error + " \n"
    );
    logging.end();
    res.status(500).json({ message: error });
  }
});

// 11. Remove Coupons - In-active
app.put("/api/removecoupon/update", async (req, res) => {
  logging.write(new Date() + " - removecoupon/update PUT 🚀 \n");
  console.log(new Date() + " - removecoupon/update PUT 🚀 \n");

  try {
    const id = req.body.id;
    delete req.body.id;
    const data = { isActive: 0 };

    await Firebase.Coupons.doc(id).update(data);

    logging.end();
    res.status(200).json({ message: "Updated Coupon" });
  } catch (error) {
    logging.write(new Date() + " - removecoupon/update ❌ - " + error + " \n");
    console.log(
      new Date() + " - removecoupon/update FILE ❌ - " + error + " \n"
    );
    logging.end();
    res.status(500).json({ message: error });
  }
});

// 12. Add more into gallery
app.put("/api/gallery/update", async (req, res) => {
  logging.write(new Date() + " - gallery/update PUT 🚀 \n");
  console.log(new Date() + " - gallery/update PUT 🚀 \n");

  try {
    const id = req.body.id;
    delete req.body.id;
    const data = req.body;

    let snapshot = await Firebase.Gallery.doc(id).get();
    //18
    //10
    if (snapshot.data().highlights.length + data.highlights.length <= 20) {
      let highlightData = [...snapshot.data().highlights, ...data.highlights];
      //console.log(highlightData);

      await Firebase.Gallery.doc(id).update({ highlights: highlightData });

      logging.end();
      res.status(200).json({ message: "Updated Coupon" });
    } else {
      const error = new TypeError("limitreached");
      throw error;
    }
  } catch (error) {
    logging.write(new Date() + " - gallery/update ❌ - " + error + " \n");
    console.log(new Date() + " - gallery/update ❌ - " + error + " \n");
    logging.end();
    res.status(500).json({ message: error });
  }
});

app.post("/api/brandname", async (req, res) => {
  logging.write(new Date() + " - brandname POST 🚀 \n");
  console.log(new Date() + " - brandname POST 🚀 \n");

  let data = req.body;
  //console.log(data);
  try {
    let snapshot = await Firebase.Brand.get();
    let companynames = [];
    snapshot.docs.map((item) => {
      if (
        item
          .data()
          .companyname.toLowerCase()
          .indexOf(data.value.toLowerCase()) !== -1 &&
        item.data().status === "accepted"
      ) {
        companynames.push({
          category: item.data().category[0].label,
          companyname: item.data().companyname,
          id: item.id,
        });
      }
    });
    //console.log(companynames);

    res.json({ message: companynames });
  } catch (error) {
    res.json({ message: error });
  }
});

// MODAL FETCHING DATA SECTION
// 1. Name + Number data create
app.post("/api/randomdata/create", async (req, res) => {
  logging.write(new Date() + " - randomdata/create POST 🚀 \n");
  console.log(new Date() + " - randomdata/create POST 🚀 \n");

  try {
    const data = req.body;
    //console.log(data);

    await Firebase.RandomData.add(data);

    logging.end();
    res.status(200).json({ message: "Posted RandomData" });
  } catch (error) {
    //console.log("error", error);
    logging.write(new Date() + " - randomdata/create ❌ - " + error + " \n");
    console.log(new Date() + " - randomdata/create ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 2. Feedback data create
app.post("/api/feedbackdata/create", async (req, res) => {
  logging.write(new Date() + " - feedbackdata/create POST 🚀 \n");
  console.log(new Date() + " - feedbackdata/create POST 🚀 \n");

  try {
    const data = req.body;
    //console.log(data);

    await Firebase.Feedback.add(data);

    logging.end();
    res.status(200).json({ message: "Posted Feedback" });
  } catch (error) {
    //console.log("error", error);
    logging.write(new Date() + " - feedbackdata/create ❌ - " + error + " \n");
    console.log(new Date() + " - feedbackdata/create ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Pinkskypopup data create
app.post("/api/pinkskypopupentry/create", async (req, res) => {
  logging.write(new Date() + " - pinkskypopupentry/create POST 🚀 \n");
  console.log(new Date() + " - pinkskypopupentry/create POST 🚀 \n");

  try {
    let data = req.body;

    let pinkskypopupentryData = {
      ...data,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    setTimeout(async () => {
      const response = await Firebase.PinkskyPopup.add(pinkskypopupentryData);

      logging.end();
      res.status(200).json({ message: "Posted PinkskyPopup" });
    }, 2000);
  } catch (error) {
    //console.log("error", error);
    logging.write(
      new Date() + " - pinkskypopupentry/create ❌ - " + error + " \n"
    );
    console.log(
      new Date() + " - pinkskypopupentry/create ❌ - " + error + " \n"
    );

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 4. Adding payment details influencers
app.post("/api/influencerpayment/create", async (req, res) => {
  logging.write(new Date() + " - influencerpayment/create POST 🚀 \n");
  console.log(new Date() + " - influencerpayment/create POST 🚀 \n");

  try {
    let data = req.body;

    const response = await Firebase.Influencer.doc(data.influencerid).get();
    let paymentdetails = {
      upi: data.upi,
    };

    await Firebase.Influencer.doc(data.influencerid).update({
      ...response.data(),
      paymentdetails,
    });

    logging.end();
    res.status(200).json({ message: "Posted Influencer Payment" });
  } catch (error) {
    //console.log("error", error);
    logging.write(
      new Date() + " - influencerpayment/create ❌ - " + error + " \n"
    );
    console.log(
      new Date() + " - influencerpayment/create ❌ - " + error + " \n"
    );

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 5. Updating influencers details
app.put("/api/influencer/update", async (req, res) => {
  logging.write(new Date() + " - influencer/update PUT 🚀 \n");
  console.log(new Date() + " - influencer/update PUT 🚀 \n");

  try {
    const data = req.body;
    const id = req.body.body.id;
    delete req.body.body.id;
    let updatedCookies = {};
    let displayName = data?.cookies.displayName;
    let updatedDisplayName = displayName;

    if (data.flagSignOut === 1 && displayName.slice(0, 1) === "0") {
      updatedDisplayName =
        displayName.slice(0, 1) === "0" &&
        "1" + displayName.slice(1, displayName.length);
      //console.log("updatedDisplayName", updatedDisplayName);
      await Firebase.admin.auth().updateUser(data?.cookies.uuid, {
        displayName: updatedDisplayName,
      });
    }
    if (data.flagSignOut === 0 && displayName.slice(0, 1) === "1") {
      updatedDisplayName =
        displayName.slice(0, 1) === "1" &&
        "0" + displayName.slice(1, displayName.length);
      await Firebase.admin.auth().updateUser(data?.cookies.uuid, {
        displayName: updatedDisplayName,
      });
    }
    updatedCookies = { ...data?.cookies, displayName: updatedDisplayName };
    //console.log("here?");
    await Firebase.Influencer.doc(id).update(data.body);
    res
      .status(200)
      .json({ message: "Updated Influencer", updatedCookies: updatedCookies });
  } catch (error) {
    logging.write(new Date() + " - influencer/update ❌ - " + error + " \n");
    console.log(new Date() + " - influencer/update ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 6. Updating Brand details
app.put("/api/brand/update", async (req, res) => {
  logging.write(new Date() + " - brand/update PUT 🚀 \n");
  console.log(new Date() + " - brand/update PUT 🚀 \n");

  try {
    const data = req.body;
    const id = req.body.body.id;
    delete req.body.body.id;
    let updatedCookies = {};
    let displayName = data?.cookies.displayName;
    let updatedDisplayName = displayName;

    if (data.flagSignOut === 1 && displayName.slice(0, 1) === "0") {
      updatedDisplayName =
        displayName.slice(0, 1) === "0" &&
        "1" + displayName.slice(1, displayName.length);
      //console.log("updatedDisplayName", updatedDisplayName);
      await Firebase.admin.auth().updateUser(data?.cookies.uuid, {
        displayName: updatedDisplayName,
      });
    }
    if (data.flagSignOut === 0 && displayName.slice(0, 1) === "1") {
      updatedDisplayName =
        displayName.slice(0, 1) === "1" &&
        "0" + displayName.slice(1, displayName.length);
      await Firebase.admin.auth().updateUser(data?.cookies.uuid, {
        displayName: updatedDisplayName,
      });
    }
    updatedCookies = { ...data?.cookies, displayName: updatedDisplayName };
    //console.log("here?");
    await Firebase.Brand.doc(id).update(data.body);
    res
      .status(200)
      .json({ message: "Updated Brand", updatedCookies: updatedCookies });
  } catch (error) {
    logging.write(new Date() + " - brand/update ❌ - " + error + " \n");
    console.log(new Date() + " - brand/update ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 7. Updating Brand's Comments details
app.put("/api/brandcomments/update", async (req, res) => {
  logging.write(new Date() + " - brandcomments/update PUT 🚀 \n");
  console.log(new Date() + " - brandcomments/update PUT 🚀 \n");

  const data = req.body;
  //console.log(data);
  const id = data.id;
  delete req.body.id;
  const snaps = await Firebase.Brand.doc(id).get();
  let arr = [];
  // //console.log(snaps.data());
  snaps.data().subscription.map((item) => {
    item.payload.subscription.entity.id === data.subid
      ? arr.push({
          ...item,
          payload: {
            ...item.payload,
            subscription: {
              entity: {
                ...item.payload.subscription.entity,
                notes: {
                  ...item.payload.subscription.entity.notes,
                  comments: data.comments,
                },
              },
            },
          },
        })
      : arr.push({ ...item });
  });
  // //console.log(arr);
  setTimeout(async () => {
    await Firebase.Brand.doc(id).update({ subscription: arr });

    logging.end();
    res.status(200).json({ message: "Updated Comments in Brand" });
  }, 2000);
});

// 8. Verifying account
app.put("/api/verifyaccount/update", async (req, res) => {
  logging.write(new Date() + " - verifyaccount/update PUT 🚀 \n");
  console.log(new Date() + " - verifyaccount/update PUT 🚀 \n");

  try {
    let data = req.body;
    // console.log("verify data " , data);
    if (data.registeras.toString().toLowerCase() === "influencer") {
      const id = data.id;
      const snapshot = await Firebase.Influencer.doc(id).get();
      setTimeout(async () => {
        await Firebase.Influencer.doc(id).update({
          ...snapshot.data(),
          isActive: 1,
        });
        if (snapshot.data().isActive === 0) {
          sendMail("registerlaunchingsoon", {
            tomail: snapshot.data().email,
            ccmail: "",
            subjectmail: "Registration Completed | Pinksky",
            text: `Dear ${snapshot.data().name},<br/><br/>
           Registration completed !<br/><br/>
           Welcome to Pinksky’s secret club of influencers. We are excited to invite you to our upcoming events & be a part of the campaigns hope you are too!
           <br/><br/>
           Thanks for choosing Pinksky 💕 `,
            href: environments.EML_HREF_WEBSITE,
            hrefText: "pinkskyclub.com",
          });
        }

        logging.end();
        res.status(200).json({ message: "Verified Influencer" });
      }, 8000);
    }
    if (data.registeras.toString().toLowerCase() === "brand") {
      const id = data.id;
      const snapshot = await Firebase.Brand.doc(id).get();
      setTimeout(async () => {
        await Firebase.Brand.doc(id).update({
          ...snapshot.data(),
          isActive: 1,
        });
        if (snapshot.data().isActive === 0) {
          sendMail("registerlaunchingsoon", {
            tomail: snapshot.data().email,
            ccmail: "",
            subjectmail: "Registration Completed | Pinksky",
            text: `Dear ${snapshot.data().companyname},<br/><br/>
      You have successfully created an account at Pinksky! <br/><br/>
      Pinksky welcomes your brand to a creative marketing agency. We are excited to work & grow with you. 
      <br/><br/>
      Thanks for choosing Pinksky 💕 `,
            href: environments.EML_HREF_WEBSITE,
            hrefText: "pinkskyclub.com",
          });
        }

        logging.end();
        res.status(200).json({ message: "Verified Brand" });
      }, 1200);
    }
    if (data.registeras.toString().toLowerCase() === "noninfluencer") {
      const id = data.id;
      const snapshot = await Firebase.NonInfluencer.doc(id).get();
      setTimeout(async () => {
        await Firebase.NonInfluencer.doc(id).update({
          ...snapshot.data(),
          isActive: 1,
        });
        if (snapshot.data().isActive === 0) {
          sendMail("registerlaunchingsoon", {
            tomail: snapshot.data().email,
            ccmail: "",
            subjectmail: "Registration Completed | Pinksky",
            text: `Dear ${snapshot.data().name},<br/><br/>
     Registration completed !
     <br/><br/>
     Thanks for choosing Pinksky 💕`,
            href: environments.EML_HREF_WEBSITE,
            hrefText: "pinkskyclub.com",
          });
        }

        logging.end();
        res.status(200).json({ message: "Verified NonInfluencer" });
      }, 1200);
    }
  } catch (error) {
    logging.write(new Date() + " - verifyaccount/update ❌ - " + error + " \n");
    console.log(new Date() + " - verifyaccount/update ❌ - " + error + " \n");

    logging.end();
    res.status(500).json({ message: error });
  }
});

// MAPPING SECTION
// 1. Mapping brand with influencer - Hire me
app.put("/api/mappingbrandwithinfluencer/update", async (req, res) => {
  logging.write(new Date() + " - mappingbrandwithinfluencer/update PUT 🚀 \n");
  console.log(new Date() + " - mappingbrandwithinfluencer/update PUT 🚀 \n");

  try {
    const data = req.body;
    //console.log(data);

    const snapshot = await Firebase.Brand.get();
    let brandData = [];
    let brandDataMessage = [];
    let checkStatus = "";
    snapshot.docs.map((doc) => {
      if (doc.id === data.brandId) {
        if (doc.data().influencermapping.length > 0) {
          brandData.push(...doc.data().influencermapping);
        }

        brandDataMessage.push(...doc.data().message);
        checkStatus = doc.data().status;
      }
    });
    //console.log("checkStatus", checkStatus);
    if (checkStatus === "new") {
      res.status(400).json({
        message: "Your status is pending for making changes on Pinksky.",
      });
    } else {
      brandData.push({ influencerId: data.influencerId, status: "new" });
      const influencersnapshot = await Firebase.Influencer.doc(
        data.influencerId
      ).get();
      brandDataMessage.push({
        statusID: "200",
        influencerID: data.influencerId,
        influencerName: influencersnapshot.data().name,
      });

      //Added in brand json
      await Firebase.Brand.doc(data.brandId).update({
        influencermapping: brandData,
        message: brandDataMessage,
      });

      logging.end();
      res.status(200).json({ message: "Updated Brand" });
    }
  } catch (error) {
    logging.write(
      new Date() + " - mappingbrandwithinfluencer/update ❌ - " + error + " \n"
    );
    console.log(
      new Date() + " - mappingbrandwithinfluencer/update ❌ - " + error + " \n"
    );

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 2. Mapping influencer with event - Join now
app.put("/api/mappinginfluencerwithevent/update", async (req, res) => {
  logging.write(new Date() + " - mappinginfluencerwithevent/update PUT 🚀 \n");
  console.log(new Date() + " - mappinginfluencerwithevent/update PUT 🚀 \n");

  try {
    const data = req.body;

    const snapshot = await Firebase.Influencer.doc(data.influencerId).get();
    let influencerData = [...snapshot.data().eventmapping];
    let influencerDataMessage = [...snapshot.data().message];
    //console.log(data);

    //console.log("step1");
    if (influencerData.find((item) => item.eventId === data.eventId)) {
      let objIndex = influencerData.findIndex(
        (obj) => obj.eventId === data.eventId
      );
      influencerData[objIndex].status = "new";
      influencerData[objIndex].eventId = data.eventId;
    } else {
      influencerData.push({
        eventId: data.eventId,
        status: "new",
      });
    }
    //console.log("step2");

    const eventsnapshot = await Firebase.Event.doc(data.eventId).get();

    influencerDataMessage.push(...snapshot.data().message, {
      statusID: "300",
      eventId: data.eventId,
      eventName: eventsnapshot.data().name,
    });

    //console.log("influencerData after ", {
    //   eventmapping: influencerData,
    //   message: influencerDataMessage,
    // });
    await Firebase.Influencer.doc(data.influencerId).update({
      eventmapping: influencerData,
      message: influencerDataMessage,
    });

    logging.end();
    res.status(200).json({ message: "Updated Influencer" });
  } catch (error) {
    logging.write(
      new Date() + " - mappinginfluencerwithevent/update ❌ - " + error + " \n"
    );
    console.log(
      new Date() + " - mappinginfluencerwithevent/update ❌ - " + error + " \n"
    );

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 3. Mapping influencer with campaign - Apply Now
app.put("/api/mappinginfluencerwithcampaign/update", async (req, res) => {
  logging.write(
    new Date() + " - mappinginfluencerwithcampaign/update PUT 🚀 \n"
  );
  console.log(new Date() + " - mappinginfluencerwithcampaign/update PUT 🚀 \n");

  try {
    const data = req.body;

    const snapshot = await Firebase.Influencer.get();
    let influencerData = [];
    let influencerDataMessage = [];
    snapshot.docs.map((doc) => {
      if (doc.id === data.influencerId) {
        if (doc.data().campaignmapping.length > 0) {
          influencerData.push(...doc.data().campaignmapping);
        }

        influencerDataMessage.push(...doc.data().message);
      }
    });
    //console.log("influencerData before ", influencerData);
    const campaignsnapshot = await Firebase.Campaign.doc(data.campaignId).get();

    if (influencerData.find((item) => item.campaignId === data.campaignId)) {
      let objIndex = influencerData.findIndex(
        (obj) => obj.campaignId === data.campaignId
      );
      influencerData[objIndex].status = "new";
      influencerData[objIndex].biddingprice = data.biddingprice;
      influencerData[objIndex].campaignId = data.campaignId;
      influencerData[objIndex].closingPrice = "";
    } else {
      influencerData.push({
        campaignId: data.campaignId,
        biddingprice: data.biddingprice,
        status: "new",
        viewerDetails: campaignsnapshot.data().viewerDetails,
      });
    }

    influencerDataMessage.push({
      statusID: "200",
      campaignID: data.campaignId,
      campaignName: campaignsnapshot.data().name,
    });

    //console.log("influencerData after ", influencerData);
    await Firebase.Influencer.doc(data.influencerId).update({
      campaignmapping: influencerData,
      message: influencerDataMessage,
    });

    logging.end();
    res.status(200).json({ message: "Updated Influencer" });
  } catch (error) {
    logging.write(
      new Date() +
        " - mappinginfluencerwithcampaign/update ❌ - " +
        error +
        " \n"
    );
    console.log(
      new Date() +
        " - mappinginfluencerwithcampaign/update ❌ - " +
        error +
        " \n"
    );

    logging.end();
    res.status(500).json({ message: error });
  }
});

// 4. Mapping influencer with campaign adding deliverable links - Send it
app.put("/api/mappinginfluencerwithcampaignlinks/update", async (req, res) => {
  logging.write(
    new Date() + " - mappinginfluencerwithcampaignlinks/update PUT 🚀 \n"
  );
  console.log(
    new Date() + " - mappinginfluencerwithcampaignlinks/update PUT 🚀 \n"
  );

  try {
    const data = req.body;
    let snapshot = await Firebase.Influencer.doc(data.influencerId).get();

    const campaignsnapshot = await Firebase.Campaign.doc(data.campaignId).get();
    let campaignmappinglocal = [];
    let influencerDataMessage = [
      ...snapshot.data().message,
      {
        statusID: "400",
        campaignID: data.campaignId,
        campaignName: campaignsnapshot.data().name,
      },
    ];
    snapshot.data().campaignmapping.map((camp) => {
      if (camp.campaignId === data.campaignId) {
        let revnumber = camp.revision + 1 || 0;
        if (revnumber === 0) {
          campaignmappinglocal.push({
            ...camp,
            links: [{ url: data.links, revision: revnumber }],
            revision: revnumber,
            paymentStatus: "new",
          });
        } else {
          campaignmappinglocal.push({
            ...camp,
            links: [...camp.links, { url: data.links, revision: revnumber }],
            revision: revnumber,
            paymentStatus: "new",
          });
        }
      } else {
        campaignmappinglocal.push({ ...camp });
      }
    });

    await Firebase.Influencer.doc(data.influencerId).update({
      campaignmapping: [...campaignmappinglocal],
      message: influencerDataMessage,
    });

    logging.end();
    res.status(200).json({ message: "Updated Influencer with link" });
  } catch (error) {
    logging.write(
      new Date() +
        " - mappinginfluencerwithcampaignlinks/update ❌ - " +
        error +
        " \n"
    );
    console.log(
      new Date() +
        " - mappinginfluencerwithcampaignlinks/update ❌ - " +
        error +
        " \n"
    );

    logging.end();
    res.status(500).json({ message: error });
  }
});

//----------------------------------------------------------------------
app.post("/api/v2/influencer/create", async (req, res) => {
  logging.write(new Date() + " - v2/influencer/create POST 🚀 \n");
  console.log(new Date() + " - v2/influencer/create POST 🚀 \n");

  let userResponse = { uid: "" };

  let influencerData = req.body;
  let isProfileCompletedQuery = req.query.isProfileCompleted;
  //console.log("influencerData", req.body);
  //console.log("isProfileCompletedQuery", isProfileCompletedQuery);

  const createUser = {
    email: influencerData.email,
    password: influencerData.password,
    name:
      isProfileCompletedQuery +
      "_Influencer_" +
      influencerData.name.replace(/\s/g, "") +
      "_" +
      influencerData.surname.replace(/\s/g, ""),
  };
  //console.log("createUser", createUser);
  try {
    //login here
    if (createUser.email != undefined && createUser.password != undefined) {
      if (influencerData.isNonInfluencer.uuid.toString().length > 2) {
        let getUserByUuid = await Firebase.admin
          .auth()
          .getUser(influencerData.isNonInfluencer.uuid.toString());

        await Firebase.admin.auth().updateUser(getUserByUuid?.uid, {
          password: createUser.password,
          emailVerified: false,
          disabled: false,
          displayName: createUser.name,
        });

        userResponse = {
          email: influencerData.email,
          uid: getUserByUuid?.uid,
        };
        //console.log("def", userResponse);
      } else {
        //console.log("abc");
        userResponse = await Firebase.admin.auth().createUser({
          email: createUser.email,
          password: createUser.password,
          emailVerified: false,
          disabled: false,
          displayName: createUser.name,
        });
      }

      //console.log(
      //   "userResponse email",
      //   environments.NODE_ENV,
      //   userResponse.email,
      //   userResponse.uid
      // );
      if (userResponse.email !== undefined && userResponse.uid !== undefined) {
        let influencerSchema = null;
        // const options = {
        //   method: "GET",
        //   url: environments.RAPID_USERINFO_URL + influencerData.instagramurl,
        //   headers: {
        //     "X-RapidAPI-Key": environments.RapidAPIKey,
        //     "X-RapidAPI-Host": environments.RapidAPIHost,
        //   },
        // };
        const options = {
          method: "POST",
          url: "https://rocketapi-for-instagram.p.rapidapi.com/instagram/user/get_info",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": environments.RapidAPIKey_V2,
            "X-RapidAPI-Host": environments.RapidAPIHost_V2,
          },
          data: `{"username":"${influencerData.instagramurl}"}`,
        };
        //pointoferror
        //console.log(options);
        //Here -- axios
        //let instagramPostDetails = [];
        let onGoingStatus = false;
        // let breakMovement = true;
        await axios
          .request(options)
          .then(function (response) {
            let instadatares = response.data.response.body.data.user;
            // //console.log("instagram respnose",instadatares)
            if (instadatares.is_private === false) {
              //let sum = 0;
              //let count = 0;
              //console.log(
              //   "instadatares.edge_owner_to_timeline_media.edges",
              //   instadatares.edge_owner_to_timeline_media.edges.length
              // );
              if (instadatares.edge_owner_to_timeline_media.edges.length > 4) {
                //do something
                onGoingStatus = true;
              } else {
                const err = new TypeError(
                  "We cant't calculate your profile. Please login in with public instagram profile with more than 5 posts."
                );
                throw err;
              }
              //onGoingStatus = 200;
            } else {
              const err = new TypeError(
                "Please Register With Public Instagram Account"
              );
              throw err;
            }
          })
          .catch(function (error) {
            throw error;
          });

        if (onGoingStatus === true) {
          if (influencerData.isNonInfluencer.uuid.toString().length > 2) {
            const snapshotNonInfluencer = await Firebase.NonInfluencer.doc(
              influencerData.isNonInfluencer.id.toString()
            ).get();
            influencerSchema = {
              ...influencerData,
              pinkskymember: snapshotNonInfluencer.data().pinkskymember,
              isProfileCompleted: Math.floor(isProfileCompletedQuery),

              message: [
                {
                  statusID: "100",
                  campaignID: "",
                  campaignName: "",
                },
              ],
              createdDate: new Date(),
              updatedDate: new Date(),
            };
          } else {
            influencerSchema = {
              ...influencerData,
              isProfileCompleted: Math.floor(isProfileCompletedQuery),

              message: [
                {
                  statusID: "100",
                  campaignID: "",
                  campaignName: "",
                },
              ],
              createdDate: new Date(),
              updatedDate: new Date(),
            };
          }

          Firebase.Influencer.add(influencerSchema);
          setTimeout(async () => {
            let influencerArr = [];
            const snapshot = await Firebase.Influencer.get();
            snapshot.docs.map((doc) => {
              if (doc.data().email === createUser.email) {
                influencerArr.push({ id: doc.id, ...doc.data() });
              }
            });
            //console.log("influencerArr", influencerArr);
            //setting up coupon from noninfluencer
            if (
              influencerData.isNonInfluencer.uuid.toString().length > 2 &&
              influencerSchema.pinkskymember.isMember === true
            ) {
              const snapshotCoupon = await Firebase.Coupons.get();
              snapshotCoupon.docs.map(async (doc) => {
                if (
                  doc
                    .data()
                    .userCouponMapping.includes(
                      influencerData.isNonInfluencer.id.toString()
                    )
                ) {
                  await Firebase.Coupons.doc(doc.id).update({
                    userCouponMapping: [
                      ...doc.data().userCouponMapping,
                      influencerArr[0].id,
                    ],
                  });
                }
              });
            }
            setTimeout(() => {
              sendMail("verifyemail", {
                tomail: influencerArr[0].email,
                ccmail: "",
                subjectmail: "Verify your account | Pinksky",
                text:
                  "Hey " +
                  influencerArr[0].name +
                  ", Use the link below to verify your email.",

                href:
                  environments.VERIFY_EMAIL +
                  "?registeras=Influencer&id=" +
                  influencerArr[0].id,
                hrefText: "Verify Email",
              });
              sendMail("registerdetailmail", {
                tomail: environments.EML_USER,
                ccmail: "",
                subjectmail: "Influencer Details | Pinksky",
                text:
                  "Name : " +
                  influencerArr[0].name +
                  ", " +
                  influencerArr[0].surname +
                  " <br/>" +
                  "Whatapp Number : " +
                  influencerArr[0].whatsappnumber +
                  " <br/>" +
                  "Instagram : " +
                  influencerArr[0].instagramurl +
                  " <br/>" +
                  "Email : " +
                  influencerArr[0].email +
                  " <br/>",
                href: environments.EML_HREF_WEBSITE,
                hrefText: "pinkskyclub.com",
              });
              logging.end();
              res.status(200).json({
                message: {
                  displayName: createUser.name,
                  id: influencerArr[0].id,
                  // email: createUser.email,
                  email: influencerArr[0].email,
                  type: "Posted Influencer",
                  uuid: userResponse?.uid,
                  member: false,
                  status: "new",
                },
              });
            }, 1000);
          }, 2000);
        }
      } else {
        logging.write(
          new Date() + " - v2/influencer/create ❌ - " + error + " \n"
        );
        console.log(
          new Date() + " - v2/influencer/create ❌ - " + error + " \n"
        );

        logging.end();
        res.status(500).json({
          message:
            "Something Went wrong. User response is not defined. Please try again.",
        });
      }
    }
  } catch (error) {
    if (userResponse?.uid === "") {
      logging.write(
        new Date() + " - v2/influencer/create ❌ - " + error + " \n"
      );
      console.log(new Date() + " - v2/influencer/create ❌ - " + error + " \n");

      logging.end();
      res.status(402).json({
        message:
          createUser.email +
          " is already an pinksky user. Try sigging up with another user id.",
      });
    } else {
      //console.log(userResponse?.uid);
      if (influencerData.isNonInfluencer.uuid.length > 2) {
        //non influencer is safe
      } else {
        await Firebase.admin.auth().deleteUser(userResponse?.uid);
      }
      //console.log("error", error.message);
      logging.write(
        new Date() + " - v2/influencer/create ❌ - " + error + " \n"
      );
      console.log(new Date() + " - v2/influencer/create ❌ - " + error + " \n");

      logging.end();
      res.status(500).json({ message: error.message });
    }
  }
});
app.post("/api/v2/brand/create", async (req, res) => {
  logging.write(new Date() + " - v2/brand/create POST 🚀 \n");
  console.log(new Date() + " - v2/brand/create POST 🚀 \n");

  let brandData = req.body;
  let isProfileCompletedQuery = req.query.isProfileCompleted;
  //console.log("brandData", req.body);
  const createUser = {
    email: brandData.email,
    password: brandData.password,
    name:
      isProfileCompletedQuery +
      "_Brand_" +
      brandData.companyname.replace(/\s/g, ""),
  };
  let userResponse = { uid: "" };
  try {
    //console.log("createUser", createUser);

    if (createUser.email != undefined && createUser.password != undefined) {
      userResponse = await Firebase.admin.auth().createUser({
        email: createUser.email,
        password: createUser.password,
        emailVerified: false,
        disabled: false,
        displayName: createUser.name,
      });

      //console.log("userResponse email", userResponse.email);
      if (userResponse.email != undefined && userResponse.uid != undefined) {
        let brandSchema = null;
        // const options = {
        //   method: "GET",
        //   url: environments.RAPID_USERINFO_URL + brandData.instagramurl,
        //   headers: {
        //     "X-RapidAPI-Key": environments.RapidAPIKey,
        //     "X-RapidAPI-Host": environments.RapidAPIHost,
        //   },
        // };
        const options = {
          method: "POST",
          url: "https://rocketapi-for-instagram.p.rapidapi.com/instagram/user/get_info",
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": environments.RapidAPIKey_V2,
            "X-RapidAPI-Host": environments.RapidAPIHost_V2,
          },
          data: `{"username":"${brandData.instagramurl}"}`,
        };
        let instagramPostDetails = [];
        let onGoingStatus = 200;
        //console.log("options ", options);
        await axios
          .request(options)
          .then(function (response) {
            let instadatares = response.data.response.body.data.user;
            if (instadatares.is_private === false) {
              let profileItemData = {
                id: "1",
                display_url: instadatares.profile_pic_url_hd,
              };

              instagramPostDetails.push(profileItemData);

              brandSchema = {
                ...brandData,
                instagram: {
                  id: instadatares.id,
                  is_business_account: instadatares.is_business_account,
                  external_url: instadatares.external_url,
                  followers: instadatares.edge_followed_by.count,
                  edge_follow: instadatares.edge_follow.count,
                  is_private: instadatares.is_private,
                  is_verified: instadatares.is_verified,
                },
              };
              onGoingStatus = 200;
            } else {
              onGoingStatus = 401;
            }
          })
          .catch(function (error) {
            throw error;
          });
        if (onGoingStatus === 401) {
          const err = new TypeError(
            "Please Register With Public Instagram Account"
          );
          throw err;
        } else {
          //          let interval = 9000;
          let lengthOfArray = instagramPostDetails.length - 1;
          let brandArr = [];

          //console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            // setTimeout(() => {
            ////console.log("hi people", interval * index);

            const d = new Date();
            let month = d.getMonth() + 1;
            let date = d.getDate();
            let year = d.getFullYear();
            let time = d.getTime();
            const fileName =
              createUser.name +
              "_" +
              month +
              "_" +
              date +
              "_" +
              year +
              "_" +
              time +
              "_" +
              index +
              ".jpeg";
            let filePath = path.join(__dirname, "/images", fileName);
            //console.log("filePath", filePath);
            //let filePath = "./images/" + fileName;
            const options = {
              url: file.display_url,
              method: "GET",
            };
            //console.log("fileName", fileName);
            let getDownloadURL = "";
            request(options, async (err, resp, body) => {
              if (resp.statusCode === 200) {
                //console.log("res.statusCode", resp.statusCode);
                var bucket = Firebase.admin.storage().bucket();

                await bucket.upload(filePath);
                let fileFirebaseURL = environments.FIRESTORE_URL + fileName;
                //console.log("------Here------");
                //console.log(fileFirebaseURL);

                axios
                  .get(fileFirebaseURL)
                  .then((response) => {
                    getDownloadURL =
                      environments.FIRESTORE_URL +
                      `${fileName}?alt=media&token=${response.data.downloadTokens}`;
                    instagramPostDetails[index].new_url = getDownloadURL;
                    //console.log("index", index);
                    fs.unlinkSync(filePath);
                    if (index === lengthOfArray) {
                      //console.log("inside");

                      brandSchema = {
                        ...brandSchema,
                        isProfileCompleted: Math.floor(isProfileCompletedQuery),
                        imgURL: instagramPostDetails[0].new_url,
                        message: [
                          {
                            statusID: "100",
                            influencerID: "",
                            influencerName: "",
                          },
                        ],

                        createdDate: new Date(),
                        updatedDate: new Date(),
                      };
                    }

                    Firebase.Brand.add(brandSchema);
                    setTimeout(async () => {
                      //console.log("inside2");

                      const snapshot = await Firebase.Brand.get();
                      setTimeout(() => {
                        snapshot.docs.map((doc) => {
                          if (doc.data().email === createUser.email) {
                            brandArr.push({ id: doc.id, ...doc.data() });
                          }
                        });

                        sendMail("verifyemail", {
                          tomail: brandArr[0].email,
                          ccmail: "",
                          subjectmail: "Verify your account | Pinksky",
                          text:
                            "Hey " +
                            brandArr[0].companyname +
                            ", Use the link below to verify your email.",

                          href:
                            environments.VERIFY_EMAIL +
                            "?registeras=Brand&id=" +
                            brandArr[0].id,
                          hrefText: "Verify Email",
                        });
                        sendMail("registerdetailmail", {
                          tomail: environments.EML_USER,
                          ccmail: "",
                          subjectmail: "Brand Details | Pinksky",
                          text:
                            "Brand Name : " +
                            brandArr[0].companyname +
                            " <br/>" +
                            "City : " +
                            brandArr[0].city +
                            " <br/>" +
                            "Whatapp Number : " +
                            brandArr[0].whatsappnumber +
                            " <br/>" +
                            "Instagram : " +
                            brandArr[0].instagramurl +
                            " <br/>" +
                            "Email : " +
                            brandArr[0].email +
                            " <br/>",
                          href: environments.EML_HREF_WEBSITE,
                          hrefText: "pinkskyclub.com",
                        });
                        logging.end();
                        res.status(200).json({
                          message: {
                            displayName: createUser.name,
                            id: brandArr[0].id,
                            // email: createUser.email,
                            email: brandArr[0].email,
                            type: "Posted Brand",
                            uuid: userResponse?.uid,
                            member: false,
                            status: "new",
                          },
                        });
                      }, 1000);
                    }, 2000);
                  })
                  .catch((error) => {
                    throw error;
                  });
              }
            }).pipe(fs.createWriteStream(filePath));
            // }, index * interval);
          });
        }
      }
    }
  } catch (error) {
    logging.write(new Date() + " - v2/brand/create ❌ - " + error + " \n");
    console.log(new Date() + " - v2/brand/create ❌ - " + error + " \n");

    logging.end();
    // if (error instanceof ReferenceError) {

    //   // Output expected ReferenceErrors.

    //   //console.log("braaaannndd error",error);
    // }else{
    //console.log(userResponse);
    if (userResponse?.uid === "") {
      //console.log(createUser.email);

      res.status(402).json({
        message:
          createUser.email +
          " is already an pinksky user. Try sigging up with another user id.",
      });
    } else {
      await Firebase.admin.auth().deleteUser(userResponse?.uid);

      //console.log("error", error.message);

      res.status(500).json({ message: error.message });
    }
    //}
    // //console.log("error", error);
    //

    // res.status(500).json({ message: error.message });
  }
});
app.post("/api/v2/signin/profileupdating", async (req, res) => {
  logging.write(new Date() + " - v2/signin/profileupdating POST 🚀 \n");
  console.log(new Date() + " - v2/signin/profileupdating POST 🚀 \n");

  try {
    let { data, isRegistering } = req.body;
    if (data.displayName.slice(0, 1) === "1" && isRegistering == "N") {
      if (data.displayName.indexOf("Brand") != -1) {
        //Brand
        const snapshot = await Firebase.Brand.doc(data.id).get();

        var difference =
          new Date().getTime() - snapshot.data().updatedDate.toDate().getTime();

        var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
        //console.log("daysDifference", daysDifference);
        if (daysDifference > 15) {
          let brandSchema = null;
          // const options = {
          //   method: "GET",
          //   url: environments.RAPID_USERINFO_URL + snapshot.data().instagramurl,
          //   headers: {
          //     "X-RapidAPI-Key": environments.RapidAPIKey,
          //     "X-RapidAPI-Host": environments.RapidAPIHost,
          //   },
          // };
          const options = {
            method: "POST",
            url: "https://rocketapi-for-instagram.p.rapidapi.com/instagram/user/get_info",
            headers: {
              "content-type": "application/json",
              "X-RapidAPI-Key": environments.RapidAPIKey_V2,
              "X-RapidAPI-Host": environments.RapidAPIHost_V2,
            },
            data: `{"username":"${snapshot.data().instagramurl}"}`,
          };
          await axios
            .request(options)
            .then(function (response) {
              // //console.log("inside2", response.data);
              let instadatares = response.data.response.body.data.user;
              brandSchema = {
                ...snapshot.data(),
                instagram: {
                  id: instadatares.id,
                  is_business_account: instadatares.is_business_account,
                  external_url: instadatares.external_url,
                  followers: instadatares.edge_followed_by.count,
                  edge_follow: instadatares.edge_follow.count,
                  is_private: instadatares.is_private,
                  is_verified: instadatares.is_verified,
                },
                updatedDate: new Date(),
              };
              setTimeout(async () => {
                await Firebase.Brand.doc(data.id).update(brandSchema);

                logging.end();
                res.status(200).json({
                  message: "Updated Profile",
                });
              }, 1000);
            })
            .catch(function (error) {
              throw error;
            });
        } else {
          logging.end();
          res.status(200).json({
            message: "Nothing to Update in Profile",
          });
        }
      } else {
        const snapshot = await Firebase.Influencer.doc(data.id).get();

        var difference =
          new Date().getTime() - snapshot.data().updatedDate.toDate().getTime();

        var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
        console.log(`daysDifference for id ${data.id} is `, daysDifference);
        if (daysDifference > 15) {
          //console.log("inside");
          let influencerSchema = null;
          // const options = {
          //   method: "GET",
          //   url: environments.RAPID_USERINFO_URL + snapshot.data().instagramurl,
          //   headers: {
          //     "X-RapidAPI-Key": environments.RapidAPIKey,
          //     "X-RapidAPI-Host": environments.RapidAPIHost,
          //   },
          // };
          const options = {
            method: "POST",
            url: "https://rocketapi-for-instagram.p.rapidapi.com/instagram/user/get_info",
            headers: {
              "content-type": "application/json",
              "X-RapidAPI-Key": environments.RapidAPIKey_V2,
              "X-RapidAPI-Host": environments.RapidAPIHost_V2,
            },
            data: `{"username":"${snapshot.data().instagramurl}"}`,
          };
          let instagramPostDetails = [];
          await axios
            .request(options)
            .then(function (response) {
              let sum = 0;
              let count = 0;
              let instadatares = response.data.response.body.data.user;
              instadatares.edge_owner_to_timeline_media.edges.map((item) => {
                // //console.log(item);
                sum =
                  sum +
                  item.node.edge_media_to_comment.count +
                  item.node.edge_liked_by.count;

                if (count <= 4) {
                  // //console.log("item.node.shortcode", item.node.shortcode);
                  let itemData = {
                    id: item.node.id,
                    shortcode: item.node.shortcode,
                    display_url: item.node.display_url,
                    caption: item.node.edge_media_to_caption.edges[0].node.text,
                    edge_media_to_comment:
                      item.node.edge_media_to_comment.count,
                    edge_liked_by: item.node.edge_liked_by.count,
                  };

                  instagramPostDetails.push(itemData);
                }
                count++;
              });
              //console.log("SUM", sum);
              let engagementRate = sum / instadatares.edge_followed_by.count;
              //* 1000;
              //console.log("ENGAGEMENT RATE", engagementRate);

              influencerSchema = {
                ...snapshot.data(),
                imgURL1: instagramPostDetails[0].display_url,
                imgURL2: instagramPostDetails[1].display_url,
                imgURL3: instagramPostDetails[2].display_url,
                imgURL4: instagramPostDetails[3].display_url,
                imgURL5: instagramPostDetails[4].display_url,
                instagram: {
                  engagementRate:
                    engagementRate.toString().replace(".", "").substring(0, 1) +
                    "." +
                    engagementRate.toString().replace(".", "").substring(1, 3),
                  id: instadatares.id,
                  is_business_account: instadatares.is_business_account,
                  external_url: instadatares.external_url,
                  followers: instadatares.edge_followed_by.count,
                  edge_follow: instadatares.edge_follow.count,
                  is_private: instadatares.is_private,
                  is_verified: instadatares.is_verified,
                },
                updatedDate: new Date(),
              };
            })
            .catch(function (error) {
              throw error;
            });

          let interval = 8500;
          let lengthOfArray = instagramPostDetails.length - 1;
          // let influencerArr = [];
          //console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            setTimeout(() => {
              //console.log("hi people", interval * index);

              const d = new Date();
              let month = d.getMonth() + 1;
              let date = d.getDate();
              let year = d.getFullYear();
              let time = d.getTime();
              const fileName =
                data.displayName +
                "_" +
                month +
                "_" +
                date +
                "_" +
                year +
                "_" +
                time +
                "_" +
                index +
                ".jpeg";
              let filePath = path.join(__dirname, "/images", fileName);
              //let filePath = "./images/" + fileName;
              const options = {
                url: file.display_url,
                method: "GET",
              };
              //console.log("fileName", fileName);
              let getDownloadURL = "";
              request(options, async (err, resp, body) => {
                if (resp.statusCode === 200) {
                  //console.log("res.statusCode", resp.statusCode);
                  var bucket = Firebase.admin.storage().bucket();

                  await bucket.upload(filePath);
                  let fileFirebaseURL = environments.FIRESTORE_URL + fileName;
                  //console.log("------Here------");
                  //console.log(fileFirebaseURL);
                  axios
                    .get(fileFirebaseURL)
                    .then((response) => {
                      getDownloadURL =
                        environments.FIRESTORE_URL +
                        `${fileName}?alt=media&token=${response.data.downloadTokens}`;
                      instagramPostDetails[index].new_url = getDownloadURL;
                      //console.log("index", index);
                      fs.unlinkSync(filePath);
                      if (index === lengthOfArray) {
                        //console.log("inside");

                        influencerSchema = {
                          ...influencerSchema,
                          imgURL1: instagramPostDetails[0]?.new_url,
                          imgURL2: instagramPostDetails[1]?.new_url,
                          imgURL3: instagramPostDetails[2]?.new_url,
                          imgURL4: instagramPostDetails[3]?.new_url,
                          imgURL5: instagramPostDetails[4]?.new_url,
                        };
                        //console.log("influencerSchema", influencerSchema);
                        setTimeout(async () => {
                          //console.log("inside2");

                          await Firebase.Influencer.doc(data.id).update(
                            influencerSchema
                          );

                          logging.end();
                          res.status(200).json({
                            message: "Updated Profile",
                          });
                        }, 4000);
                      }
                    })
                    .catch((error) => {
                      throw error;
                    });
                }
              }).pipe(fs.createWriteStream(filePath));
            }, index * interval);
          });
        } else {
          logging.end();
          res.status(200).json({
            message: "Nothing to Update in Profile",
          });
        }
      }
    } else if (data.displayName.slice(0, 1) === "0" && isRegistering == "Y") {
      if (data.displayName.indexOf("Influencer") != -1) {
        const snapshot = await Firebase.Influencer.doc(data.id).get();

        let influencerSchema = null;
        // const options = {
        //   method: "GET",
        //   url: environments.RAPID_USERINFO_URL + snapshot.data().instagramurl,
        //   headers: {
        //     "X-RapidAPI-Key": environments.RapidAPIKey,
        //     "X-RapidAPI-Host": environments.RapidAPIHost,
        //   },
        // };
        const options = {
          method: "POST",
          url: environments.RAPID_USERINFO_URL_V2,
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": environments.RapidAPIKey_V2,
            "X-RapidAPI-Host": environments.RapidAPIHost_V2,
          },
          data: `{"username":"${snapshot.data().instagramurl}"}`,
        };
        //pointoferror

        let instagramPostDetails = [];
        await axios
          .request(options)
          .then(function (response) {
            let instadatares = response.data.response.body.data.user;

            ////console.log("response", response);
            let sum = 0;
            let count = 0;

            instadatares.edge_owner_to_timeline_media.edges.map((item) => {
              // //console.log(item);
              sum =
                sum +
                item.node.edge_media_to_comment.count +
                item.node.edge_liked_by.count;

              if (count <= 4) {
                // //console.log("item.node.shortcode", item.node.shortcode);
                let itemData = {
                  id: item.node.id,
                  shortcode: item.node.shortcode,
                  display_url: item.node.display_url,
                  caption: item.node.edge_media_to_caption.edges[0].node.text,
                  edge_media_to_comment: item.node.edge_media_to_comment.count,
                  edge_liked_by: item.node.edge_liked_by.count,
                };

                instagramPostDetails.push(itemData);
              }
              count++;
            });
            //console.log("SUM", sum);
            let engagementRate = sum / instadatares.edge_followed_by.count;
            //* 1000;
            //console.log("ENGAGEMENT RATE", engagementRate);

            influencerSchema = {
              // ...snapshot.data(),
              imgURL1: instagramPostDetails[0].display_url,
              imgURL2: instagramPostDetails[1].display_url,
              imgURL3: instagramPostDetails[2].display_url,
              imgURL4: instagramPostDetails[3].display_url,
              imgURL5: instagramPostDetails[4].display_url,
              instagram: {
                engagementRate:
                  engagementRate.toString().replace(".", "").substring(0, 1) +
                  "." +
                  engagementRate.toString().replace(".", "").substring(1, 3),
                id: instadatares.id,
                is_business_account: instadatares.is_business_account,
                external_url: instadatares.external_url,
                followers: instadatares.edge_followed_by.count,
                edge_follow: instadatares.edge_follow.count,
                is_private: instadatares.is_private,
                is_verified: instadatares.is_verified,
              },
              updatedDate: new Date(),
            };
          })
          .catch(function (error) {
            throw error;
          });

        let interval = 8000;
        let lengthOfArray = instagramPostDetails.length - 1;
        // let influencerArr = [];
        //console.log("lengthOfArray", lengthOfArray);
        instagramPostDetails.forEach((file, index) => {
          setTimeout(() => {
            //console.log("hi people", interval * index);

            const d = new Date();
            let month = d.getMonth() + 1;
            let date = d.getDate();
            let year = d.getFullYear();
            let time = d.getTime();
            const fileName =
              data.displayName +
              "_" +
              month +
              "_" +
              date +
              "_" +
              year +
              "_" +
              time +
              "_" +
              index +
              ".jpeg";
            let filePath = path.join(__dirname, "/images", fileName);
            //let filePath = "./images/" + fileName;
            const optionss = {
              url: file.display_url,
              method: "GET",
            };
            //console.log("fileName", fileName);
            let getDownloadURL = "";
            request(optionss, async (err, resp, body) => {
              console.log(
                "v2/signin/profileupdating res while uploading images ",
                resp.statusCode
              );
              if (resp.statusCode === 200) {
                //console.log("res.statusCode", resp.statusCode);
                var bucket = Firebase.admin.storage().bucket();

                await bucket.upload(filePath);
                let fileFirebaseURL = environments.FIRESTORE_URL + fileName;
                //console.log("------Here------");
                //console.log(fileFirebaseURL);
                axios
                  .get(fileFirebaseURL)
                  .then(async (response) => {
                    getDownloadURL =
                      environments.FIRESTORE_URL +
                      `${fileName}?alt=media&token=${response.data.downloadTokens}`;
                    instagramPostDetails[index].new_url = getDownloadURL;
                    //console.log("index", index);
                    fs.unlinkSync(filePath);
                    if (index === lengthOfArray) {
                      //console.log("inside");
                      const snapshot2 = await Firebase.Influencer.doc(
                        data.id
                      ).get();

                      influencerSchema = {
                        ...snapshot2.data(),
                        ...influencerSchema,
                        imgURL1: instagramPostDetails[0]?.new_url,
                        imgURL2: instagramPostDetails[1]?.new_url,
                        imgURL3: instagramPostDetails[2]?.new_url,
                        imgURL4: instagramPostDetails[3]?.new_url,
                        imgURL5: instagramPostDetails[4]?.new_url,
                      };
                      //console.log("influencerSchema", influencerSchema);
                      setTimeout(async () => {
                        //console.log("inside2");

                        await Firebase.Influencer.doc(data.id).update(
                          influencerSchema
                        );

                        logging.end();
                        res.status(200).json({
                          message: "Updated Profile",
                        });
                      }, 4000);
                    }
                  })
                  .catch((error) => {
                    throw error;
                  });
              }
            }).pipe(fs.createWriteStream(filePath));
          }, index * interval);
        });
      } else {
        logging.end();
        res.status(200).json({
          message: "Nothing to Update in Profile",
        });
      }
    }
  } catch (error) {
    logging.write(
      new Date() + " - signin/profileupdating ❌ - " + error + " \n"
    );

    console.log(new Date() + " - signin/profileupdating ❌ - " + error + " \n");
    logging.end();
    res.status(500).json({ message: error });
  }
});

app.listen(PORT, () => console.log("Running @5000"));
