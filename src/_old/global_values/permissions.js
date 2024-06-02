
// IMPORTANT:  users with role other than passenger or driver are called admins

const permissions = {
  GET: {
    slRqstLs: 0,// self requests list
    slRqstDt: 1,//self request details 
    slTrpLs: 2,//self trip list
    slTrpDt: 3,//self trip details
    slLc: 4,//self locations
    srchLcs: 5,//search locations
    srchUsr: 6,//search users
    // --------------------------------------------------------admins------------------------------------------------
    rqstLs: 7,// others requests list (admins)
    rqstDt: 8,// requests details 
    // s0Rqsts: 9,
    // s1Rqsts: 10,
    // s2Rqsts: 11,
    // s4Rqsts: 11,
    // s5Rqsts: 11,
    trpDrftLs: 14, // trip drafts list 
    trpsDrftDt: 15, //trip dfrafts details 
    trpLs: 16, // trip list
    trpDt: 17, // trip details
    acCrLs: 18, // access cars list
    acCrDt: 19, // access car details
    lcs: 20, // locations list
    arls: 21, // area list
    arDt: 22, // area details
    crLs: 23, // cars list
    crDt: 24, // car details
    usrs: 25, // users list
    usrDt: 26, // users details
  },
  POST: {
    dlofaut: 0, //deligation of authority
    slRqst: 1, // self request
    slLc: 2, // self location
    // --------------------------------------------------------admins------------------------------------------------
    rqst: 3, // request by admins
    trpDrft: 4, // trip draft 
    lc: 5, // location
    ar: 6, // area
    cr: 7, // car
    prvTrp: 8, // private trip  -> not used to now - features with this permission will be implemented in future
    usr: 9, // create user
  },
  PUT: {
    slTr: 0, // change self trip 
    slRqst: 1, //change self request -> not used to now - features with this permission will be implemented in future
   // --------------------------------------------------------admins------------------------------------------------
    rqst: 2, // change users request
    trp: 3, // ... trip
    asArDsp: 4, // asigin area a dispatcher
    asCrDrv: 5, // asign car a driver
    lc: 6, // change location
    ar: 7, // change area
    car: 8, // change car
    adrl: 9, // dont know ! not used 
    usr: 10,// change users profile
    trpDrft: 11, // change trip draft
  },
  DELETE: {
    slLc: 0, // self location
   // --------------------------------------------------------admins------------------------------------------------
    lc: 1, // users locations
    rqst: 2, // users requests 
    trp: 3, // users trips
    usr: 4, // users
    ar: 5, // areas
    car: 6 //cars
  },
};
module.exports = permissions;
