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
  async orderBy(type, field, operation, lim) {
    let snapshot = await type.orderBy(field, operation);
    if (lim) {
      snapshot = await snapshot.limit(lim).get();
    } else {
      snapshot = await snapshot.get();
    }
    let getOrderedArray = [];
    snapshot.docs.map((doc) => {
      getOrderedArray.push({ id: doc.id, ...doc.data() });
    });
    return getOrderedArray;
  }
  async getAll(type) {
    const snapshot = await type.get();
    let getAllArray = [];
    snapshot.docs.map((doc) => {
      getAllArray.push({ id: doc.id, ...doc.data() });
    });
    return getAllArray;
  }
  async filterlvl2AndLimit(
    type,
    field,
    operation,
    value,
    field2,
    operation2,
    value2,
    lim
  ) {
    let snapshot = await type
      .where(field, operation, value)
      .where(field2, operation2, value2);
    if (lim) {
      snapshot = await snapshot.limit(lim).get();
    } else {
      snapshot = await snapshot.get();
    }
    let getFilteredArray = [];
    snapshot.docs.map((doc) => {
      getFilteredArray.push({ id: doc.id, ...doc.data() });
    });

    return getFilteredArray;
  }
};
