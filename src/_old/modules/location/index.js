const permissions = require("../../global_values/permissions");
const { can } = require("../../middleware/can");
const auth = require("../../middleware/auth");
const {
  searchLocations,
  createLocation,
  getSelfLocations,
  getLocations,
  deleteLocation,
  deleteSelfLocation,
} = require("./service");
const { createLocationValidator } = require("./schema_validator");
const { paramObjectId } = require("../../middleware/param_object_id");

module.exports = {
  configure(app) {
    //GET
    app.get(
      "/location/search",
      auth,
      can("GET", permissions.GET.srchLcs),
      searchLocations
    );
    app.get(
      "/location/me",
      auth,
      can("GET", permissions.GET.slLc),
      getSelfLocations
    );
    app.get("/location", auth, can("GET", permissions.GET.lcs), getLocations);
    //POST
    app.post(
      "/location",
      auth,
      can("POST", permissions.POST.slLc),
      createLocationValidator,
      createLocation
    );
    app.delete(
      "/location/:id",
      auth,
      paramObjectId,
      can("DELETE", permissions.DELETE.lc),
      deleteLocation
    );
    app.delete(
      "/location/me/:id",
      auth,
      paramObjectId,
      can("DELETE", permissions.DELETE.slLc),
      deleteSelfLocation
    );
  },
};
