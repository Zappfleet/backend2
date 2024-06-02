const roles = require("../../global_values/roles");
const { getGlobalValues } = require("./service");
const { canRole } = require("../../middleware/can");
const auth = require("../../middleware/auth");

module.exports = {
  configure(app) {
    app.get("/var", auth, getGlobalValues);
  },
};
