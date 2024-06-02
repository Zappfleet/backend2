const R = require("../resources/R");

module.exports.serviceUnits = {
    COUNT: {
        key: "COUNT",
        title: R.string.count,
    },
    KILO: {
        key: "KILO",
        title: R.string.kilo,
    }
}

module.exports.vehicleServices = {
    TAXI: {
        key: "TAXI",
        unit: "PERSON",
        title: R.string.taxi_service,
    },
    DELIVERY: {
        key: "DELIVERY",
        unit: "KILO",
        title: R.string.delivery,
    },
    CARGO: {
        key: "CARGO",
        unit: "TONNE",
        title: R.string.cargo_service,
    },
}

module.exports.vehicleGroups = {

    TAXI: {
        key: "TAXI",
        title: R.string.taxi,
    },

    VAN: {
        key: "VAN",
        title: R.string.van,
    },

    BIKE: {
        key: "BIKE",
        title: R.string.bike,
    },

}

module.exports.vehicleStatus = {
    IDLE: {
        key: "IDLE",
        title: R.string.free
    },
    ON_MISSION: {
        key: "ON_MISSION",
        title: R.string.on_mission
    },
    INACTIVE: {
        key: "INACTIVE",
        title: R.string.inactive
    }

}

