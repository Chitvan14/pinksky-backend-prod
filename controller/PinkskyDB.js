module.exports = class PinkskyDB {
  constructor() {}
  async filter(type, field, operation, value) {
    const snpashot = await type.where(field, operation, value).get();
    let getFilteredArray = [];
    snpashot.docs.map((doc) => {
      getFilteredArray.push({ id: doc.id, ...doc.data() });
    });
    return getFilteredArray;
  }
  async filterlvl2(type, field, operation, value, field2, operation2, value2) {
    console.log(field, operation, value, field2, operation2, value2);
    const snpashot = await type
      .where(field, operation, value)
      .where(field2, operation2, value2)
      .get();
    let getFilteredArray = [];
    snpashot.docs.map((doc) => {
      getFilteredArray.push({ id: doc.id, ...doc.data() });
    });

    return getFilteredArray;
  }
};
