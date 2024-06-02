const logger = require("./middleware/logger");
const config = require("config");
const express = require("express");
const cluster = require("cluster");
const { SocketService } = require("./socket");
const totalCPUs = require("os").cpus().length;
const app = express();
const path = require("path");
const initGpsService = require("./modules/car/car_gps_service");

const server = require("http").Server(app);

function exec() {
  require("./startup/routes")(app);
  console.log(`Worker ${process.pid} started`);
  require("./startup/db").db();
  require("./startup/config")();
  require("./startup/validation")();

  const port = process.env.PORT;
  app.use(express.static(path.join(__dirname, 'public')));


  //sgh
  // server.listen(port, () => {
  //   logger.info(`Listening on port ${port}...`);
  // });


  const service = new SocketService(server);
  app.set("socketService", service);


  // initGpsService();
}

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  exec();
} else {
  if (cluster.isMaster) {
    console.log(`Number of CPUs is ${totalCPUs}`);
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < totalCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
      console.log("Let's fork another worker!");
      cluster.fork();
    });
  } else {
    exec();
  }
}
