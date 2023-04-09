const { Firebase } = require("../config/firebaseconfig.js");
const PinkskyDB = require("../controller/PinkskyDB");
const pinkskyDB = new PinkskyDB();
const collectionArr = [
  Firebase.Influencer, //0
  Firebase.NonInfluencer, //1
  Firebase.Brand, //2
  Firebase.Campaign, //3
  Firebase.Coupons, //4
  Firebase.Event, //5
];
exports.fetchSingleData = async (index, id) => {
  // const snapshot = await pinkskyDB.filter(
  //   collectionArr[index],
  //   Firebase.docid,
  //   "==",
  //   id
  // );
  const snapshot = await collectionArr[index].doc(id).get();
  const data = await snapshot.data();
  return data;
};
exports.pinkskyAuth = async (snapshot, index, id) => {
  if (index < collectionArr?.length) {
    if (snapshot?.length > 0) {
      return snapshot;
    }
    snapshot = this.pinkskyAuth(
      await pinkskyDB.filter(collectionArr[index], Firebase.docid, "==", id),
      index + 1,
      id
    );
  }
  return snapshot;
};
exports.filteredData = async (index, obj) => {
  let snapshot = await pinkskyDB.filter(
    collectionArr[index],
    obj.field,
    obj.operation,
    obj.value
  );
  return snapshot;
};
exports.filteredDataLvl2 = async (index, obj) => {
  let snapshot = await pinkskyDB.filterlvl2(
    collectionArr[index],
    obj.field,
    obj.operation,
    obj.value,
    obj.field2,
    obj.operation2,
    obj.value2
  );
  return snapshot;
};
exports.filteredData = async (index, obj) => {
  let snapshot = await pinkskyDB.filter(
    collectionArr[index],
    obj.field,
    obj.operation,
    obj.value
  );
  return snapshot;
};
exports.orderedData = async (index, obj) => {
  let snapshot = await pinkskyDB.orderBy(
    collectionArr[index],
    obj.field,
    obj.operation,
    obj.limit
  );
  return snapshot;
};
exports.adminPinksky = async (trigger) => {
  //can be improved by making campaign,event and brand common influencers fetch at once
  const activeobj = {
    field: "isActive",
    operation: "==",
    value: 1,
  };
  const orderobj = {
    field: "createdDate",
    operation: "desc",
  };
  let influencerDataCheck = [];
  if (trigger == "influencerlist") {
    const infobj = {
      field: "createdDate",
      operation: "desc",
      limit: 10,
    };
    const influencerlist = await this.orderedData(0, infobj);
    return influencerlist;
  }
  if (trigger == "couponlist") {
    const couponlist = await this.filteredData(4, activeobj);
    return couponlist;
  }
  if (trigger == "campaignlist") {
    let campaignlist = await this.orderedData(3, orderobj);

    campaignlist.map((campaign) => {
      //console.log("campaign -> ", campaign.id);

      let im = campaign.userCampaignMapping.some((s) => s.statusID == "200");
      //campaign.isActive &&
      if (im) {
        campaign.userCampaignMapping.map((userCampaignMapping) => {
          if (userCampaignMapping.statusID == "200") {
            if (
              influencerDataCheck.length > 0 &&
              influencerDataCheck.some(
                (s) => s.id !== userCampaignMapping.influencerid
              )
            ) {
              influencerDataCheck.push(userCampaignMapping.influencerid);
            } else {
              influencerDataCheck.push(userCampaignMapping.influencerid);
            }
          }
        });
      }
    });
   // console.log("influencerDataCheck -> ", influencerDataCheck);
    const influencerBrandMappingObj = {
      field: Firebase.docid,
      operation: "in",
      value: [...new Set(influencerDataCheck)],
    };
    // let influencer = await Firebase.Influencer.getAll(...influencerDataCheck);
    let influencer = await this.filteredData(0, influencerBrandMappingObj);
    campaignlist.map((campaign, index) => {
      let im = campaign.userCampaignMapping.some((s) => s.statusID == "200");
      //campaign.isActive &&
      if (im) {
        campaign.userCampaignMapping.map((userCampaignMapping, index2) => {
          if (userCampaignMapping.statusID == "200") {
            const influencerdata = influencer.filter(
              (f) => f.id == userCampaignMapping.influencerid
            )[0];
            campaignlist[index].userCampaignMapping[index2].name =
              influencerdata.name;
            campaignlist[index].userCampaignMapping[index2].surname =
              influencerdata.surname;
            campaignlist[index].userCampaignMapping[index2].whatsappnumber =
              influencerdata.whatsappnumber;
            campaignlist[index].userCampaignMapping[index2].instagramurl =
              influencerdata.instagramurl;
            campaignlist[index].userCampaignMapping[index2].category =
              influencerdata.category;
            campaignlist[index].userCampaignMapping[index2].instagram = {
              followers: influencerdata.instagram.followers,
              engagementRate: influencerdata.instagram.engagementRate,
            };
          }
        });
      }
    });
    return campaignlist;
  }
  if (trigger == "eventlist") {
    let eventlist = await this.orderedData(5, orderobj);
    eventlist.map((event) => {
      let im = event.userEventMapping.some((s) => s.statusID == "300");
      //event.isActive &&
      if (im) {
        event.userEventMapping.map((userEventMapping) => {
          if (userEventMapping.statusID == "300") {
            if (
              influencerDataCheck.length > 0 &&
              influencerDataCheck.some(
                (s) => s.id !== userEventMapping.influencerid
              )
            ) {
              influencerDataCheck.push(userEventMapping.influencerid);
            } else {
              influencerDataCheck.push(userEventMapping.influencerid);
            }
          }
        });
      }
    });
    const influencerBrandMappingObj = {
      field: Firebase.docid,
      operation: "in",
      value: [...new Set(influencerDataCheck)],
    };
    // let influencer = await Firebase.Influencer.getAll(...influencerDataCheck);
    let influencer = await this.filteredData(0, influencerBrandMappingObj);
    eventlist.map((event, index) => {
      let im = event.userEventMapping.some((s) => s.statusID == "300");
      //event.isActive &&
      if (im) {
        event.userEventMapping.map((userEventMapping, index2) => {
          if (userEventMapping.statusID == "300") {
            const influencerdata = influencer.filter(
              (f) => f.id == userEventMapping.influencerid
            )[0];
            eventlist[index].userEventMapping[index2].name =
              influencerdata.name;
            eventlist[index].userEventMapping[index2].surname =
              influencerdata.surname;
            eventlist[index].userEventMapping[index2].whatsappnumber =
              influencerdata.whatsappnumber;
            eventlist[index].userEventMapping[index2].instagramurl =
              influencerdata.instagramurl;
            eventlist[index].userEventMapping[index2].category =
              influencerdata.category;
            eventlist[index].userEventMapping[index2].instagram = {
              followers: influencerdata.instagram.followers,
              engagementRate: influencerdata.instagram.engagementRate,
            };
          }
        });
      }
    });
    return eventlist;
  }
  if (trigger == "brandlist") {
    const brandobj = {
      field: "status",
      operation: "==",
      value: "accepted",
      field2: "influencermapping",
      operation2: "!=",
      value2: [],
    };
    const brandobjnew = {
      field: "status",
      operation: "==",
      value: "new",
    };
    let brandlist = await this.filteredDataLvl2(2, brandobj);
    let brandlistnew = await this.filteredData(2, brandobjnew);

    brandlist.map((brand) => {
      let im = brand.influencermapping.some((s) => s.status == "new");
      if (im) {
        brand.influencermapping.map(async (influencermapping) => {
          if (influencermapping.status == "new") {
            if (
              influencerDataCheck.length > 0 &&
              influencerDataCheck.some((s) =>
                s.id === undefined
                  ? true
                  : s.id !== influencermapping.influencerId
              )
            ) {
              influencerDataCheck.push(influencermapping.influencerId);
            } else {
              influencerDataCheck.push(influencermapping.influencerId);
            }
          }
        });
      }
    });
    const influencerBrandMappingObj = {
      field: Firebase.docid,
      operation: "in",
      value: [...new Set(influencerDataCheck)],
    };
    // let influencer = await Firebase.Influencer.getAll(...influencerDataCheck);
    let influencer = await this.filteredData(0, influencerBrandMappingObj);

    brandlist.map((brand, index) => {
      let im = brand.influencermapping.some((s) => s.status == "new");
      if (im) {
        brand.influencermapping.map(async (influencermapping, index2) => {
          if (influencermapping.status == "new") {
            const influencerdata = influencer.filter(
              (f) => f.id == influencermapping.influencerId
            )[0];
            brandlist[index].influencermapping[index2].name =
              influencerdata.name;
            brandlist[index].influencermapping[index2].surname =
              influencerdata.surname;
            brandlist[index].influencermapping[index2].phonenumber =
              influencerdata.phonenumber;
            brandlist[index].influencermapping[index2].whatsappnumber =
              influencerdata.whatsappnumber;
            brandlist[index].influencermapping[index2].instagramurl =
              influencerdata.instagramurl;
            brandlist[index].influencermapping[index2].email =
              influencerdata.email;
            brandlist[index].influencermapping[index2].category =
              influencerdata.category;
          }
        });
      }
    });
    return [...brandlist, ...brandlistnew];
  }
};
exports.spreadsheettofirebase = async (clientSpreadsheetToDB) => {
  let value = "";
  await clientSpreadsheetToDB.read().then(
    (data) => {
      value = JSON.parse(data);
    },
    (error) => {
      value = error;
    }
  );

  return value;
};
