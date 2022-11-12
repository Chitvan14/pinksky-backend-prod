const express = require("express");
const cors = require("cors");
const axios = require("axios");
const request = require("request");
// const sheetdb = require("sheetdb-node");
const fs = require("fs");
const stripe = require("stripe")(
  "sk_test_51IBywyEAjIG7X6ReN7Xk9I0tznJCmgOtQ1cqV0X744gtCFaYhUYI4FBUPdi8PmJ7fRN9bAaQnBA89yDzkFd7KuHj00ucejTMdS"
);

require("dotenv").config();
const { Firebase } = require("./config.js");
// const { FrontendData } = require("./frontendData");

const app = express();
//https://pinksky.herokuapp.com/
const PORT = process.env.PORT || 5000;
// const client = sheetdb({ address: process.env.SPREADSHEET });
// const clientBrand = sheetdb({
//   address: process.env.SPREADSHEET + "?sheet=Brand",
// });

app.use(express.json());
app.use(cors());

app.post("/api/mappinginfluencerasmember/update", async (req, res) => {
  let response = req.body;
  console.log(response);
  if (response.isInfluencer === true) {
    const snapshot = await Firebase.Influencer.doc(response.id).get();
    //let snapshotData = snapshot.data();
    console.log(snapshot.data().pinkskymember.isMember);
    if (snapshot.data().pinkskymember.isMember === true) {
      //nothing
    } else {
      await Firebase.Influencer.doc(response.id).update({
        pinkskymember: {
          isMember: true,
          cooldown: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ),
        },
      });
      res.status(200).json({ message: "Mapping User as member" });
    }
  } else if (response.isNonInfluencer === true) {
    const nonsnapshot = await Firebase.NonInfluencer.doc(response.id).get();
    //let nonsnapshotData = nonsnapshot.data();
    if (nonsnapshot.data().pinkskymember.isMember === true) {
      //nothing
    } else {
      await Firebase.NonInfluencer.doc(response.id).update({
        pinkskymember: {
          isMember: true,
          cooldown: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ),
        },
      });
      res.status(200).json({ message: "Mapping User as member" });
    }
  } else {
    //nothing
  }
});
app.post("/api/getcouponmessage/stripe", async (req, res) => {
  let response = req.body;

  console.log(response);

  if (response.isMember === false) {
    let paymentLink = {};

    paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: "price_1LvkcyEAjIG7X6ResejEPNS9",
          // price: response.data.paymentcode,
          quantity: 1,
        },
      ],
      after_completion: {
        redirect: {
          //paymentsuccess
          url:
            // "https://pinksky-development.netlify.app?id=" +
            "http://localhost:3000/paymentsuccess?id=" + response.influencerid,
        },
        type: "redirect",
      },
    });

    console.log(paymentLink);
    res
      .status(200)
      .json({ data: paymentLink, message: "Generate Coupon Payment Link" });
  } else {
    //map influencrer id with coupon
    //send message
    const snapshot = await Firebase.Coupons.doc(response.data.id).get();
    // if(snapshot.data().userCouponMapping.length > 0){
    //   snapshot.data().userCouponMapping.map(ucm => {

    //   })
    // }
    await Firebase.Coupons.doc(response.data.id).update({
      userCouponMapping: [
        ...snapshot.data().userCouponMapping,
        response.influencerid,
      ],
    });
    res.status(200).json({ message: "Notified" });
  }
  //add cases
});
// app.post("/api//stripe", async (req, res) => {
//   // const customer = await stripe.customers.retrieve(
//   //   'cus_Mf4s5JNb4DAeyv'
//   // );
//   // const invoice = await stripe.invoices.retrieveUpcoming({
//   //   customer: 'cus_Mf4s5JNb4DAeyv',
//   // });
//   const session = await stripe.billingPortal.sessions.create({
//     customer: 'cus_Mf4s5JNb4DAeyv'
//   });
//   // const lines = await stripe.invoices.listUpcomingLineItems({
//   //   customer: 'cus_Mf4s5JNb4DAeyv',

//   // });
//   console.log(session);
//   // let id = req.body.customerid;
//   // const session = await stripe.billingPortal.sessions.create({
//   //   customer: id,
//   // });
//   // const subscription = await stripe.subscriptions.create({
//   //   customer: id,
//   //   "billing_cycle_anchor": 1667029393,
//   //   items: [
//   //     {price: 'price_1LvxHNEAjIG7X6ReQpP8HsUA'},
//   //   ],
//   // });
//   // const customer = await stripe.customers.retrieve(
//   //   id
//   // );
//   // const paymentLink = await stripe.paymentLinks.create({
//   //   line_items: [
//   //     {
//   //       price: 'price_1LyPsI2eZvKYlo2CiUyLGPfP',
//   //       quantity: 1,
//   //     },
//   //   ],
//   // });
//   // console.log(session);
//   // res
//   //   .status(200)
//   //   .json({ data: session, message: "Generate Brand Subscription Link" });
// });
app.post("/api/getbrandsubplan/stripe", async (req, res) => {
  let response = req.body;

  console.log(response.data);
  console.log(response.label);
  let label = response.label;
  //add cases
  let paymentLink = {};
  if (label === "Food & Beverage") {
    paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: "price_1LvkcyEAjIG7X6ResejEPNS9",
          quantity: 1,
        },
      ],
      after_completion: {
        redirect: {
          url: "https://pinksky-development.netlify.app",
        },
        type: "redirect",
      },
    });
  } else if (label === "Skincare & Salon") {
  } else if (label === "Clubbing & Nightlife") {
  } else if (label === "Gym & Fitness") {
  } else if (label === "Automobiles") {
  } else if (label === "Fashion & Lifestyle") {
  } else if (label === "Beauty & Cosmetic") {
  }

  console.log(paymentLink);
  res
    .status(200)
    .json({ data: paymentLink, message: "Generate Brand Payment Link" });
});

app.post("/api/getbrandsubscription/stripe", async (req, res) => {
  let id = req.body.customerid;
  const session = await stripe.billingPortal.sessions.create({
    customer: id,
  });
  // const subscription = await stripe.subscriptions.create({
  //   customer: id,
  //   "billing_cycle_anchor": 1667029393,
  //   items: [
  //     {price: 'price_1LvxHNEAjIG7X6ReQpP8HsUA'},
  //   ],
  // });
  // const customer = await stripe.customers.retrieve(
  //   id
  // );
  // const paymentLink = await stripe.paymentLinks.create({
  //   line_items: [
  //     {
  //       price: 'price_1LyPsI2eZvKYlo2CiUyLGPfP',
  //       quantity: 1,
  //     },
  //   ],
  // });
  console.log(session);
  res
    .status(200)
    .json({ data: session, message: "Generate Brand Subscription Link" });
});

