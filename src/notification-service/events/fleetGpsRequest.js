const { getLastLocation, getLastLocationOfAll, pushLocationIfFarEnough } = require("../../favoriteLocation/routes/favoriteLocations-controller");
const { GpsHistory } = require("../../favoriteLocation/model/gps");
const { vehicleStatus } = require("../../vehicles/constants");
const { Vehicle } = require("../../vehicles/data/vehicle-model");
const roles = require("../../_old/global_values/roles");
const { User } = require("../../_old/modules/user/model");


//sgh soket get gps written ago
async function onUserGpsUpdate(socket, payload) {
   // console.log('Received GPS data:', payload);
    console.log(104);
    try {
        // payload is a JSON array
        const locations = JSON.parse(payload);

        locations?.map(async (location) => {
            await pushLocationIfFarEnough('-1',location.lng, location.lat, '2023-06-18T10:00:00Z',70)
            //console.log('Fake data inserted');
        });

    } catch (error) {
        console.error('Error parsing payload:', error);
    }

}

async function onFleetGpsRequest(socket, payload) {
    console.log(105);
    const authUser = socket.user;
    //check if authUser is authenticated to get whole fleet update 

    const allVechiles = await Vehicle.find({ status: { $ne: vehicleStatus.INACTIVE.key } });
    const getAllDrivers = await User.find({ role: 2 });


    const ids = [];
    const pushItem = (item) => { ids.push(item._id) }

    allVechiles.map(pushItem);
    getAllDrivers.map(pushItem);

    const lastLocations = await getLastLocationOfAll(ids);
    //console.log(3, lastLocations);
    const result = {};
    lastLocations.map((item) => {
        result[item._id.toString()] = item.doc
    });
    console.log(4, result);
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