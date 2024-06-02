const roles = require("../../global_values/roles");
const auth = require("../../middleware/auth");
const { canRole } = require("../../middleware/can");
const { saveRestrictionٰValidator } = require("./restriction.schema");
const { saveRestriction, getRestriction } = require("./restriction.service");

module.exports = {
  configure(app) {
    //POST
    app.post(
      "/restriction",
      auth,
      canRole([roles.admin]),
      saveRestrictionٰValidator,
      saveRestriction
    );
    app.get(
      '/restriction',
       auth,
      canRole([roles.admin]),
      getRestriction,
      )
  }
};
