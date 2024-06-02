const { getLastLocation, getLastLocationOfAll } = require("../../location/data");
const { GpsHistory } = require("../../location/data/gps");
const { vehicleStatus } = require("../../vehicles/constants");
const { Vehicle } = require("../../vehicles/data/vehicle-model");
const roles = require("../../_old/global_values/roles");
const { User } = require("../../_old/modules/user/model");

async function onUserGpsUpdate(socket, payload) {
    console.log(socket.user);
    console.log({ payload });
}

async function onFleetGpsRequest(socket, payload) {
    const authUser = socket.user;
    //check if authUser is authenticated to get whole fleet update 

    const allVechiles = await Vehicle.find({ status: { $ne: vehicleStatus.INACTIVE.key } });
    const getAllDrivers = await User.find({ role: roles.driver });

    const ids = [];
    const pushItem = (item) => { ids.push(item._id) }

    allVechiles.map(pushItem);
    getAllDrivers.map(pushItem);

    const lastLocations = await getLastLocationOfAll(ids);

    const result = {};
    lastLocations.map((item) => {
        result[item._id.toString()] = item.doc
    });
    socket.emit(EMIT_FLEET_GPS_UPDATE, result);
}


const EMIT_FLEET_GPS_UPDATE = "fleet-gps-update";

module.exports.EVENT_FLEET_GPS_REQUEST = "fleet-gps-request";
module.exports.EVENT_GPS_UPDATE = "event-gps-update"

module.exports.onFleetGpsRequest = (socket) => {
    return (payload) => onFleetGpsRequest(socket, payload);
};

module.exports.onUserGpsUpdate = (socket) => {
    return (payload) => onUserGpsUpdate(socket, payload);
};