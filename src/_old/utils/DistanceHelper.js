const { default: axios } = require("axios");
const config = require("config");
const { Driver } = require("../mid_models/driver");
const { sendErrorByEnviorment } = require("./errorHelper");

const getSampleArr = (pointArr) => {
  let length = pointArr.length;
  if (length === 2) return pointArr;
  const finalArr = [pointArr[0]];
  const hundredPacks = Math.ceil(length / 100);
  for (let i = 0; i < hundredPacks; i++) {
    let index = Math.floor(length / 2);
    length = index;
    finalArr.push(pointArr[index]);
    if (i !== 0) {
      index = length - index;
      finalArr.push(pointArr[index]);
    }
  }
  finalArr.push(pointArr[length - 1]);
  return finalArr;
};
const calculateTripDistance = async (pointArr) => {
  if (pointArr.length < 2) return { distance: 0, interval: 0 };
  const sampleArr = getSampleArr(pointArr);
  let distance = 0;
  let interval = 0;
  for (let i = 0; i < sampleArr.length - 1; i++) {
    const firstEl = sampleArr[i];
    const secondEl = sampleArr[i + 1];
    try {
      const { data } = await axios.get(
        config.get("NESHAN_DISATNCE_URL") +
        `&origins=${firstEl[1]},${firstEl[0]}&destinations=${secondEl[1]},${secondEl[0]}`,
        { headers: { "Api-Key": config.get("NESHAN_API_KEY") } }
      );
      distance += data.rows[0].elements[0].distance.value;
      interval += data.rows[0].elements[0].duration.value;
    } catch (error) {
      console.log(error);
    }
  }
  return { distance, interval };
};

const updateDriverLocation = async (driverID, location) => {
  const driver = await Driver.findOneAndUpdate(
    { _id: driverID, is_active: true },
    { location }
  );
  if (!driver) return sendErrorByEnviorment("driver not found");
};

const calculateRequestDistance = async (locations) => {
  let distance = 0,
    interval = 0;
  const { start, finish } = locations;
  const { lnglat: slg } = start;
  const { lnglat: flg } = finish;
  try {
    // const { start, finish } = locations;
    // const slg = start.lnglat; // slg is now an array [lng, lat]
    // const flg = finish.lnglat; // flg is now an array [lng, lat]

    // // Log the coordinates to verify their correctness
    // console.log("Start Coordinates:", slg[1], slg[0]);
    // console.log("Finish Coordinates:", flg[1], flg[0]);

    const { data } = await axios.get(
      config.get("NESHAN_DISATNCE_URL") +
      `&origins=${slg[1]},${slg[0]}&destinations=${flg[1]},${flg[0]}`,
      { headers: { "Api-Key": config.get("NESHAN_API_KEY") } }
    );
    //   console.log(53, data.rows[0]);
    distance += data.rows[0].elements[0].distance.value;
    interval += data.rows[0].elements[0].duration.value;
  } catch (error) {
    console.error("Error while fetching distance:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response Data:", error.response.data);
    }
  }
  return { distance, interval };
};

exports.updateDriverLocation = updateDriverLocation;
exports.calculateTripDistance = calculateTripDistance;
exports.calculateRequestDistance = calculateRequestDistance;
