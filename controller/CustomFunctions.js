const { Firebase } = require("../config/firebaseconfig.js");
const PinkskyDB = require("../controller/PinkskyDB");
const pinkskyDB = new PinkskyDB();
const collectionArr = [
  Firebase.Influencer,
  Firebase.NonInfluencer,
  Firebase.Brand,
  Firebase.Campaign,
];
exports.pinkskyAuth = async (snapshot, index, id) => {
  if (index < collectionArr.length) {
    if (snapshot.length > 0) {
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

exports.adminPinksky = async (index, obj) => {
  //[],0
//   let snapshot = await pinkskyDB.filter(
//     collectionArr[index],
//     obj.field,
//     obj.operation,
//     obj.value
//   );
  let snapshot2 = await pinkskyDB.filterlvl2(
    collectionArr[index],
    obj.field,
    obj.operation,
    obj.value,
    obj.field2,
    obj.operation2,
    obj.value2
  );
  //   .filter(
  //     collectionArr[index],
  //     "userCampaignMapping",
  //     "!=",
  //     []
  //   );

  //infl -> add campaign+events
  console.log(snapshot2.length);

  return snapshot2;
};
