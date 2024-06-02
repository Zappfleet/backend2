const permissions = require("../../global_values/permissions");
const roles = require("../../global_values/roles");
const auth = require("../../middleware/auth");
const { can, canRole } = require("../../middleware/can");
const { paramObjectId } = require("../../middleware/param_object_id");
const { User } = require("../user/model");
const {
  createCarValidator,
  updateDriverLocatioValidator,
  updateCarValidator,
} = require("./schema_validator");
const {
  createCar,
  updateCar,
  getCars,
  getCar,
  saveDriverLocation,
  getActiveCars,
  deleteCar,
  createSnapTaxi,
  updateSnapTaxi,
  getCarDetailed,
} = require("./service");

module.exports = {
  configure(app) {
    app.get("/car", auth, can("GET", permissions.GET.acCrLs), getCars);
    app.get("/car-with-paginate", auth, can("GET", permissions.GET.crLs), getActiveCars);
    app.get(
      "/car/:id",
      auth,
      can("GET", permissions.GET.crDt),
      paramObjectId,
      getCar
    );
    app.get(
      "/car/:id/detailed",
      auth,
      can("GET", permissions.GET.crDt),
      paramObjectId,
      getCarDetailed
    );
    app.put(
      "/car/:id",
      auth,
      can("PUT", permissions.PUT.car),
      updateCarValidator,
      updateCar
    );
    app.delete(
      "/car/:id",
      auth,
      can("DELETE", permissions.DELETE.car),
      deleteCar
    );
    app.post(
      "/car",
      auth,
      can("POST", permissions.POST.cr),
      createCarValidator,
      createCar
    );
    app.post(
      "/car/snapp-taxi",
      auth,
      can("POST", permissions.POST.cr),
      // createCarValidator,
      createSnapTaxi
    );
    app.put(
      "/car/snapp-taxi/:id",
      auth,
      can("PUT", permissions.PUT.car),
      // createCarValidator,
      updateSnapTaxi
    );
    app.put(
      "/car/me/location",
      auth,
      canRole([roles.driver]),
      updateDriverLocatioValidator,
      saveDriverLocation
      // async (req, res) => {
        // res.status(200).send({ info: "sucess", doc: "" });
      // }
    );
    app.put(
      "/car/me/location/25f4g6g4u8fkylhfjdgfPdjfbv2d54fd4",
      loadUserById,
      async (req, res) => {
        res.status(200).send({ info: "sucess", doc: "" });
      }
    );
  },
};

async function loadUserById(req, res, next) {
  const user = await User.findById(req.body.user_id);
  req.user = user;
  next();
}
