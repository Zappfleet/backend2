const admin = require("firebase-admin");
const config = require("config");
const { User } = require("../modules/user/model");
const axios = require("axios");
const { messages } = require("../global_values/socket");
const roles = require("../global_values/roles");
const { getConnectionsInstance } = require("../socket/connections");
const passCert = require(config.get('PASSENGER_SERVICE_ACCOUNT'));
const driverCert = require(config.get('DRIVER_SERVICE_ACCOUNT'));
const irisaHelper = require('./irisaHelper');

let firebasePassenger = admin.initializeApp(
  {
    credential: admin.credential.cert(passCert),
  },
  "passenger"
);
let firebaserDriver = admin.initializeApp({
  credential: admin.credential.cert(driverCert),
});

const conClass = getConnectionsInstance();

const sendPassengerNotification = async (payload) => {
  try {

    firebasePassenger.messaging().send(payload);
    console.log("Notification sent");
  } catch (error) {
    console.log(error.message);
    console.log("Notification failed");
  }
};
const sendDriverNotification = async (payload) => {
  firebaserDriver.messaging().send(payload);
};

exports.sendNotification = async function (userId, title, message, _id, kind, mode, notifSound) {
  // irisaHelper.sendPassengerNotification([userId] , `پیام سیستم مدیریت ناوگان \n ${title}:${message}`);
  // const user = await User.findById(userId).select(
  //   "firebase_token"
  // );

  // if (user && user.firebase_token) {
  //   const payload = {
  //     notification: {
  //       title,
  //       body: message,

  //     },
  //     data: {
  //       data: JSON.stringify({
  //         sms: {
  //           title,
  //           message,
  //           kind, //'request' || 'trip'
  //           _id,
  //         },
  //       }),
  //     },
  //     token: user.firebase_token,
  //   };

  //   if (notifSound != null) {
  //     payload.android = {
  //       notification: {
  //         channel_id: notifSound.channel_id,
  //         sound: notifSound.sound,
  //       },
  //     }
  //   }

  //   if (mode === 'passenger') await sendPassengerNotification(payload);
  //   if (mode === 'driver') await sendDriverNotification(payload)
  // }
}

exports.urlShortnert = async (url) => {
  var d = new Date();
  var currentDay = d.getDate();
  let baseUrl = "https://is.gd/create.php?format=simple&url=";
  if (currentDay <= 31) {
    baseUrl = "https://cdpt.in/shorten?url=";
  }
  const { data } = await axios.default.get(baseUrl + url);

  return data
}

exports.sendMutateRequestList = (req, request, method = 'add', mode) => {
  let client = conClass.getConnection(request?.dispatcher[request?.dispatcher?.length - 1]?.account_id);


  const role = req.user?.role;
  if (mode) {
    req.app.get("socketService").emit(
      messages.mutateRequestList,
      {
        request,
        method
      },
      'admins'
    );
    req.app.get("socketService").emit(
      messages.mutateRequestList,
      {
        request,
        method
      },
      client?.id
    );
  } else {
    if (role !== roles.admin)
      req.app.get("socketService").emit(
        messages.mutateRequestList,
        {
          request,
          method
        },
        'admins'
      );
    else req.app.get("socketService").emit(
      messages.mutateRequestList,
      {
        request,
        method
      },
      client?.id
    );
  }

}

exports.sendMutateDraftstListV2 = (req, trip, method = 'delete') => {
  let client = conClass.getConnection(trip?.dispatcher[0]?.account_id);


  req.app.get("socketService").emit(
    messages.mutateDraftstList,
    {
      trip,
      method
    },
    'admins'
  );
  req.app.get("socketService").emit(
    messages.mutateDraftstList,
    {
      trip,
      method
    },
    client?.id
  );
}

exports.sendMutateDraftstList = (req, trip, method = 'delete') => {
  let client = conClass.getConnection(trip?.dispatcher[0]?.account_id);


  const role = req.user.role;
  if (!role.includes(roles.admin)) {
    req.app.get("socketService").emit(
      messages.mutateDraftstList,
      {
        trip,
        method
      },
      'admins'
    );
  } else {
    req.app.get("socketService").emit(
      messages.mutateDraftstList,
      {
        trip,
        method
      },
      client?.id
    );
  }
}

exports.sendPassengerNotification = sendPassengerNotification;
exports.sendDriverNotification = sendDriverNotification;
