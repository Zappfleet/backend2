const express = require("express");
const migrateDataController = require("./migrateData-controller");

const router = express.Router();

/**
 * @swagger
 * /api/v2/migrateData/migrateDataRequest:
 *  get:
 *      tags: [migrateData]
 *      summary: get requests and trip from oldDB and insert servicerequests and servicemissions in newDB
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/migrateDataRequest", migrateDataController.migrateDataRequest);

/**
 * @swagger
 * /api/v2/migrateData/migrateDataAccounts:
 *  get:
 *      tags: [migrateData]
 *      summary: get users and trip from oldDB and insert servicerequests and servicemissions in newDB
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/migrateDataAccounts", migrateDataController.migrateDataAccounts);

/**
 * @swagger
 * /api/v2/migrateData/migrateDataAreas:
 *  get:
 *      tags: [migrateData]
 *      summary: get requests and trip from oldDB and insert servicerequests and servicemissions in newDB
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/migrateDataAreas", migrateDataController.migrateDataAreas);

/**
 * @swagger
 * /api/v2/migrateData/migrateDataCars:
 *  get:
 *      tags: [migrateData]
 *      summary: get requests and trip from oldDB and insert servicerequests and servicemissions in newDB
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/migrateDataCars", migrateDataController.migrateDataCars);

/**
 * @swagger
 * /api/v2/migrateData/migrateDataLocations:
 *  get:
 *      tags: [migrateData]
 *      summary: get requests and trip from oldDB and insert servicerequests and servicemissions in newDB
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/migrateDataLocations", migrateDataController.migrateDataLocations);



module.exports = { migrateRouter: router };