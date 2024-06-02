const { ObjectId } = require("mongodb");
const { trpStat } = require("../../global_values/status");
const { Driver } = require("../../mid_models/driver");
const { Car } = require("../car/model");
const { Trip } = require("../trip/model");

async function driverHistory(req, res) {
  const { accountId } = req.params;

  const { dateStart, dateEnd } = req.query;

  const driver = await Driver.findOne({ "user.account_id": accountId });
  // const currentCar = await Car.findOne({ "driver.user.account_id": accountId });

  const tripsFilter = {
    driver_id: new ObjectId(accountId),
    status: "DONE",
  };

  if (dateStart != null || dateEnd != null) {
    tripsFilter.gmt_for_date = {
      $gte: dateStart,
      $lte: dateEnd,
    };
    if (tripsFilter.gmt_for_date.$gte == null)
      delete tripsFilter.gmt_for_date.$gte;
    if (tripsFilter.gmt_for_date.$lte == null)
      delete tripsFilter.gmt_for_date.$lte;
  }

  const driverTrips = await Trip.find(tripsFilter);

  const stats = {
    total_distance: 0,
    total_interval: 0,
    total_distance_actual: 0,
    total_interval_actual: 0,
  };
  const trip_report = {};
  driverTrips.map((trip) => {
    if (trip_report[trip.for_date] == null) {
      trip_report[trip.for_date] = {
        distance: 0,
        interval: 0,
        distance_actual: 0,
        interval_actual: 0,
      };
    }

    trip_report[trip.for_date].distance += trip.distance_props?.distance || 0;
    trip_report[trip.for_date].interval += trip.distance_props?.interval || 0;
    trip_report[trip.for_date].distance_actual +=
      trip.distance_props?.distance_actual || 0;
    trip_report[trip.for_date].interval_actual +=
      trip.distance_props?.interval_actual || 0;

    stats.total_distance += trip.distance_props.distance || 0;
    stats.total_interval += trip.distance_props.interval || 0;
    stats.total_distance_actual += trip.distance_props.distance_actual || 0;
    stats.total_interval_actual += trip.distance_props.interval_actual || 0;
  });

  return res.status(200).send({
    driver,
    // currentCar,
    trip_report,
    stats,
  });
}

module.exports = {
  driverHistory,
};
