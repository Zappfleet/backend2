const requestStatus = {
  crtBPs: 0,
  cncBPS: 1,
  snBMn: 2,
  rjBMn: 3,
  acBMn: 4,
  snBDs: 5,
  rjBDs: 6,
  inTDr: 7, //in trip draft list
  plITr: 8, //placed in trip
  done: 9, //placed in trip
};

const tripStatus = {
  crtBDs: 0,
  hsCr: 1,
  cncBDr: 2, //cancel by driver
  cncBPs: 3, //cancel by passenger
  cnBDs: 4, //cancel by dispatcher
  cnBMn: 5, //cancel by manager or admin
  strtd: 6,
  fnshd: 7,
};

const passengerTripStatus = {
  drvRchdOrgn: 1,
  pssgrGtOn: 2,
  drvRchdDst: 3,
  pssgrGtOf: 4,
};

const carStatus = {
  fr: 0,
  nTr: 1,
};

exports.rqstStat = requestStatus;
exports.trpStat = tripStatus;
exports.pssTrpStat = passengerTripStatus;
exports.crStat = carStatus;