app.post("/api/generatepaymentlink/create", async (req, res) => {
  let id = req.body.influencerid;
  const snapshot = await Firebase.Influencer.doc(id).get();
  // name
  // campaignnames
  // amount
  //upiid
  let upiid = snapshot.data().paymentdetails.upi;
  let name = snapshot.data().name + " " + snapshot.data().surname;
  let campaignArr = [];
  let campaigns = [];
  let count = 0;
  snapshot.data().campaignmapping.map(async (item) => {
    if (item.paymentStatus === "accepted") {
      const campaignsnapshot = await Firebase.Campaign.doc(
        item.campaignId
      ).get();

      count += parseInt(item.closingPrice);
      campaigns.push({ ...item, paymentStatus: "initiated" });
      campaignArr.push(campaignsnapshot.data().name);
    } else {
      campaigns.push({ ...item });
    }
  });

  //update necc
  setTimeout(async () => {
    const locationurl = `upi://pay?pa=${upiid}&pn=${name}&am=${count}&cu=INR&tn=${campaignArr.join(
      ","
    )}`;

    await Firebase.Influencer.doc(id).update({
      campaignmapping: campaigns,
    });
    res
      .status(200)
      .json({ data: locationurl, message: "Generate Payment Link" });
  }, 2000);
});
//Auth
app.post("/api/forgotpassword", async (req, res) => {
  try {
    console.log("email sent");
    await Firebase.firebase
      .auth()
      .sendPasswordResetEmail(req.body.email)
      .catch((error) => {
        throw error;
      });
    console.log("email sent1");
    res.status(200).json({ message: "Forgot Password" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.post("/api/signin", async (req, res) => {
  //update instagram on login...⭐️
  try {
    const createUser = {
      email: req.body.email,
      password: req.body.password,
    };
    console.log(createUser);
    const userResponse = await Firebase.firebase
      .auth()
      .signInWithEmailAndPassword(createUser.email, createUser.password)
      .catch((error) => {
        throw error;
      });
    console.log("userResponse.user.displayName", userResponse.user.displayName);
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
        var difference =
          new Date().getTime() - brandData[0].updatedDate.toDate().getTime();

        var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
        console.log("daysDifference", daysDifference);
        if (daysDifference > 15) {
          console.log("inside");
          let brandSchema = null;
          const options = {
            method: "GET",
            url: process.env.RAPID_USERINFO_URL + brandData[0].instagramurl,
            headers: {
              "X-RapidAPI-Key": process.env.RapidAPIKey,
              "X-RapidAPI-Host": process.env.RapidAPIHost,
            },
          };

          await axios
            .request(options)
            .then(function (response) {
              brandSchema = {
                ...brandData[0],
                imgURL: response.data.data.profile_pic_url_hd,
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
                await Firebase.Brand.doc(brandData[0].id).update(brandSchema);
              }, 2000);
            })
            .catch(function (error) {
              throw error;
            });
        }

        res.status(200).json({
          message: {
            displayName: userResponse.user.displayName,
            id: brandData[0].id,
            email: createUser.email,
            type: "Brand",
            status: brandData[0].status,
            isMember: false,
          },
        });
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

        let isMember = false;
        if (noninfluencerData[0].pinkskymember.cooldown.seconds === null) {
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

        res.status(200).json({
          message: {
            displayName: userResponse.user.displayName,
            id: noninfluencerData[0].id,
            email: createUser.email,
            type: "Non_Influencer",
            status: "100",
            isMember: isMember,
          },
        });
      } else {
        console.log("2");
        let influencerData = [];
        const snapshot = await Firebase.Influencer.get();
        snapshot.docs.map((doc) => {
          if (doc.data().email === createUser.email) {
            influencerData.push({ id: doc.id, ...doc.data() });
          }
        });
        // member:false,non_influencer_auth: false
        // if (
        //   influencerData[0].pinkskymember.isMember === false &&
        //   influencerData[0].pinkskymember.cooldown
        // ) {
        // }
        //console.log("influencerData[0].pinkskymember.isMember",influencerData[0].pinkskymember.cooldown.seconds);
        let isMember = false;
        if (influencerData[0].pinkskymember.cooldown.seconds === null) {
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

        var difference =
          new Date().getTime() -
          influencerData[0].updatedDate.toDate().getTime();

        var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
        console.log("daysDifference", daysDifference);
        if (daysDifference > 15) {
          console.log("inside");
          let influencerSchema = null;
          const options = {
            method: "GET",
            url:
              process.env.RAPID_USERINFO_URL + influencerData[0].instagramurl,
            headers: {
              "X-RapidAPI-Key": process.env.RapidAPIKey,
              "X-RapidAPI-Host": process.env.RapidAPIHost,
            },
          };

          await axios
            .request(options)
            .then(function (response) {
              let sum = 0;
              let count = 0;
              let instagramPostDetails = [];
              response.data.data.edge_owner_to_timeline_media.edges.map(
                (item) => {
                  console.log(item);
                  sum =
                    sum +
                    item.node.edge_media_to_comment.count +
                    item.node.edge_liked_by.count;
                  if (count <= 3) {
                    console.log("item.node.shortcode", item.node.shortcode);
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
              console.log("SUM", sum);
              let engagementRate =
                (sum / response.data.data.edge_followed_by.count) * 1000;
              console.log("ENGAGEMENT RATE", engagementRate);

              influencerSchema = {
                ...influencerData[0],
                imgURL1: response.data.data.profile_pic_url_hd,
                imgURL2: instagramPostDetails[0].display_url,
                imgURL3: instagramPostDetails[1].display_url,
                imgURL4: instagramPostDetails[2].display_url,
                imgURL5: instagramPostDetails[3].display_url,
                instagram: {
                  engagementRate: engagementRate,
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
                await Firebase.Influencer.doc(influencerData[0].id).update(
                  influencerSchema
                );
              }, 2000);
            })
            .catch(function (error) {
              throw error;
            });
        }
        res.status(200).json({
          message: {
            displayName: userResponse.user.displayName,
            id: influencerData[0].id,
            email: createUser.email,
            type: "Influencer",
            status: influencerData[0].status,
            isMember: isMember,
          },
        });
      }
    } else {
      res.status(500).json({ message: "Invalid User" });
    }

    //  createUser({
    //   email: createUser.email,
    //   password: createUser.password,
    //   emailVerified: false,
    //   disabled: false,
    // });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//Get
//1.Influencer using id
app.post("/api/influencer", async (req, res) => {
  try {
    console.log(req.body);
    const snapshot = await Firebase.Influencer.doc(req.body.id).get();

    let list = [];
    //add event and campaign different and show on profile
    snapshot.data().message.map(async (doc) => {
      if (doc.eventId) {
        console.log(doc.statusID);
        const eventsnapshot = await Firebase.Event.doc(doc.eventId).get();
        list.push({ ...doc, eventDetails: { ...eventsnapshot.data() } });
      }
      if (doc.campaignID) {
        console.log(doc.statusID);
        const campaignsnapshot = await Firebase.Campaign.doc(
          doc.campaignID
        ).get();
        list.push({ ...doc, campaignDetails: { ...campaignsnapshot.data() } });
      }
    });
    console.log("list", list);
    setTimeout(() => {
      let influencerprofiledata = {
        ...snapshot.data(),
        message: list,
      };
      console.log("influencerprofiledata", influencerprofiledata);
      // console.log(list);
      // console.log("[...snapshot.data()]",{...snapshot.data()})
      // console.log("yahaan hoon");
      res
        .status(200)
        .json({ data: [influencerprofiledata], message: "Fetched Influencer" });
    }, 5000);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.post("/api/noninfluencer", async (req, res) => {
  try {
    console.log(req.body);
    const snapshot = await Firebase.NonInfluencer.doc(req.body.id).get();

    // let list = [];
    //add event and campaign different and show on profile
    // snapshot.data().message.map(async (doc) => {
    //   if (doc.eventId) {
    //     console.log(doc.statusID);
    //     const eventsnapshot = await Firebase.Event.doc(doc.eventId).get();
    //     list.push({ ...doc, eventDetails: { ...eventsnapshot.data() } });
    //   }
    //   if (doc.campaignID) {
    //     console.log(doc.statusID);
    //     const campaignsnapshot = await Firebase.Campaign.doc(
    //       doc.campaignID
    //     ).get();
    //     list.push({ ...doc, campaignDetails: { ...campaignsnapshot.data() } });
    //   }
    // });
    // console.log("list", list);
    setTimeout(() => {
      let noninfluencerprofiledata = {
        ...snapshot.data(),
        // message: list,
      };
      console.log("noninfluencerprofiledata", noninfluencerprofiledata);
      // console.log(list);
      // console.log("[...snapshot.data()]",{...snapshot.data()})
      // console.log("yahaan hoon");
      res
        .status(200)
        .json({
          data: [noninfluencerprofiledata],
          message: "Fetched Non Influencer",
        });
    }, 5000);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//Get
//1.Brand using id
app.post("/api/brand", async (req, res) => {
  try {
    console.log(req.body);
    const snapshot = await Firebase.Brand.doc(req.body.id).get();
    // let list = [];
    // snapshot.docs.map((doc) => {
    //   if (doc.id === req.body.id) {
    //     list.push({ id: doc.id, ...doc.data() });
    //   }
    // });
    // snapshot.data().message.map(async (doc) => {
    //   if (doc.influencerId !== "") {
    //     console.log(doc.statusID);
    //     const influencersnapshot = await Firebase.Influencer.doc(
    //       doc.influencerId
    //     ).get();
    //     list.push({
    //       ...doc,
    //       influencerDetails: { ...influencersnapshot.data() },
    //     });
    //   }else{
    //     list.push({...doc});
    //   }
    // });
    // snapshot.data().message.map(async (doc) => {
    //   // console.log(doc);
    //   if (doc.influencerID) {

    //     const influencersnapshot = await Firebase.Influencer.doc(
    //       doc.influencerID
    //     ).get();
    //     let influencerlist = influencersnapshot.data();
    //     list.push({
    //       ...doc,
    //       name:
    //         influencerlist.name || "",

    //       // phonenumber:
    //       //   influencerlist.phonenumber || "",
    //       // whatsappnumber:
    //       //   influencerlist.filter(
    //       //     (fun) => fun.id === nesitem.influencerId
    //       //   )[0].whatsappnumber || "",
    //       // instagramurl:
    //       //   influencerlist.filter(
    //       //     (fun) => fun.id === nesitem.influencerId
    //       //   )[0].instagramurl || "",
    //       // email:
    //       //   influencerlist.filter(
    //       //     (fun) => fun.id === nesitem.influencerId
    //       //   )[0].email || "",
    //       // category:
    //       //   influencerlist.filter(
    //       //     (fun) => fun.id === nesitem.influencerId
    //       //   )[0].category || "",
    //     });
    //     // console.log(influencersnapshot.data());
    //     // list.push({
    //     //   ...doc,
    //     //   influencerDetails: influencersnapshot.data(),
    //     // });
    //   }
    // });

    // setTimeout(() => {
    // console.log(list);
    console.log("yahaan hoon");
    let brandprofiledata = {
      ...snapshot.data(),
      // message: list,
    };
    // console.log("influencerprofiledata", influencerprofiledata);
    // console.log(list);
    // console.log("[...snapshot.data()]",{...snapshot.data()})
    // console.log("yahaan hoon");
    res
      .status(200)
      .json({ data: [brandprofiledata], message: "Fetched Brand" });
    // }, 2000);
    // res.status(200).json({ data: list, message: "Fetched Brand" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// app.get("/api/forgotpassword", async (req, res) => {
//   try {
//    setTimeout(() => {
//     res.status(200).json({
//       message: "Processing forgotpassword"
//     });
//    }, 2000);

//   } catch (error) {
//     res.status(500).json({ message: error });
//   }
// });
//Get
//1.Campaign using id
app.get("/api/home", async (req, res) => {
  try {
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
    snapshotInfl.docs.map((doc) => {
      if (doc.data().status === "accepted") {
        influencerlist.push({ id: doc.id, ...doc.data() });
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
    const snapshotcoupon = await Firebase.Coupons.get();
    let couponlist = [];
    snapshotcoupon.docs.map((doc) => {
      if (doc.data().isActive === 1) {
        couponlist.push({ id: doc.id, ...doc.data() });
      }
    });

    res.status(200).json({
      campaignlist: campaignlist,
      influencerlist: influencerlist,
      eventlist: eventlist,
      couponlist:couponlist,
      message: "Fetched Home",
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.post("/api/admin/pinksky", async (req, res) => {
  let data = req.body;
  try {
    const getAdmin = await Firebase.Influencer.doc(data.adminid).get();
    console.log("entered");
    //let globalAdmin = false;

    // if (getAdmin.data().admin && data.adminid === process.env.ADMINID) {
    //   globalAdmin = true;
    //   //campaign
    //   const snapshotCamp = await Firebase.Campaign.get();
    //   // let campaignlist = [];
    //   let admincampaignlist = [];
    //   snapshotCamp.docs.map((doc) => {
    //     // if (doc.data().isActive === 1) {
    //     //   campaignlist.push({ id: doc.id, ...doc.data() });
    //     // }
    //     admincampaignlist.push({ id: doc.id, ...doc.data() });
    //   });
    //   //event
    //   const snapshotevent = await Firebase.Event.get();
    //   // let eventlist = [];
    //   let admineventlist = [];
    //   snapshotevent.docs.map((doc) => {
    //     // if (doc.data().isActive === 1) {
    //     //   eventlist.push({ id: doc.id, ...doc.data() });
    //     // }
    //     admineventlist.push({ id: doc.id, ...doc.data() });
    //   });

    //   //influencer
    //   const snapshotInfl = await Firebase.Influencer.get();
    //   // let influencerlist = [];
    //   let admininfluencerlist = [];
    //   let localcampaignmapping = [];
    //   let localeventmapping = [];

    //   snapshotInfl.docs.map((doc) => {

    //       console.log("influencerlist6");
    //       doc.data().campaignmapping.map((nesitem) => {
    //         localcampaignmapping.push({
    //           ...nesitem,
    //           name: campaignlist.filter(
    //             (fun) => fun.id === nesitem.campaignId
    //           )[0].name,
    //           category: campaignlist.filter(
    //             (fun) => fun.id === nesitem.campaignId
    //           )[0].category,
    //         });
    //       });
    //       console.log("influencerlist7");
    //       doc.data().eventmapping.map((nesitem) => {
    //         localeventmapping.push({
    //           ...nesitem,
    //           name: eventlist.filter((fun) => fun.id === nesitem.eventId)[0]
    //             .name,
    //         });
    //       });
    //       console.log("influencerlist1");
    //       admininfluencerlist.push({
    //         id: doc.id,
    //         ...doc.data(),
    //         campaignmapping: localcampaignmapping,
    //         eventmapping: localeventmapping,
    //       });
    //       localcampaignmapping=[];
    //       localeventmapping=[];
    //       console.log("influencerlist2");

    //   });
    //   console.log("influencerlist4");
    //   // console.log("influencerlist1");

    //   // console.log("influencerlist", influencerlist);
    //   // influencerlist.map(item => {

    //   // })

    //   //brand
    //   const snapshotbrand = await Firebase.Brand.get();
    //   // let brandlist = [];
    //   let adminbrandlist = [];
    //   snapshotbrand.docs.map((doc) => {
    //     // if (doc.data().status === "new" || doc.data().status === "accepted") {
    //     //   brandlist.push({ id: doc.id, ...doc.data() });
    //     // }
    //     adminbrandlist.push({ id: doc.id, ...doc.data() });
    //   });

    //   res.status(200).json({
    //     campaignlist: admincampaignlist,
    //     influencerlist: admininfluencerlist,
    //     brandlist: adminbrandlist,

    //     eventlist: admineventlist,
    //     globalAdmin : globalAdmin,
    //     message: "Fetched Global Admin",
    //   });
    // }else
    if (getAdmin.data().admin) {
      //globalAdmin = false;
      //campaign
      console.log("step1");
      const snapshotCoupon = await Firebase.Coupons.get();
      let couponlist = [];
      snapshotCoupon.docs.map((doc) => {
        if (doc.data()?.isActive === 1) {
          couponlist.push({ id: doc.id, ...doc.data() });
        } else {
          //move
        }
      });
      console.log("step2");
      const snapshotCamp = await Firebase.Campaign.get();
      let campaignlist = [];
      let rawcampaignlist = [];
      snapshotCamp.docs.map((doc) => {
        if (doc.data()?.isActive === 1) {
          campaignlist.push({ id: doc.id, ...doc.data() });
        }
        rawcampaignlist.push({ id: doc.id, ...doc.data() });
      });
      console.log("step3");
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
      console.log("step4");
      //influencer
      const snapshotInfl = await Firebase.Influencer.get();
      let influencerlist = [];
      let localcampaignmapping = [];
      let localeventmapping = [];
      console.log("step5");
      snapshotInfl.docs.map((doc) => {
        // console.log("influencerlist5");
        if (doc.data().status === "new") {
          influencerlist.push({
            id: doc.id,
            ...doc.data(),
          });
        } else if (doc.data().status === "accepted") {
          console.log("influencerlist6");
          doc.data().campaignmapping.map((nesitem) => {
            console.log("influencerlist66");
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
          console.log("influencerlist7");
          doc.data().eventmapping.map((nesitem) => {
            localeventmapping.push({
              ...nesitem,
              name:
                raweventlist.filter((fun) => fun.id === nesitem.eventId)[0]
                  .name || "",
            });
          });
          console.log("influencerlist1");
          influencerlist.push({
            id: doc.id,
            ...doc.data(),
            campaignmapping: localcampaignmapping,
            eventmapping: localeventmapping,
          });
          console.log("influencerlist2");
        } else {
          console.log("influencerlist3");
        }
      });
      console.log("influencerlist4");
      // console.log("influencerlist1");

      // console.log("influencerlist", influencerlist);
      // influencerlist.map(item => {

      // })
      console.log("step6");
      //brand
      const snapshotbrand = await Firebase.Brand.get();
      let brandlist = [];
      let localinfluemapping = [];
      let locallaunchmapping = [];
      snapshotbrand.docs.map((doc) => {
        if (doc.data()?.status === "new") {
          brandlist.push({ id: doc.id, ...doc.data() });
        } else if (doc.data()?.status === "accepted") {
          doc.data().message.map((item) => {
            if (item.isShowAdmin === true) {
              locallaunchmapping.push(item);
            }
          });
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
          brandlist.push({
            id: doc.id,
            ...doc.data(),
            influencermapping: localinfluemapping,
            launchmapping: locallaunchmapping,
          });
        }
      });
      console.log("step7");
      const snapshotpinkskypopup = await Firebase.PinkskyPopup.get();
      let pinkskypopuplist = [];
      snapshotpinkskypopup.docs.map((doc) => {
        pinkskypopuplist.push({ id: doc.id, ...doc.data() });
      });
      console.log("step8");
      // console.log("brandlist", brandlist);
      res.status(200).json({
        campaignlist: campaignlist,
        influencerlist: influencerlist,
        brandlist: brandlist,
        eventlist: eventlist,
        pinkskypopuplist: pinkskypopuplist,
        couponlist: couponlist,
        // globalAdmin: globalAdmin,
        message: "Fetched Admin",
      });
    } else {
      //globalAdmin = false;
      res.status(401).json({ message: "Failed!" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//Get
//2.Influencer with doc id
app.get("/api/influencers", async (req, res) => {
  try {
    const snapshot = await Firebase.Influencer.get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // console.log(list)
    // console.log(list[0].imgURL1);

    res.status(200).json({ data: list, message: "Fetched Influencer" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//3.Brand with doc id
app.get("/api/brands", async (req, res) => {
  try {
    const snapshot = await Firebase.Brand.get();
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ data: list, message: "Fetched Brand" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.post("/api/brands/filter", async (req, res) => {
  let data = req.body;
  try {
    const snapshot = await Firebase.Brand.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;

    if (data.inputValue.toLowerCase() === "allbranddata") {
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
      // console.log("here");
      namesorted = list;
    }
    console.log("citysorted length", namesorted.length);

    res.status(200).json({ data: namesorted, message: "Filtered Brand" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.post("/api/events/filter", async (req, res) => {
  let data = req.body;
  try {
    const snapshot = await Firebase.Event.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;
    console.log("step 1");
    if (data.inputValue.toLowerCase() === "alleventdata") {
      namesorted = list;
    } else if (data.inputValue !== "") {
      console.log("step 2");
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
      // console.log("here");
      namesorted = list;
    }
    console.log("citysorted length", namesorted.length);

    res.status(200).json({ data: namesorted, message: "Filtered Event" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});
app.post("/api/coupons/filter", async (req, res) => {
  let data = req.body;
  try {
    const snapshot = await Firebase.Coupons.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;
    console.log("step 1");
    if (data.inputValue.toLowerCase() === "allcoupondata") {
      namesorted = list;
    } else if (data.inputValue !== "") {
      console.log("step 2");
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
      // console.log("here");
      namesorted = list;
    }
    console.log("namesorted length", namesorted.length);

    res.status(200).json({ data: namesorted, message: "Filtered Coupons" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//2.Filter Influencer
app.post("/api/influencer/filter", async (req, res) => {
  let data = req.body;
  // console.log(data);
  try {
    // console.log("req.body", req.body);
    const snapshot = await Firebase.Influencer.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;
    let agesorted;
    let gendersorted;
    let followersorted;
    let categorysorted;
    let citysorted;

    if (data.inputValue.toLowerCase() === "allinfluencerdata") {
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
      // console.log("here");
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
    // console.log("agesorted",agesorted);
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
    //console.log("gendersorted",gendersorted);
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
            // console.log(element.name);
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
    // console.log("citysorted", citysorted);
    console.log("citysorted length", citysorted.length);
    res.status(200).json({ data: citysorted, message: "Filtered Influencer" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//3.Filter Campaign
app.post("/api/campaign/filter", async (req, res) => {
  let data = req.body;
  // console.log(data);
  try {
    // console.log("req.body", req.body);
    const snapshot = await Firebase.Campaign.get();
    let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let namesorted;
    // let agesorted;
    // let gendersorted;
    // let followersorted;
    console.log("data", data);
    let categorysorted;
    let citysorted;
    let specialValuesorted;
    let brandcategorysorted;
    console.log("list length", list.length);
    if (data.inputValue.toLowerCase() === "allcampaigndata") {
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
      // console.log("here");
      namesorted = list;
    }
    // if (data.inputValue !== "") {
    //   namesorted = list.filter((item) => {
    //     if (
    //       item.name
    //         .toLowerCase()
    //         .indexOf(data.inputValue.toString().toLowerCase()) !== -1
    //     ) {
    //       return item;
    //     }
    //   });
    // } else {
    //   namesorted = list;
    // }
    console.log("namesorted length", namesorted.length);
    let selectedCategory = [];
    let mySetCategory = new Set();
    data.radioInfluencerValue
      .filter((item) => item.status === true)
      .map((categ) => selectedCategory.push(categ.label));
    if (selectedCategory[0] !== "All") {
      namesorted.map((element) => {
        element.category.filter((nesele) => {
          if (Object.values(nesele).some((r) => selectedCategory.includes(r))) {
            // console.log(element.name);
            mySetCategory.add(element);
          }
        });
      });
      categorysorted = Array.from(mySetCategory);
    } else {
      categorysorted = namesorted;
    }
    console.log("categorysorted length", categorysorted.length);
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
    console.log("citysorted length", citysorted.length);
    if (data.radioSpecialValue !== "All") {
      specialValuesorted = citysorted.filter((item) => {
        if (data.radioSpecialValue === "Pinksky Privilege") {
          return item.viewerDetails.pinkskyPrivilege === true;
        } else if (data.radioAgeValue === "Paid Privilege") {
          return item.viewerDetails.paidPrivilege === true;
        }
      });
    } else {
      specialValuesorted = citysorted;
    }
    console.log("specialValuesorted length", specialValuesorted.length);
    // if (data.radioBrandValue !== "All") {
    //   brandcategorysorted = specialValuesorted.filter((item) => {
    //     if (
    //       item.brandcategory
    //         .toLowerCase()
    //         .indexOf(data.radioBrandValue.toString().toLowerCase()) !== -1
    //     ) {
    //       return item;
    //     }
    //   });
    // } else {
    //   // console.log("here");
    //   brandcategorysorted = specialValuesorted;
    // }
    // // console.log("agesorted",agesorted);
    // if (data.radioGenderValue !== "All") {
    //   gendersorted = agesorted.filter((item) => {
    //     if (data.radioGenderValue === "Male") {
    //       return item.gender === "Male";
    //     } else if (data.radioGenderValue === "Female") {
    //       return item.gender === "Female";
    //     } else if (data.radioGenderValue === "Other") {
    //       return item.gender === "Other";
    //     }
    //   });
    // } else {
    //   gendersorted = agesorted;
    // }
    // //console.log("gendersorted",gendersorted);
    // if (data.radioFollowerValue !== "All") {
    //   followersorted = gendersorted.filter((item) => {
    //     if (data.radioFollowerValue === "greaterthan1M") {
    //       return item.instagram.followers > 1000000;
    //     } else if (data.radioFollowerValue === "greaterthan100K") {
    //       return item.instagram.followers > 100000;
    //     } else if (data.radioFollowerValue === "greaterthan20K") {
    //       return item.instagram.followers > 20000;
    //     } else if (data.radioFollowerValue === "greaterthan1000") {
    //       return item.instagram.followers > 1000;
    //     } else if (data.radioFollowerValue === "lessthan1000") {
    //       return item.instagram.followers <= 1000;
    //     }
    //   });
    // } else {
    //   followersorted = gendersorted;
    // }
    console.log("data.radioBrandValue", data.radioBrandValue);
    let brandselectedCategory = [];
    let myBrandSetCategory = new Set();
    data.radioBrandValue
      .filter((item) => item.status === true)
      .map((categ) => brandselectedCategory.push(categ.label));

    if (brandselectedCategory[0] !== "All") {
      specialValuesorted.map((element) => {
        // console.log(element);
        if (brandselectedCategory.includes(element.brandcategory)) {
          myBrandSetCategory.add(element);
        }

        // element.category.filter((nesele) => {
        //   if (Object.values(nesele).some((r) => brandselectedCategory.includes(r))) {
        //     // console.log(element.name);
        //     myBrandSetCategory.add(element);
        //   }
        // });
      });
      brandcategorysorted = Array.from(myBrandSetCategory);
    } else {
      brandcategorysorted = specialValuesorted;
    }
    // console.log("citysorted", citysorted);
    console.log("brandcategorysorted length", brandcategorysorted.length);
    res
      .status(200)
      .json({ data: brandcategorysorted, message: "Filtered Campaign" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//Post
//1.Influencer with login
app.post("/api/influencer/create", async (req, res) => {
  let influencerData = req.body;
  console.log("influencerData", req.body);
  const createUser = {
    email: influencerData.email,
    password: influencerData.password,
    name: "Influencer_" + influencerData.name + "_" + influencerData.surname,
  };
  console.log("createUser", createUser);
  try {
    //login here
    if (createUser.email != undefined && createUser.password != undefined) {
      const userResponse = await Firebase.admin.auth().createUser({
        email: createUser.email,
        password: createUser.password,
        emailVerified: false,
        disabled: false,
        displayName: createUser.name,
      });

      console.log("userResponse email", userResponse.email);
      // fetch instagram photos not engagement and not profile details
      if (userResponse.email != undefined && userResponse.uid != undefined) {
        let influencerSchema = null;
        const options = {
          method: "GET",
          url: process.env.RAPID_USERINFO_URL + influencerData.instagramurl,
          headers: {
            "X-RapidAPI-Key": process.env.RapidAPIKey,
            "X-RapidAPI-Host": process.env.RapidAPIHost,
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

              // let profileItemData = {
              //   id: "1",
              //   display_url: response.data.data.profile_pic_url_hd,
              // };

              // instagramPostDetails.push(profileItemData);
              response.data.data.edge_owner_to_timeline_media.edges.map(
                (item) => {
                  console.log(item);
                  sum =
                    sum +
                    item.node.edge_media_to_comment.count +
                    item.node.edge_liked_by.count;
                  if (count <= 4) {
                    console.log("item.node.shortcode", item.node.shortcode);
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

              let engagementRate =
                (sum / response.data.data.edge_followed_by.count) * 1000;
              influencerSchema = {
                ...influencerData,
                instagram: {
                  engagementRate: engagementRate,
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
          // res.send(401).json({ message: "Please Register With Public Instagram Account" });
          const err = new TypeError(
            "Please Register With Public Instagram Account"
          );
          throw err;
        } else {
          let interval = 8000;
          let lengthOfArray = instagramPostDetails.length - 1;
          let influencerArr = [];
          console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            setTimeout(() => {
              console.log("hi people", interval * index);

              const d = new Date();
              let month = d.getMonth() + 1;
              let date = d.getDate();
              let year = d.getFullYear();
              let time = d.getTime();
              const fileName =
                index +
                "_" +
                createUser.name +
                "_" +
                month +
                "_" +
                date +
                "_" +
                year +
                "_" +
                time +
                ".jpeg";
              let filePath = "./images/" + fileName;
              const options = {
                url: file.display_url,
                method: "GET",
              };
              console.log("fileName", fileName);
              let getDownloadURL = "";
              request(options, async (err, resp, body) => {
                if (resp.statusCode === 200) {
                  console.log("res.statusCode", resp.statusCode);
                  var bucket = Firebase.admin.storage().bucket();

                  await bucket.upload(filePath);
                  let fileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/${fileName}`;
                  console.log("------Here------");
                  console.log(fileFirebaseURL);
                  axios
                    .get(fileFirebaseURL)
                    .then((response) => {
                      getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/${fileName}?alt=media&token=${response.data.downloadTokens}`;
                      instagramPostDetails[index].new_url = getDownloadURL;
                      console.log("index", index);
                      fs.unlinkSync(filePath);
                      if (index === lengthOfArray) {
                        console.log("inside");

                        influencerSchema = {
                          ...influencerSchema,
                          imgURL1: instagramPostDetails[0].new_url,
                          imgURL2: instagramPostDetails[1].new_url,
                          imgURL3: instagramPostDetails[2].new_url,
                          imgURL4: instagramPostDetails[3].new_url,
                          imgURL5: instagramPostDetails[4].new_url,

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
                        console.log("influencerSchema", influencerSchema);
                        Firebase.Influencer.add(influencerSchema);
                        setTimeout(async () => {
                          console.log("inside2");
                          const snapshot = await Firebase.Influencer.get();
                          snapshot.docs.map((doc) => {
                            if (doc.data().email === createUser.email) {
                              influencerArr.push({ id: doc.id, ...doc.data() });
                            }
                          });

                          res.status(200).json({
                            message: {
                              displayName: createUser.name,
                              id: influencerArr[0].id,
                              email: createUser.email,
                              type: "Posted Influencer",
                            },
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
        }
      }
    }
  } catch (error) {
    console.log("error", error.message);
    res.status(500).json({ message: error.message });
  }
});

//2.Brand with login
app.post("/api/brand/create", async (req, res) => {
  let brandData = req.body;
  console.log("brandData", req.body);
  const createUser = {
    email: brandData.email,
    password: brandData.password,
    name: "Brand_" + brandData.companyname + "_" + brandData.name,
  };
  console.log("createUser", createUser);
  try {
    if (createUser.email != undefined && createUser.password != undefined) {
      const userResponse = await Firebase.admin.auth().createUser({
        email: createUser.email,
        password: createUser.password,
        emailVerified: false,
        disabled: false,
        displayName: createUser.name,
      });

      console.log("userResponse email", userResponse.email);
      if (userResponse.email != undefined && userResponse.uid != undefined) {
        let brandSchema = null;
        const options = {
          method: "GET",
          url: process.env.RAPID_USERINFO_URL + brandData.instagramurl,
          headers: {
            "X-RapidAPI-Key": process.env.RapidAPIKey,
            "X-RapidAPI-Host": process.env.RapidAPIHost,
          },
        };
        let instagramPostDetails = [];
        let onGoingStatus = 200;
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
          // res.status(401).json({ message: "Please Register With Public Instagram Account" });
          const err = new TypeError(
            "Please Register With Public Instagram Account"
          );
          throw err;
        } else {
          let interval = 8000;
          let lengthOfArray = instagramPostDetails.length - 1;
          let brandArr = [];
          console.log("lengthOfArray", lengthOfArray);
          instagramPostDetails.forEach((file, index) => {
            setTimeout(() => {
              console.log("hi people", interval * index);

              const d = new Date();
              let month = d.getMonth() + 1;
              let date = d.getDate();
              let year = d.getFullYear();
              let time = d.getTime();
              const fileName =
                index +
                "_" +
                createUser.name +
                "_" +
                month +
                "_" +
                date +
                "_" +
                year +
                "_" +
                time +
                ".jpeg";
              let filePath = "./images/" + fileName;
              const options = {
                url: file.display_url,
                method: "GET",
              };
              console.log("fileName", fileName);
              let getDownloadURL = "";
              request(options, async (err, resp, body) => {
                if (resp.statusCode === 200) {
                  console.log("res.statusCode", resp.statusCode);
                  var bucket = Firebase.admin.storage().bucket();

                  await bucket.upload(filePath);
                  let fileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/${fileName}`;
                  console.log("------Here------");
                  console.log(fileFirebaseURL);
                  axios
                    .get(fileFirebaseURL)
                    .then((response) => {
                      getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/pinksky-8804c.appspot.com/o/${fileName}?alt=media&token=${response.data.downloadTokens}`;
                      instagramPostDetails[index].new_url = getDownloadURL;
                      console.log("index", index);
                      fs.unlinkSync(filePath);
                      if (index === lengthOfArray) {
                        console.log("inside");
                        const customer = stripe.customers.create({
                          description: brandData.companyname,
                          email: brandData.email,
                        });
                        brandSchema = {
                          ...brandSchema,
                          customerid: customer.id,
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
                        console.log("inside2");

                        const snapshot = await Firebase.Brand.get();

                        snapshot.docs.map((doc) => {
                          if (doc.data().email === createUser.email) {
                            brandArr.push({ id: doc.id, ...doc.data() });
                          }
                        });

                        res.status(200).json({
                          message: {
                            displayName: createUser.name,
                            id: brandArr[0].id,
                            email: createUser.email,
                            type: "Posted Brand",
                          },
                        });
                      }, 4000);
                    })
                    .catch((error) => {
                      throw error;
                    });
                }
              }).pipe(fs.createWriteStream(filePath));
            }, index * interval);

            // if (response.data.data.is_private === false) {
            //   brandSchema = {
            //     ...brandData,
            //     imgURL: response.data.data.profile_pic_url_hd,
            //     instagram: {
            //       id: response.data.data.id,
            //       is_business_account: response.data.data.is_business_account,
            //       external_url: response.data.data.external_url,
            //       followers: response.data.data.edge_followed_by.count,
            //       edge_follow: response.data.data.edge_follow.count,
            //       is_private: response.data.data.is_private,
            //       is_verified: response.data.data.is_verified,
            //     },
            //     message: [
            //       { statusID: "100", influencerID: "", influencerName: "" },
            //     ],

            //     createdDate: new Date(),
            //     updatedDate: new Date(),
            //   };
            // }

            // if (brandSchema != null) {
            //   setTimeout(async () => {
            //     const response = await Firebase.Brand.add(brandSchema);
            //     // console.log("response", response.data);
            //     const snapshot = await Firebase.Brand.get();
            //     const brandData = [];
            //     snapshot.docs.map((doc) => {
            //       if (doc.data().email === createUser.email) {
            //         brandData.push({ id: doc.id, ...doc.data() });
            //       }
            //     });
            //     res.status(200).json({
            //       message: {
            //         displayName: createUser.name,
            //         id: brandData[0].id,
            //         email: createUser.email,
            //         type: "Posted Brand",
            //       },
            //     });
            //   }, 2000);
            // } else {
            //   res.status(401).json({ message: "Instagram Private account" });
            // }
            // }
            // })
            // .catch(function (error) {
            //   throw error;
            // });
          });
        }
      }
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error.message });
  }
});

//3.Campaign with firebase storage
app.post(
  "/api/campaign/create",
  Firebase.multer.single("file"),
  async (req, res) => {
    let { file, body } = req;
    let campaignFile = file;
    let campaignFileSplit = campaignFile.fileRef.metadata.id.split("/");
    let campaignFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}`;
    console.log("campaignFileSplit", campaignFileSplit);
    console.log("campaignFileFirebaseURL", campaignFileFirebaseURL);
    let getDownloadURL = "";
    await axios
      .get(campaignFileFirebaseURL)
      .then((response) => {
        getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
      })
      .catch((error) => {
        res.status(500).json({ message: error });
      });
    var object = JSON.parse(body.data);
    let campaignData = {
      ...object,
      getDownloadURL: getDownloadURL,
      createdDate: new Date(),
      updatedDate: new Date(),
    };
    try {
      setTimeout(async () => {
        const response = await Firebase.Campaign.add(campaignData);
        console.log("response", response.data);
        res.status(200).json({ message: "Posted Campaign" });
      }, 2000);
    } catch (error) {
      console.log("error", error);
      res.status(500).json({ message: error });
    }
  }
);

//4.Event with firebase storage
app.post(
  "/api/event/create",
  Firebase.multer.single("file"),
  async (req, res) => {
    let { file, body } = req;
    let eventFile = file;
    let eventFileSplit = eventFile.fileRef.metadata.id.split("/");
    let eventFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${eventFileSplit[0]}/o/${eventFileSplit[1]}`;
    console.log("eventFileSplit", eventFileSplit);
    console.log("eventFileFirebaseURL", eventFileFirebaseURL);
    let getDownloadURL = "";
    await axios
      .get(eventFileFirebaseURL)
      .then((response) => {
        getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${eventFileSplit[0]}/o/${eventFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
      })
      .catch((error) => {
        res.status(500).json({ message: error });
      });
    var object = JSON.parse(body.data);
    let eventData = {
      ...object,
      getDownloadURL: getDownloadURL,
      createdDate: new Date(),
      updatedDate: new Date(),
    };
    try {
      setTimeout(async () => {
        const response = await Firebase.Event.add(eventData);
        console.log("response", response.data);
        res.status(200).json({ message: "Posted Event" });
      }, 2000);
    } catch (error) {
      console.log("error", error);
      res.status(500).json({ message: error });
    }
  }
);

app.post(
  "/api/coupon/create",
  Firebase.multer.single("file"),
  async (req, res) => {
    let { file, body } = req;
    let couponFile = file;
    let couponFileSplit = couponFile.fileRef.metadata.id.split("/");
    let couponFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/${couponFileSplit[1]}`;
    console.log("couponFileSplit", couponFileSplit);
    console.log("couponFileFirebaseURL", couponFileFirebaseURL);
    let getDownloadURL = "";
    await axios
      .get(couponFileFirebaseURL)
      .then((response) => {
        getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${couponFileSplit[0]}/o/${couponFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
      })
      .catch((error) => {
        res.status(500).json({ message: error });
      });
    var object = JSON.parse(body.data);
    let couponData = {
      ...object,
      url: getDownloadURL,
      createdDate: new Date(),
      updatedDate: new Date(),
    };
    try {
      setTimeout(async () => {
        const response = await Firebase.Coupons.add(couponData);
        console.log("response", response.data);
        res.status(200).json({ message: "Posted coupon" });
      }, 2000);
    } catch (error) {
      console.log("error", error);
      res.status(500).json({ message: error });
    }
  }
);

app.post("/api/noninfluencer/create", async (req, res) => {
  let data = req.body;

  const createUser = {
    email: data.email,
    password: data.password,
    name: "Non_Influencer_" + data.name,
  };

  try {
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

        res.status(200).json({
          message: {
            displayName: createUser.name,
            id: noninfluencerArr[0].id,
            email: createUser.email,
            type: "Posted Non Influencer",
          },
        });

        // res.status(200).json({ message: "Posted Non Influencer" });
      }, 2000);
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
});

app.post("/api/pinkskypopupentry/create", async (req, res) => {
  let data = req.body;

  let pinkskypopupentryData = {
    ...data,
    createdDate: new Date(),
    updatedDate: new Date(),
  };
  try {
    setTimeout(async () => {
      const response = await Firebase.PinkskyPopup.add(pinkskypopupentryData);

      res.status(200).json({ message: "Posted PinkskyPopup" });
    }, 2000);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
});

app.post("/api/influencerpayment/create", async (req, res) => {
  let data = req.body;

  // let pinkskypopupentryData = {
  //   ...data,
  //   createdDate: new Date(),
  //   updatedDate: new Date(),
  // };
  console.log(data);
  try {
    const response = await Firebase.Influencer.doc(data.influencerid).get();
    let paymentdetails = {
      upi: data.upi,
      // bankname: data.bankname,
      // accountnumber: data.accountnumber,
      // ifsc: data.ifsc,
    };
    //.add(pinkskypopupentryData);
    await Firebase.Influencer.doc(data.influencerid).update({
      ...response.data(),
      paymentdetails,
    });
    res.status(200).json({ message: "Posted Influencer Payment" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error });
  }
});

app.post("/api/spreadsheet/influencer", async (req, res) => {
  //influencer
  // const snapshotInfl = await Firebase.Influencer.get();
  // let influencerlist = [];
  // snapshotInfl.docs.map((doc) => {
  //   influencerlist.push({ id: doc.id, ...doc.data() });
  // });
  // const snapshotInfl = await Firebase.Influencer.where('isActive', '==', 1).get();
  // console.log(snapshotInfl.data);
  // snapshotInfl.then(reponse => {
  //   console.log(reponse);
  // }).catch(error => {
  //   console.log(error)
  // })
  //if 0 then dont execute
  // clientBrand.create(influencerlist).then(
  //   function (data) {
  //     console.log(data);
  //   },
  //   function (err) {
  //     console.log(err);
  //   }
  // );
});

//Put
//1.Influencer by admin and profile page
app.put("/api/influencer/update", async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  const data = req.body;
  console.log(data);
  try {
    await Firebase.Influencer.doc(id).update(data);
    res.status(200).json({ message: "Updated Influencer" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.put("/api/brand/update", async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  const data = req.body;
  console.log(data);
  try {
    await Firebase.Brand.doc(id).update(data);
    res.status(200).json({ message: "Updated Brand" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//2.brand Mapping with influencer
app.put("/api/mappingbrandwithinfluencer/update", async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
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
    console.log("checkStatus", checkStatus);
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
      res.status(200).json({ message: "Updated Brand" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.put("/api/mappinginfluencerwithevent/update", async (req, res) => {
  const data = req.body;
  try {
    const snapshot = await Firebase.Influencer.doc(data.influencerId).get();
    let influencerData = [...snapshot.data().eventmapping];
    let influencerDataMessage = [...snapshot.data().message];
    console.log(data);

    console.log("step1");
    if (influencerData.find((item) => item.eventId === data.eventId)) {
      let objIndex = influencerData.findIndex(
        (obj) => obj.eventId == data.eventId
      );
      influencerData[objIndex].status = "new";
      influencerData[objIndex].eventId = data.eventId;
    } else {
      influencerData.push({
        eventId: data.eventId,
        status: "new",
      });
    }
    console.log("step2");

    const eventsnapshot = await Firebase.Event.doc(data.eventId).get();

    influencerDataMessage.push(...snapshot.data().message, {
      statusID: "300",
      eventId: data.eventId,
      eventName: eventsnapshot.data().name,
    });

    console.log("influencerData after ", {
      eventmapping: influencerData,
      message: influencerDataMessage,
    });
    await Firebase.Influencer.doc(data.influencerId).update({
      eventmapping: influencerData,
      message: influencerDataMessage,
    });
    res.status(200).json({ message: "Updated Influencer" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

//4.influencer Mapping with campaign
app.put("/api/mappinginfluencerwithcampaign/update", async (req, res) => {
  const data = req.body;
  try {
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
    console.log("influencerData before ", influencerData);
    const campaignsnapshot = await Firebase.Campaign.doc(data.campaignId).get();

    if (influencerData.find((item) => item.campaignId === data.campaignId)) {
      let objIndex = influencerData.findIndex(
        (obj) => obj.campaignId == data.campaignId
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

    console.log("influencerData after ", influencerData);
    await Firebase.Influencer.doc(data.influencerId).update({
      campaignmapping: influencerData,
      message: influencerDataMessage,
    });
    res.status(200).json({ message: "Updated Influencer" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.put("/api/mappinginfluencerwithcampaignlinks/update", async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    let snapshot = await Firebase.Influencer.doc(data.influencerId).get();

    const campaignsnapshot = await Firebase.Campaign.doc(data.campaignId).get();
    console.log("step1");
    let campaignmappinglocal = [];
    let influencerDataMessage = [
      ...snapshot.data().message,
      {
        statusID: "400",
        campaignID: data.campaignId,
        campaignName: campaignsnapshot.data().name,
      },
    ];
    // console.log("step2",camp.campaignId === data.campaignId);
    console.log("check", snapshot.data().campaignmapping);
    snapshot.data().campaignmapping.map((camp) => {
      console.log("step2");
      if (camp.campaignId === data.campaignId) {
        console.log("step3");
        let revnumber = camp.revision + 1 || 0;
        console.log(revnumber);
        if (revnumber === 0) {
          console.log("step4");
          campaignmappinglocal.push({
            ...camp,
            links: [{ url: data.links, revision: revnumber }],
            revision: revnumber,
            paymentStatus: "new",
          });
        } else {
          console.log("step5");
          campaignmappinglocal.push({
            ...camp,
            links: [...camp.links, { url: data.links, revision: revnumber }],
            revision: revnumber,
            paymentStatus: "new",
          });
        }
      } else {
        console.log("step6");
        campaignmappinglocal.push({ ...camp });
      }
    });

    console.log("campaignmapping", campaignmappinglocal);
    console.log("campaignmapping", influencerDataMessage);
    await Firebase.Influencer.doc(data.influencerId).update({
      campaignmapping: [...campaignmappinglocal],
      message: influencerDataMessage,
    });
    res.status(200).json({ message: "Updated Influencer with link" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});
app.put("/api/mappingbrandlaunch/update", async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    let snapshot = await Firebase.Brand.doc(data.brandid).get();
    let statusid = 0;
    if (data.name === "Launch Your Brand") {
      statusid = 103;
    } else if (data.name === "Organise A Blogger Meet") {
      statusid = 104;
    } else if (data.name === "Hire Us For A Promotional Event") {
      statusid = 105;
    } else if (data.name === "Guestlist Services") {
      statusid = 106;
    }
    if (statusid === 0) {
      res.status(500).json({ message: "Error in Mapping Brand with launch" });
    } else {
      let brandDataMessage = [
        ...snapshot.data().message,
        {
          statusID: statusid,
          launchName: data.name,
          createdData: new Date(),
          isShowAdmin: true,
          name: snapshot.data().companyname,
          brandid: data.brandid,
        },
      ];
      await Firebase.Brand.doc(data.brandid).update({
        message: brandDataMessage,
      });
      res.status(200).json({ message: "Mapped Brand with launch" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});
app.put("/api/mappinginfluencerhiremerequest/update", async (req, res) => {
  const data = req.body;
  console.log(data);
  try {
    let snapshot = await Firebase.Influencer.doc(data.influencerid).get();

    //const campaignsnapshot = await Firebase.Campaign.doc(data.campaignId).get();

    //let campaignmapping = [];
    let influencerDataMessage = [
      ...snapshot.data().message,
      {
        statusID: "103",
        influencerId: data.influencerid,
        influencerName: snapshot.data().name,
      },
    ];

    // snapshot.data().campaignmapping.map((camp) => {
    //   if (camp.campaignId === data.campaignId) {
    //     let revnumber = camp.revision + 1 || 0;
    //     console.log(revnumber);
    //     if (revnumber === 0) {
    //       campaignmapping.push({
    //         ...camp,
    //         links: [{ url: data.links, revision: revnumber }],
    //         revision: revnumber,
    //         paymentStatus: "new",
    //       });
    //     } else {
    //       campaignmapping.push({
    //         ...camp,
    //         links: [...camp.links, { url: data.links, revision: revnumber }],
    //         revision: revnumber,
    //         paymentStatus: "new",
    //       });
    //     }
    //   } else {
    //     campaignmapping.push(...camp);
    //   }
    // });

    // console.log("campaignmapping", campaignmapping);
    // console.log("campaignmapping", influencerDataMessage);
    await Firebase.Influencer.doc(data.influencerid).update({
      // campaignmapping: [...campaignmapping],
      isTeam: "new",
      message: influencerDataMessage,
    });
    res.status(200).json({ message: "Updated Influencer with link" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});
app.put("/api/acceptstatus/update", async (req, res) => {
  console.log("hello");
  const data = req.body;
  //var object = JSON.parse(data.data) || {};
  console.log("Here");
  try {
    //checked
    if (data.type === "influencerNewRequest") {
      const id = data.id;
      console.log(id);
      const snapshot = await Firebase.Influencer.get();
      let influencerData = [];
      snapshot.docs.map((doc) => {
        if (doc.id === id) {
          influencerData.push(...doc.data().message);
        }
      });
      influencerData.push({
        statusID: "101",
        campaignID: "",
        campaignName: "",
      });
      //message:[],
      await Firebase.Influencer.doc(id).update({
        status: "accepted",
        message: influencerData,
      });
      res.status(200).json({ message: "Accepted Influencer" });
    }
    //checked
    else if (data.type === "influencerCampaignRequest") {
      const data = req.body;
      // delete data.influencerId;

      const snapshot = await Firebase.Influencer.get();

      let influencerData = [];
      let influencerDataMessage = [];

      snapshot.docs.map((doc) => {
        // console.log("influencerData", doc.id);
        // console.log("influencerData2",  data.influencerId);

        if (doc.id === data.influencerid) {
          influencerData.push(...doc.data().campaignmapping);
          influencerDataMessage.push(...doc.data().message);
        }
      });

      let objIndex = influencerData.findIndex(
        (obj) => obj.campaignId == data.campaignid
      );

      influencerData[objIndex].status = "accepted";
      influencerData[objIndex].closingPrice = data.closingPrice;
      console.log("influencerData ", influencerData);
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
      res.status(200).json({ message: "Mapped Campaign with Influencer" });
    } else if (data.type === "influencerCampaignPaymentRequest") {
      console.log("inside influencerCampaignPaymentRequest");
      const data = req.body;
      // delete data.influencerId;

      const snapshot = await Firebase.Influencer.doc(data.influencerid).get();

      let influencerData = [...snapshot.data().campaignmapping];
      let influencerDataMessage = [...snapshot.data().message];

      // snapshot.docs.map((doc) => {
      //   // console.log("influencerData", doc.id);
      //   // console.log("influencerData2",  data.influencerId);

      //   if (doc.id === data.influencerid) {
      //     influencerData.push(...doc.data().campaignmapping);
      //     influencerDataMessage.push(...doc.data().message);
      //   }
      // });
      // campaignmapping.push({
      //   ...camp,
      //   paymentStatus: "rejected",
      // });
      console.log("inside influencerCampaignPaymentRequest 2");
      let objIndex = snapshot
        .data()
        .campaignmapping.findIndex((obj) => obj.campaignId == data.campaignid);

      influencerData[objIndex].paymentStatus = "accepted";
      // influencerData[objIndex].closingPrice = data.closingPrice;
      // console.log("influencerData ", influencerData);
      console.log("inside influencerCampaignPaymentRequest 3");
      const campaignsnapshot = await Firebase.Campaign.doc(
        data.campaignid
      ).get();
      console.log("inside influencerCampaignPaymentRequest 4");
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
      console.log("inside influencerCampaignPaymentRequest 5", influencerData);
      await Firebase.Influencer.doc(data.influencerid).update({
        campaignmapping: influencerData,
        message: influencerDataMessage,
      });
      res
        .status(200)
        .json({ message: "Mapped Payment Campaign with Influencer" });

      //update message status with closing price
      //
    }
    //checked
    // else if (object.type === "influencerCampaignPaymentRequest") {
    //   let campaignFile = req.file;
    //   let campaignFileSplit = campaignFile.fileRef.metadata.id.split("/");
    //   let campaignFileFirebaseURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}`;
    //   //console.log("campaignFileSplit", campaignFileSplit);
    //   //console.log("campaignFileFirebaseURL", campaignFileFirebaseURL);
    //   let getDownloadURL = "";
    //   await axios
    //     .get(campaignFileFirebaseURL)
    //     .then((response) => {
    //       getDownloadURL = `https://firebasestorage.googleapis.com/v0/b/${campaignFileSplit[0]}/o/${campaignFileSplit[1]}?alt=media&token=${response.data.downloadTokens}`;
    //     })
    //     .catch((error) => {
    //       res.status(500).json({ message: error });
    //     });
    //   // var object = JSON.parse(data);
    //   // console.log("object",object)
    //   // let campaignData = {
    //   //   ...object,
    //   //   getDownloadURL: getDownloadURL,
    //   //   createdDate: new Date(),
    //   //   updatedDate: new Date(),
    //   // };
    //   // data = {
    //   //   type: "influencerCampaignPaymentRequest",
    //   //   influencerid: props?.data.id,
    //   //   campaignid: props?.campaignDetails.campaignId,
    //   // };
    //   console.log("1");
    //   let snapshot = await Firebase.Influencer.doc(object.influencerid).get();

    //   const campaignsnapshot = await Firebase.Campaign.doc(
    //     object.campaignid
    //   ).get();
    //   console.log("2");
    //   let campaignmapping = [];

    //   snapshot.data().campaignmapping.map((camp) => {
    //     if (camp.campaignId === object.campaignid) {
    //       // let revnumber = camp.revision + 1 || 0;
    //       // console.log(revnumber);
    //       // if (revnumber === 0) {
    //       campaignmapping.push({
    //         ...camp,
    //         paymentURL: getDownloadURL,
    //         paymentStatus: "accepted",
    //       });
    //       // } else {
    //       //   campaignmapping.push({
    //       //     ...camp,
    //       //     links: [...camp.links, { url: data.links, revision: revnumber }],
    //       //     revision: revnumber,
    //       //     paymentStatus: "new",
    //       //   });
    //       //}
    //     } else {
    //       campaignmapping.push(...camp);
    //     }
    //   });
    //   console.log("3");
    //   let influencerDataMessage = [
    //     ...snapshot.data().message,
    //     {
    //       statusID: "401",
    //       campaignID: object.campaignid,
    //       campaignName: campaignsnapshot.data().name,
    //       paymentURL: getDownloadURL,
    //     },
    //   ];

    //   console.log("campaignmapping", {
    //     campaignmapping: [...campaignmapping],
    //     message: influencerDataMessage,
    //   });
    //   await Firebase.Influencer.doc(object.influencerid).update({
    //     campaignmapping: [...campaignmapping],
    //     message: influencerDataMessage,
    //   });
    //   res.status(200).json({ message: "Updated Influencer with payment" });
    // }
    else if (data.type === "brandNewRequest") {
      const id = req.body.id;
      const snapshot = await Firebase.Brand.get();
      let brandData = [];
      snapshot.docs.map((doc) => {
        if (doc.id === id) {
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
      res.status(200).json({ message: "Accepted Brand" });
    } else if (data.type === "influencerHireRequest") {
      const data = req.body;
      console.log(data);
      const snapshot = await Firebase.Brand.doc(data.brandid).get();
      let brandData = [...snapshot.data().influencermapping];
      let brandDataMessage = [...snapshot.data().message];
      console.log("step1");
      let objIndex = brandData.findIndex(
        (obj) => obj.influencerId == data.influencerid
      );
      brandData[objIndex].status = "accepted";
      const influencersnapshot = await Firebase.Influencer.doc(
        data.influencerid
      ).get();
      console.log("step2", influencersnapshot.data().name);
      brandDataMessage.push({
        statusID: "201",
        influencerID: data.influencerid,
        influencerName: influencersnapshot.data().name,
      });
      console.log("step3");
      await Firebase.Brand.doc(data.brandid).update({
        influencermapping: brandData,
        message: brandDataMessage,
      });
      res.status(200).json({ message: "Mapped Influencer with Brand" });
    }

    //working
    else if (data.type === "influencerEventRequest") {
      const data = req.body;
      const snapshot = await Firebase.Influencer.doc(data.influencerid).get();
      let influencerData = [];
      let influencerDataMessage = [];
      influencerData.push(...snapshot.data().eventmapping);
      influencerDataMessage.push(...snapshot.data().message);

      console.log("influencerData before", influencerData);
      let objIndex = influencerData.findIndex(
        (obj) => obj.eventId == data.eventid
      );
      influencerData[objIndex].status = "accepted";
      const eventsnapshot = await Firebase.Event.doc(data.eventid).get();

      influencerDataMessage.push({
        statusID: "301",
        eventId: data.eventid,
        eventName: eventsnapshot.data().name,
      });
      console.log("data", {
        eventmapping: influencerData,
        message: influencerDataMessage,
      });
      await Firebase.Influencer.doc(data.influencerid).update({
        eventmapping: influencerData,
        message: influencerDataMessage,
      });
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
      res.status(200).json({ message: "Updated Influencer Hiring" });
    } else if (data.type === "launchAcceptReject") {
      let snapshot = await Firebase.Brand.doc(data.details.brandid).get();

      let brandDataMessage = [...snapshot.data().message];
      // console.log("he1",brandDataMessage)
      // let getDate = new Date(data.details.createdData.seconds * 1000)
      let objIndex = brandDataMessage.findIndex(
        (obj) => obj.launchName == data.details.launchName
      );

      brandDataMessage[objIndex].isShowAdmin = false;
      console.log(brandDataMessage);
      await Firebase.Brand.doc(data.details.brandid).update({
        message: brandDataMessage,
      });
      res.status(200).json({ message: "Updated Message in Launch" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.put(
  "/api/acceptstatus/update/formdata",
  Firebase.multer.single("file"),
  async (req, res) => {
    console.log("hello");
    const data = req.body;
    var object = JSON.parse(data.data);
    console.log("Here");
    try {
      //checked
      if (object.type === "influencerCampaignPaymentRequest") {
        let campaignFile = req.file;
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
            res.status(500).json({ message: error });
          });
        // var object = JSON.parse(data);
        // console.log("object",object)
        // let campaignData = {
        //   ...object,
        //   getDownloadURL: getDownloadURL,
        //   createdDate: new Date(),
        //   updatedDate: new Date(),
        // };
        // data = {
        //   type: "influencerCampaignPaymentRequest",
        //   influencerid: props?.data.id,
        //   campaignid: props?.campaignDetails.campaignId,
        // };
        console.log("1");
        let snapshot = await Firebase.Influencer.doc(object.influencerid).get();

        // const campaignsnapshot = await Firebase.Campaign.doc(
        //   object.campaignid
        // ).get();
        // console.log("2");
        let campaignmapping = [];

        await snapshot.data().campaignmapping.map((camp) => {
          if (camp.paymentStatus === "initiated") {
            // let revnumber = camp.revision + 1 || 0;
            // console.log(revnumber);
            // if (revnumber === 0) {
            campaignmapping.push({
              ...camp,
              paymentURL: getDownloadURL,
              paymentStatus: "completed",
            });
            // } else {
            //   campaignmapping.push({
            //     ...camp,
            //     links: [...camp.links, { url: data.links, revision: revnumber }],
            //     revision: revnumber,
            //     paymentStatus: "new",
            //   });
            //}
          } else {
            campaignmapping.push(...camp);
          }
        });
        console.log("3");
        let influencerDataMessage = [];

        snapshot.data().message.map((item) => {
          if (item.statusID === "401") {
            influencerDataMessage.push({ ...item, paymentURL: getDownloadURL });
          } else {
            influencerDataMessage.push({ ...item });
          }
        }),
          // {
          //   statusID: "401",
          //   campaignID: object.campaignid,
          //   campaignName: campaignsnapshot.data().name,
          //   paymentURL: getDownloadURL,
          // },

          // console.log("campaignmapping", {
          //   campaignmapping: [...campaignmapping],
          //   message: influencerDataMessage,
          // });
          await Firebase.Influencer.doc(object.influencerid).update({
            campaignmapping: campaignmapping,
            message: influencerDataMessage,
          });
        res.status(200).json({ message: "Updated Influencer with payment" });
      }
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }
);

app.put("/api/rejectstatus/update", async (req, res) => {
  let data = req.body;
  console.log(req.body);
  try {
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
      res.status(200).json({ message: "Rejected Influencer" });
    } else if (data.type === "influencerCampaignRequest") {
      const data = req.body;
      // delete data.influencerId;

      const snapshot = await Firebase.Influencer.get();
      let influencerData = [];
      let influencerDataMessage = [];
      snapshot.docs.map((doc) => {
        if (doc.id === data.influencerid) {
          influencerData.push(...doc.data().campaignmapping);
          influencerDataMessage.push(...doc.data().message);
        }
      });
      console.log("influencerData before", influencerData);
      let objIndex = influencerData.findIndex(
        (obj) => obj.campaignId == data.campaignid
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
          // let revnumber = camp.revision + 1 || 0;
          // console.log(revnumber);
          // if (revnumber === 0) {
          campaignmapping.push({
            ...camp,
            paymentStatus: "rejected",
          });
          // } else {
          //   campaignmapping.push({
          //     ...camp,
          //     links: [...camp.links, { url: data.links, revision: revnumber }],
          //     revision: revnumber,
          //     paymentStatus: "new",
          //   });
          //}
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
      // console.log("campaignmapping", campaignmapping);
      // console.log("campaignmapping", influencerDataMessage);
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
      res.status(200).json({ message: "Rejected Brand" });
    } else if (data.type === "influencerHireRequest") {
      const data = req.body;

      const snapshot = await Firebase.Brand.doc(data.brandid).get();
      let brandData = [...snapshot.data().influencermapping];
      let brandDataMessage = [...snapshot.data().message];
      console.log("step1");
      let objIndex = brandData.findIndex(
        (obj) => obj.influencerId == data.influencerid
      );
      brandData[objIndex].status = "rejected";
      const influencersnapshot = await Firebase.Influencer.doc(
        data.influencerid
      ).get();
      console.log("step2", influencersnapshot.data().name);
      brandDataMessage.push({
        statusID: "202",
        influencerID: data.influencerid,
        influencerName: influencersnapshot.data().name,
      });
      console.log("step3");
      await Firebase.Brand.doc(data.brandid).update({
        influencermapping: brandData,
        message: brandDataMessage,
      });
      res.status(200).json({ message: "UnMapped Influencer with Brand" });
    } else if (data.type === "influencerEventRequest") {
      const data = req.body;
      const snapshot = await Firebase.Influencer.doc(data.influencerid).get();
      let influencerData = [];
      let influencerDataMessage = [];
      influencerData.push(...snapshot.data().eventmapping);
      influencerDataMessage.push(...snapshot.data().message);

      console.log("influencerData before", influencerData);
      let objIndex = influencerData.findIndex(
        (obj) => obj.eventId == data.eventid
      );
      influencerData[objIndex].status = "rejected";
      const eventsnapshot = await Firebase.Event.doc(data.eventid).get();

      influencerDataMessage.push({
        statusID: "302",
        eventId: data.eventid,
        eventName: eventsnapshot.data().name,
      });
      console.log("data", {
        eventmapping: influencerData,
        message: influencerDataMessage,
      });
      await Firebase.Influencer.doc(data.influencerid).update({
        eventmapping: influencerData,
        message: influencerDataMessage,
      });
      res.status(200).json({ message: "Rejected Event with Influencer" });
      // const data = req.body;
      // // delete data.influencerId;

      // const snapshot = await Firebase.Influencer.get();
      // let influencerData = [];
      // let influencerDataMessage = [];
      // snapshot.docs.map((doc) => {
      //   if (doc.id === data.influencerId) {
      //     influencerData.push(...doc.data().campaignmapping);
      //     influencerDataMessage.push(...doc.data().message);
      //   }
      // });
      // console.log("influencerData before", influencerData);
      // let objIndex = influencerData.findIndex(
      //   (obj) => obj.eventID == data.eventid
      // );
      // influencerData[objIndex].status = "rejected";
      // influencerDataMessage.push({
      //   statusID: "202",
      //   eventID: data.eventid,
      //   eventName: "",
      // });

      // await Firebase.Influencer.doc(data.influencerid).update({
      //   campaignmapping: influencerData,
      //   message: influencerDataMessage,
      // });
      // res.status(200).json({ message: "UnMapped Event with Influencer" });
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
      res.status(200).json({ message: "Updated Influencer Not Hiring" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.put("/api/removecampaign/update", async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  const data = { isActive: 0 };
  // console.log(data);
  try {
    await Firebase.Campaign.doc(id).update(data);
    res.status(200).json({ message: "Updated Campaign" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

app.put("/api/removeevent/update", async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  const data = { isActive: 0 };
  // console.log(data);
  try {
    await Firebase.Event.doc(id).update(data);
    res.status(200).json({ message: "Updated Event" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});
app.put("/api/removecoupon/update", async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  const data = { isActive: 0 };
  // console.log(data);
  try {
    await Firebase.Coupons.doc(id).update(data);
    res.status(200).json({ message: "Updated Coupon" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});
//Remove
// app.post("/api/delete", async (req, res) => {
//   const id = req.body.id;
//   await Firebase.Influencer.doc(id).delete();
//   res.send({ msg: "Deleted" });
// });

app.listen(PORT, () => console.log("Running @5000"));
