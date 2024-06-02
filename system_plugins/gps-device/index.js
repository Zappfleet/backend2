const { default: axios } = require("axios");
const { pushLocationIfFarEnough } = require("../../src/location/data");
const { GpsHistory } = require("../../src/location/data/gps");
const { updateVehicleLatestGpsInfoForAll } = require("../../src/vehicles/data");
const { Vehicle } = require("../../src/vehicles/data/vehicle-model");
const { db } = require("../../src/_old/startup/db");

const ApiKey = "pywhLQMsIaVu7sE7KjuLJb6pcod0Lc2l+sGySV6dewHp1gTlaDQeBxxmYznCuzW8J7MqhLfll1tFrkcEhA0DQQ==";


async function runPlugin() {

    setInterval(async () => {
        try {

            const gpsInfo = {};
            const { data: gpsData } = await axios.get("https://avl-capi.opp.co.ir/v1/api/GPS/All", {
                headers: { ApiKey },
            });

            gpsData.map((item) => {
                gpsInfo[item.imei] = item;
            })

            const vechilesWithAssignedGps = await Vehicle.find({ gps_uid: { $ne: null } });

            for (const vehicle of vechilesWithAssignedGps) {
                const gps = gpsInfo[vehicle.gps_uid];
                if (!gps) continue;
                const { data: gpsData } = await axios.get(`https://avl-capi.opp.co.ir/v1/api/Place/LastLocation/${gps.id}`, {
                    headers: {
                        ApiKey
                    }
                })

                const { latitude, longitude, date, speed } = gpsData;

                await pushLocationIfFarEnough(vehicle._id, longitude, latitude, date, speed);
            }
        } catch (e) {
            console.log("gps error : " + e.message);
        }

        try {
            await updateVehicleLatestGpsInfoForAll();
        } catch (e) {
            console.log("gps vechile update error : " + e.message);
        }

    }, 5000);


}
db(runPlugin);

module.exports.runPlugin = runPlugin;