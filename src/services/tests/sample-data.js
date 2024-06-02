const { keysOf, getRandomInt, getRandomFloat } = require("../../utils");
const { vehicleServices } = require("../../vehicles/constants");

const serviceKeys = keysOf(vehicleServices);

function* dateGenerator() {
    const ONE_HOUR = 1 * 60 * 60 * 1000;
    for (let index = 1; true; index++) {
        const now = new Date().getTime();
        yield new Date(now + ONE_HOUR * index);
    }
}

const autoDate = dateGenerator();

const SAMPLS_REQUEST_DATA = function () {
    const data = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
        const service = serviceKeys[getRandomInt(0, serviceKeys.length - 1)];
        const randomLocationCount = getRandomInt(2, 4);
        data.push({
            service,
            for_date: autoDate.next().value.toISOString(),
            details: {},
            locations: generateRandomLocations(randomLocationCount)
        });
    }
    return data;
}();



function generateRandomLocations(count) {
    const locations = [];
    for (let i = 0; i < count; i++) {
        const lat = getRandomFloat(29.605105, 29.624506);
        const lng = getRandomFloat(52.502488, 52.561024);
        locations.push({
            coordinates: [lat, lng],
            wait: getRandomInt(0, 10) > 5 ? 0 : 10,
            meta: {}
        });
    }
    return locations;
}



module.exports.autoDate = autoDate
module.exports.generateRandomLocations = generateRandomLocations;
module.exports.SAMPLS_REQUEST_DATA = SAMPLS_REQUEST_DATA;