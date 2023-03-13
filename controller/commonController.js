module.exports = {
  add: (schema, data) => {
    return new Promise(function (resolve, reject) {
      var addSchema = new schema(data);
      addSchema
        .save()
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error : ", error);
          reject(error);
        });
    });
  },
  insertManyDoc: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .insertMany(object)
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },
  getAll: (schema) => {
    return new Promise(function (resolve, reject) {
      schema
        .find({
          status: {
            $ne: "deleted",
          },
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error :", error);
          reject(error);
        });
    });
  },

  getAllBySortPagination: (schema, object, query) => {
    return new Promise(function (resolve, reject) {
      let limit = query.limit ? query.limit : 10;
      let value = query.value ? query.value : -1;
      schema
        .find({ ...object, status: { $ne: "deleted" } })
        .collation({ locale: "en" })
        .sort({ [query.field]: value })
        .skip((query.page - 1) * limit)
        .limit(limit * 1)
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error :", error);
          reject(error);
        });
    });
  },

  getAllSortReverse: (schema) => {
    return new Promise(function (resolve, reject) {
      schema
        .find({
          status: {
            $ne: "deleted",
          },
        })
        .sort({
          _id: -1,
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error :", error);
          reject(error);
        });
    });
  },

  getBy: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .find({
          ...object,
          status: {
            $ne: "deleted",
          },
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getBySortReverse: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .find({
          ...object,
          status: {
            $ne: "deleted",
          },
        })
        .sort({
          _id: -1,
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getOne: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .findOne({
          ...object,
          status: {
            $ne: "deleted",
          },
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  updateBy: (schema, id, data) => {
    return new Promise(function (resolve, reject) {
      schema
        .findByIdAndUpdate(
          {
            _id: id,
          },
          data,
          {
            $new: true,
          }
        )
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  updateWithObject: (schema, object, data) => {
    return new Promise(function (resolve, reject) {
      schema
        .findOneAndUpdate(object, data, {
          $new: true,
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error :", error);
          reject(error);
        });
    });
  },

  delete: (schema, id) => {
    return new Promise(function (resolve, reject) {
      schema
        .findByIdAndUpdate(
          {
            _id: id,
          },
          {
            status: "deleted",
          },
          {
            $new: true,
          }
        )
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error : ", error);
          reject(error);
        });
    });
  },

  getWithSortBy: (schema, object, sort) => {
    return new Promise(function (resolve, reject) {
      schema
        .find({
          ...object,
          status: {
            $ne: "deleted",
          },
        })
        .sort(sort)
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  getWithSortByPopulate: (schema, populates) => {
    console.log("object");
    return new Promise(function (resolve, reject) {
      schema
        .find({})
        .populate(populates)
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  getWithReverseSortByPopulate: (schema, populates) => {
    console.log("object");
    return new Promise(function (resolve, reject) {
      schema
        .find({})
        .populate(populates)
        .sort({
          _id: -1,
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  getSingleRecordByPopulate: (schema, object, populates) => {
    console.log("object");
    return new Promise(function (resolve, reject) {
      schema
        .findOne(object)
        .populate(populates)
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  count: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .countDocuments({
          ...object,
          status: {
            $ne: "deleted",
          },
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  deleteWithObject: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .findOneAndUpdate({ ...object }, { status: "deleted" })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  deletePRM: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .findOneAndDelete({
          ...object,
        })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log("error", error);
          reject(error);
        });
    });
  },

  getBySearch: (schema, object) => {
    return new Promise(function (resolve, reject) {
      schema
        .find({ object, status: { $eq: "active" } })
        .then((resData) => {
          resolve(resData);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  },
};
