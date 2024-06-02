const auth = require("../../middleware/auth");
const {
  createTripValidator,
  assignCarToTripvalidator,
  reviewTripValidator,
  sendTravelledDistanceValidator,
  dispatcherCreateTripValidator,
} = require("./schema_validator");
const {
  getTrips,
  createTrip,
  assignCarToTrip,
  getTrip,
  getSelfTrips,
  getSelfTrip,
  deleteTripCar,
  cancelTrip,
  deleteTripRequest,
  reviewTrip,
  sendTravelledDistance,
  cancelSelfTrip,
  addRequestToTripDraft,
  deleteTrip,
  createDispatcherTrip,
  updateDispatcherTrip,
  updateTripCost,
  notifyRequestUser,
  forceEndTrip
} = require("./service");
const { can } = require("../../middleware/can");
const { checkTripRequests } = require("./middleware");
const permissions = require("../../global_values/permissions");
const { paramObjectId } = require("../../middleware/param_object_id");
const { checkSpecificity } = require("../request/middleware");
const { User } = require("../user/model");

module.exports = {
  configure(app) {

    app.put(
      "/trip/:id/update-cost",
      auth,
      can("PUT", permissions.PUT.trp),
      updateTripCost
    )

    app.post(
      "/trip",
      auth,
      can("POST", permissions.POST.trpDrft),
      createTripValidator,
      checkTripRequests,
      createTrip
    );

    app.post(
      "/trip/dispatcher",
      auth,
      can("POST", permissions.POST.trpDrft),
      dispatcherCreateTripValidator,
      // checkSpecificity,
      createDispatcherTrip
    );

    app.post("/trip/notify-request-user",
      auth,
      notifyRequestUser)

    app.get(
      "/trip",
      auth,
      can("GET", permissions.GET.trpLs),
      getTrips
    );

    app.get(
      "/trip/me",
      auth,
      can("GET", permissions.GET.slTrpLs),
      getSelfTrips
    );

    app.get(
      "/trip/:id",
      auth,
      can("GET", permissions.GET.trpDt),
      paramObjectId,
      getTrip
    );

    app.get(
      "/trip/me/:id/",
      auth,
      can("GET", permissions.GET.slTrpDt),
      paramObjectId,
      getSelfTrip
    );

    //PUT
    app.put(
      "/trip/:id/cancel",
      auth,
      can("PUT", permissions.PUT.trp),
      paramObjectId,
      cancelTrip
    );
    app.put(
      "/trip/dispatcher/:id",
      auth,
      can("PUT", permissions.PUT.trpDrft),
      // dispatcherCreateTripValidator,
      // checkSpecificity,
      updateDispatcherTrip
    );

    app.post(
      "/trip/dispatcher/:id/force-end",
      auth,
      can("PUT", permissions.PUT.trpDrft),
      forceEndTrip
    );

    app.put(
      "/trip/me/:id/cancel",
      auth,
      can("PUT", permissions.PUT.slTr),
      paramObjectId,
      cancelSelfTrip
    );

    app.put(
      "/trip/me/:id/distance",
      auth,
      can("PUT", permissions.PUT.slTr),
      paramObjectId,
      sendTravelledDistanceValidator,
      sendTravelledDistance
      // async (req, res) => {
        // res.status(200).send({ info: "sucess", doc: "" });
      // }
    );

    app.put(
      "/trip/me/:id/distance/skjhsdhuw5s74disudkdnn25ej",
      loadUserById,
      paramObjectId,
      async (req, res) => {
        res.status(200).send({ info: "sucess", doc: "" });
      }
      // sendTravelledDistance
    );

    app.put(
      "/trip/me/:id/review",
      auth,
      can("PUT", permissions.PUT.slTr),
      paramObjectId,
      reviewTripValidator,
      reviewTrip
    );

    app.put(
      "/trip/:id/car/add",
      auth,
      can("PUT", permissions.PUT.trp),
      paramObjectId,
      assignCarToTripvalidator,
      assignCarToTrip
    );

    app.put(
      "/trip/:id/request/:request_id/add",
      auth,
      can("PUT", permissions.PUT.trp),
      paramObjectId,
      addRequestToTripDraft
    );
    // app.put(
    //   "/trip/:id/review",
    //   auth,
    //   can("PUT", permissions.PUT.slTr),
    //   paramObjectId,
    //   reviewTrip
    // );

    //DELETE

    // //for admins
    // app.get(
    //   "/trip",
    //   auth,
    //   can("GET", 0),
    //   getSingleRequestValidator,
    //   getUserRoleSpecificRequest
    // );
    // app.get(
    //   "/trip/:id",
    //   auth,
    //   can("GET", 0),
    //   getSingleRequestValidator,
    //   getUserRoleSpecificRequest
    // );
    // app.post(
    //   "/trip",
    //   auth,
    //   can("GET", 0),
    //   getSingleRequestValidator,
    //   getUserRoleSpecificRequest
    // );
    // app.put(
    //   "/trip/:id",
    //   auth,
    //   can("GET", 0),
    //   getSingleRequestValidator,
    //   getUserRoleSpecificRequest
    // );
    app.delete(
      "/trip/:id",
      auth,
      can("DELETE", permissions.DELETE.trp),
      deleteTrip
    );

    //Delete
    app.delete(
      "/trip/:id/request/:request_id/delete",
      auth,
      can("DELETE", permissions.DELETE.trp),
      paramObjectId,
      deleteTripRequest
    );
    app.delete(
      "/trip/:id/car/delete",
      auth,
      can("PUT", permissions.PUT.trp),
      paramObjectId,
      deleteTripCar
    );
  },
};

async function loadUserById(req, res, next) {
  const user = await User.findById(req.body.user_id);
  req.user = user;
  next();
}
