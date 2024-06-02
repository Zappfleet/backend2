const express = require("express");
const http = require("http");
const cors = require("cors");

const { vehiclesRouter } = require("./vehicles/routes");
const { swaggerRouter } = require("./swagger");
const { serviceRouter } = require("./services/routes");
const { favoriteLocationsRouter } = require("./location/routes");
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

const init = async () => {
  const app = express();

  const server = http.createServer(app);
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true, urlencoded: true }));

  const router = express.Router();

  router.use("/regions", authenticate, restrict, regionRouter);
  router.use("/services", authenticate, restrict, serviceRouter);
  router.use("/vehicles", authenticate, restrict, vehiclesRouter);
  router.use("/locations", authenticate, restrict, favoriteLocationsRouter);
  router.use("/roles", authenticate, restrict, userRolesRouter);
  router.use("/users", userAccountRouter);
  router.use("/reports", authenticate, reportsRouter);
  router.use("/restrict", authenticate, restrictionsRouter);

  router.use("/irisa", irisaRouter);

  router.use(swaggerRouter);

  app.use("/api/v2", router);

  initNotificationService(server);

  const PORT = 4000;
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

  if (OrgDataSource.externalUserbaseModule != null) {
    const externalUserbase = require(`./services/modules/${OrgDataSource.externalUserbaseModule}`);
    externalUserbase.launch();
  }
}

init();
