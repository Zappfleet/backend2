const admin = require("firebase-admin");
const path = require('path');
const config = require("config");
const { User } = require("../modules/user/model");
const axios = require("axios");
const { messages } = require("../global_values/socket");
const roles = require("../global_values/roles");
const { getConnectionsInstance } = require("../socket/connections");
const fs = require('fs');

const initFirebase = () => {
  // if (config.get('USE_FIREBASE') !== "TRUE") {
  //   return
  //   // throw new Error("Passenger service account JSON is empty"); // ایجاد خطا به جای return
  // }

  try {
    // دریافت مسیر DRIVER_SERVICE_ACCOUNT از فایل پیکربندی

    const passengerServiceAccountPath = config.get('PASSENGER_SERVICE_ACCOUNT');
    const driverServiceAccountPath = config.get('DRIVER_SERVICE_ACCOUNT');


    // حل مسیر به یک مسیر مطلق
    const passCertPath = path.resolve(process.cwd(), passengerServiceAccountPath)//passengerServiceAccountPath;// require(path.resolve(passengerServiceAccountPath));
    const driverCertPath =path.resolve(process.cwd(), driverServiceAccountPath)// driverServiceAccountPath;// require(path.resolve(driverServiceAccountPath));

   // console.log(54, passCertPath);

    // بارگذاری فایل‌های JSON
    console.log(57,path.resolve(__dirname, passengerServiceAccountPath));
    
    const passCertContent = fs.readFileSync(passCertPath, 'utf8');
   // console.log("Passenger Service Account Content:", passCertContent); // لاگ محتویات
    const passCert = JSON.parse(passCertContent);
    //console.log(2001, passCert); // چاپ محتوای فایل

    let firebasePassenger = admin.initializeApp(
      {
        credential: admin.credential.cert(passCert),
      },
      "passenger"
    );

    // بارگذاری فایل‌های JSON برای درایور

    const driverCertContent = fs.readFileSync(driverCertPath, 'utf8');
    //console.log("Driver Service Account Content:", driverCertContent); // لاگ محتوای فایل
    const driverCert = JSON.parse(driverCertContent);
    //console.log(20011, driverCert);

    let firebaserDriver = admin.initializeApp({
      credential: admin.credential.cert(driverCert),
    });

    // بازگرداندن مقادیر
    return {
      firebasePassenger,
      firebaserDriver
    };
  } catch (error) {
    console.error(54878, "Error loading Firebase service account JSON:", error);
  }
};

// فراخوانی تابع
const { firebasePassenger, firebaserDriver } = initFirebase();

const conClass = getConnectionsInstance();

const sendPassengerNotification = async (payload) => {
  try {
    await firebasePassenger.messaging().send(payload);
    console.log("Notification sent");
  } catch (error) {
    console.log(error.message);
    console.log("Notification failed");
  }
};

const sendDriverNotification = async (payload) => {
  try {
    await firebaserDriver.messaging().send(payload);
  } catch (error) {
    console.log(error.message);
    console.log("Driver notification failed");
  }
};

exports.sendNotification = async function (userId, title, message, _id, kind, mode, notifSound) {
  // irisaHelper.sendPassengerNotification([userId] , `پیام سیستم مدیریت ناوگان \n ${title}:${message}`);  
  // const user = await User.findById(userId).select("firebase_token");

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
  //     };
  //   }

  //   if (mode === 'passenger') await sendPassengerNotification(payload);
  //   if (mode === 'driver') await sendDriverNotification(payload);
  // }
};

exports.urlShortnert = async (url) => {
  const d = new Date();
  const currentDay = d.getDate();
  let baseUrl = "https://is.gd/create.php?format=simple&url=";

  if (currentDay <= 31) {
    baseUrl = "https://cdpt.in/shorten?url=";
  }

  const { data } = await axios.get(baseUrl + url);
  return data;
};

exports.sendMutateRequestList = (req, request, method = 'add', mode) => {
  const client = conClass.getConnection(request?.dispatcher[request?.dispatcher?.length - 1]?.account_id);
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
    if (role !== roles.admin) {
      req.app.get("socketService").emit(
        messages.mutateRequestList,
        {
          request,
          method
        },
        'admins'
      );
    } else {
      req.app.get("socketService").emit(
        messages.mutateRequestList,
        {
          request,
          method
        },
        client?.id
      );
    }
  }
};

exports.sendMutateDraftstListV2 = (req, trip, method = 'delete') => {
  const client = conClass.getConnection(trip?.dispatcher[0]?.account_id);

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
};

exports.sendMutateDraftstList = (req, trip, method = 'delete') => {
  const client = conClass.getConnection(trip?.dispatcher[0]?.account_id);
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
};

exports.sendPassengerNotification = sendPassengerNotification;
exports.sendDriverNotification = sendDriverNotification;
