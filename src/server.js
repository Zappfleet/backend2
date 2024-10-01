
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require('path');

const { runPlugin } = require('../system_plugins/gps-device/index');
const { vehiclesRouter } = require("./vehicles/routes");
const { swaggerRouter } = require("./swagger");
const { serviceRouter } = require("./services/routes");
const { favoriteLocationsRouter } = require("./favoriteLocation/routes");
const { spawn } = require("child_process");
const { initNotificationService } = require("./notification-service");
const { initServiceLoops } = require("./service_loops");
const { regionRouter } = require("./regions/routes");
const { irisaRouter } = require("./irisa/routes");
const { userAccountRouter } = require("./users/routes");
const { authenticate, restrict } = require("./users/mid/auth");
const { userRolesRouter } = require("./users/routes/roles");
const { OrgDataSource } = require("./org-modules/constants/OrgDataSource");
const { reportsRouter } = require("./reports/routes/");
const { restrictionsRouter } = require("./restrictions/routes/");
// const { uploadRouter } = require("./upload/routes/");

const { aganceRouter } = require("./agance/routes/");

const { getRequestStatistics } = require("./dashboard/statsController");

const upload = require("./uploadFile/uploadFile");// وارد کردن ماژول آپلود فایل
const { migrateDataRequest } = require("./migrateData/requestsCollection/migrateData");
const { migrateDataAccounts } = require("./migrateData/accountCollection/migrateData");
const { migrateDataAreas } = require("./migrateData/areasCollection/migrateData");
const { migrateDataCars } = require("./migrateData/carsCollection/migrateData");
const { migrateDataLocations } = require("./migrateData/locationCollection/migrateData");
const { confirmRequest } = require("./services/routes/request-controller");
const { rejectRequest } = require("./services/routes/request-controller");
const { Test } = require("./migrateData/Test/Test")
const config = require("config");





const init = async () => {
  const app = express();

  const server = http.createServer(app);
  app.use(cors());
  app.use(cors({
    origin: config.get("FRONT_URL_LOCAL"),
    credentials: true
}));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true, urlencoded: true }));

  const router = express.Router();

  router.use("/regions", authenticate, restrict, regionRouter);
  router.use("/services", authenticate, restrict, serviceRouter);
  router.use("/vehicles", authenticate, restrict, vehiclesRouter);
  router.use("/favoriteLocations", authenticate, restrict, favoriteLocationsRouter);
  router.use("/roles", authenticate, restrict, userRolesRouter);
  router.use("/users", userAccountRouter);
  router.use("/reports", authenticate, reportsRouter);
  router.use("/restrict", authenticate, restrictionsRouter);
  router.use("/agance", /*authenticate, restrict,*/ aganceRouter);

  // Add the new /stat/requests route
  router.get("/stat/requests", getRequestStatistics);

  // ConvertData from faz-1 to faz-2

  // راه‌اندازی روت برای آپلود فایل
  app.post('/upload', upload)

  // Serve the uploaded files statically
  app.use('/uploads', express.static(path.join(__dirname, 'uploadFile/uploads')));


  router.get("/migrateDataRequest", migrateDataRequest);
  router.get("/migrateDataAccounts", migrateDataAccounts);
  router.get("/migrateDataAreas", migrateDataAreas);
  router.get("/migrateDataCars", migrateDataCars);
  router.get("/migrateDataLocations", migrateDataLocations);

  router.get("/confirmRequest/:id", confirmRequest);
  router.get("/rejectRequest/:id", rejectRequest);

  router.get("/test", Test);





  router.use("/irisa", irisaRouter);

  router.use(swaggerRouter);

  app.use("/api/v2", router);

  initNotificationService(server);

  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log("Zapp server listening to :" + PORT);
    executePlugins();
    initServiceLoops();
  });
};

function executePlugins() {
  // const nodeProcess = spawn("node", ["./system_plugins/gps-device/index.js"]);

  // nodeProcess.stdout.on('data', function (data) {
  //     console.log('stdout: ' + data.toString());
  // });

  // nodeProcess.stderr.on('data', function (data) {
  //     console.log('stderr: ' + data.toString());
  // });

  // nodeProcess.on('exit', function (code) {
  //     console.log('child process exited with code ' + code.toString());
  // });

  //sgh
  //runPlugin()

  if (OrgDataSource.externalUserbaseModule != null) {
    const externalUserbase = require(`./services/modules/${OrgDataSource.externalUserbaseModule}`);
    externalUserbase.launch();
  }
}

init();
