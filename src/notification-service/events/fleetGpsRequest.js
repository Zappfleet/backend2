const { getLastLocation, getLastLocationOfAll, pushLocationIfFarEnough } = require("../../favoriteLocation/routes/favoriteLocations-controller");
const { GpsHistory } = require("../../favoriteLocation/model/gps");
const { vehicleStatus } = require("../../vehicles/constants");
const { Vehicle } = require("../../vehicles/data/vehicle-model");
const roles = require("../../_old/global_values/roles");
const { User } = require("../../_old/modules/user/model");
const { default: mongoose } = require("mongoose");


//sgh soket get gps written ago
async function onUserGpsUpdate(socket, payload) {
    // console.log('Received GPS data:', payload);
   // console.log(104);
    try {
        // payload is a JSON array
        const locations = JSON.parse(payload);

        locations?.map(async (location) => {
            await pushLocationIfFarEnough(location.ownerID, location.lng, location.lat, new Date(), 70)
            //console.log('Fake data inserted');
        });

    } catch (error) {
        console.error('Error parsing payload:', error);
    }

}

async function onFleetGpsRequest(socket, payload) {
    try {
        const myPayload = JSON.parse(payload);

        let result = [];
        if (Array.isArray(myPayload?.ownerID) && myPayload.ownerID.length > 0) {
            const ownerId = new mongoose.Types.ObjectId(myPayload.ownerID[0]);
            result = await GpsHistory.find({ owner_id: ownerId });
        } else if (myPayload?.ownerID === 'All') {
            result = await GpsHistory.find({});
        }

        socket.emit(EMIT_FLEET_GPS_UPDATE, result);
    } catch (error) {
        console.log(122, 'problem in onFleetGpsRequest', error);
    }
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