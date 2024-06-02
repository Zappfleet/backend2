const { carNameCode } = require("../../global_values/name_code");


const getGlobalValues = async (req, res, next) => {
  res.send({
    info: "success",
    doc: {
      carNameCode,
    
    },
  });
};

exports.getGlobalValues = getGlobalValues;
