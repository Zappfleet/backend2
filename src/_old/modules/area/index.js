const permissions = require("../../global_values/permissions");
const auth = require("../../middleware/auth");
const { can } = require("../../middleware/can");
const { paramObjectId } = require("../../middleware/param_object_id");
const { checkSpecificity, maxDispatcherNumber } = require("./middleware");
const {
  createAreaValidator,
  assignDispatcherValidator,
} = require("./schema_validator");
const {
  creatArea,
  updateArea,
  deleteArea,
  assignDispatcher,
  getAreas,
  getArea,
} = require("./service");

module.exports = {
  configure(app) {
    app.get("/area", auth, can("GET", permissions.GET.arls), getAreas);
    app.get("/area/:id", auth, can("GET", permissions.GET.arDt), getArea);
    app.post(
      "/area",
      auth,
      can("POST", permissions.POST.ar),
      createAreaValidator,
      checkSpecificity,
      creatArea
    );
    app.put(
      "/area/:id",
      auth,
      can("PUT", permissions.PUT.ar),
      createAreaValidator,
      checkSpecificity,
      updateArea
    );
    app.delete("/area/:id",
      auth,
      can("DELETE", permissions.DELETE.ar),
      deleteArea
    );
    app.put(
      "/area/:id/dispatcher",
      auth,
      can("PUT", permissions.PUT.asArDsp),
      paramObjectId,
      assignDispatcherValidator,
      maxDispatcherNumber,
      assignDispatcher
    );
  },
};
