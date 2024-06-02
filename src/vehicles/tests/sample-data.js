const { getRandomInt, keysOf } = require("../../utils");
const roles = require("../../_old/global_values/roles");
const { vehicleServices, vehicleGroups, vehicleStatus } = require("../constants");

const serviceKeys = keysOf(vehicleServices);
const groupKeys = keysOf(vehicleGroups);



const SAMPLE_VEHICLE_DATA = function () {
    const samples = [];
    const totalCount = 100;
    const plaques = randomePlaqueSet(totalCount);

    for (const plaque of plaques) {
        samples.push({
            plaque,
            extra: { model: "peugeot", year: 1401 },
            group: groupKeys[getRandomInt(0, groupKeys.length - 1)],
            services: [{
                service: serviceKeys[getRandomInt(0, serviceKeys.length - 1)],
                capacity: getRandomInt(1, 20),
            }],
            status: getRandomInt(0, 10) >= 6 ? vehicleStatus.ON_MISSION.key : vehicleStatus.IDLE.key,
        });
    }
    return samples;
}();

function randomePlaqueSet(count) {
    const plaques = {};

    while (Object.keys(plaques).length < count) {
        plaques[randomePlaque()] = true;
    }
    return Object.keys(plaques);
}



function randomePlaque() {
    return `${getRandomInt(10, 99)}-X-${getRandomInt(10, 99)}-${getRandomInt(10, 99)}`
}

module.exports.SAMPLE_VEHICLE_DATA = SAMPLE_VEHICLE_DATA;
