const moment = require('moment');

const calcMinutes = (timeNum) => {
  const houre = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;
  return houre * 60 + minutes;
};

const calcStrMinutes = (timeStr) => {
  
  if (!timeStr) return
  const timeArr = timeStr.split(":");
  return parseInt(timeArr[0]) * 60 + parseInt(timeArr[1]);
};

const isTimingValid = (timeStr) => {
  const isValid = moment(timeStr).isAfter(moment());
  return isValid;
}

exports.calcMinutes = calcMinutes;
exports.isTimingValid = isTimingValid;
exports.calcStrMinutes = calcStrMinutes;
