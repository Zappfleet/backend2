const { default: axios } = require("axios");
const config = require("config");
const ObjectId = require("mongoose/lib/types/objectid");
const { trpStat } = require("../../global_values/status");
const { Trip } = require("../trip/model");
const { Car } = require("./model");
function initGpsService() {
    setInterval(async () => {
        try {
            const gps_id = 27048;
            const { data } = await axios.get(`https://avl-capi.opp.co.ir/v1/api/Place/LastLocation/${gps_id}`, {
                headers: {
                    ApiKey: config.get("GPS_API_KEY")
                }
            })
            const { latitude, longitude, speed, date } = data;

            const car = await Car.findOne({ gps_id });
            if (car == null) return;

            const body = {
                user_id: car.driver.user.account_id,
                points: [[longitude, latitude]],
                meta: [{ speed, date }],
                bearing: 0
            }

            //sgh
            if (config.get("environment_name") === "local") {
                await axios.put(`http://localhost:${process.env.PORT}/car/me/location/25f4g6g4u8fkylhfjdgfPdjfbv2d54fd4`, body)
            }
            if (config.get("environment_name") === "server") {
                await axios.put(`https://zapp-backend.liara.run/car/me/location/25f4g6g4u8fkylhfjdgfPdjfbv2d54fd4`, body)
            }


            const currentTrip = await Trip.findOne({
                "driver.driver_id": car.driver.driver_id,
                is_active: true,
                all_arrived: false,
                status: trpStat.strtd,
            })
            if (currentTrip == null) {
                return
            }

            //sgh
            if (config.get("environment_name") === "local") {
                await axios.put(`http://localhost:${process.env.PORT}/trip/me/${currentTrip._id.toString()}/distance/skjhsdhuw5s74disudkdnn25ej`, body)
            }
            if (config.get("environment_name") === "server") {
                await axios.put(`https://zapp-backend.liara.run/trip/me/${currentTrip._id.toString()}/distance/skjhsdhuw5s74disudkdnn25ej`, body)
            }


        } catch (e) {
            console.log(e);
        }
    }, 2000);
}


module.exports = initGpsService;