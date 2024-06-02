const express = require("express");
const vehicleController = require("./vehicle-controller");

const router = express.Router();

/**
 * @swagger
 * /api/v2/vehicles/agency:
 *  get:
 *      tags: [Vehicles]
 *      summary: get list of agencies
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  extra:
 *                      type: object
 *
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/agency", vehicleController.getListOfAgencies);

/**
 * @swagger
 * /api/v2/vehicles/data:
 *  get:
 *      tags: [Vehicles]
 *      summary: get vehicle fields data
 *      parameters:
 *        - in : query
 *          name : include_inactive
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/data", vehicleController.getVehicleData);

/**
 * @swagger
 * /api/v2/vehicles/color:
 *  post:
 *      tags: [Vehicles]
 *      summary: create vehicle color
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "name": "color name",
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/color", vehicleController.createVehicleColor);

/**
 * @swagger
 * /api/v2/vehicles/color/{key}:
 *  patch:
 *      tags: [Vehicles]
 *      summary: setActive vehicle group
 *      parameters:
 *        - in : path
 *          name : key
 *          type : string
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "active": true,
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/color/:key", vehicleController.updateVehicleColor);

/**
 * @swagger
 * /api/v2/vehicles/group:
 *  post:
 *      tags: [Vehicles]
 *      summary: create vehicle group
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "name": "group name"
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/group", vehicleController.createVehicleGroup);

/**
 * @swagger
 * /api/v2/vehicles/group/{key}:
 *  patch:
 *      tags: [Vehicles]
 *      summary: setActive vehicle group
 *      parameters:
 *        - in : path
 *          name : key
 *          type : string
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "active": true,
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/group/:key", vehicleController.updateVehicleGroup);

/**
 * @swagger
 * /api/v2/vehicles/service:
 *  post:
 *      tags: [Vehicles]
 *      summary: create vehicle service group
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "unit": "person|kg|count|tone",
 *                                  "name": "group name",
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/service", vehicleController.createVehicleServiceGroup);

/**
 * @swagger
 * /api/v2/vehicles/name:
 *  post:
 *      tags: [Vehicles]
 *      summary: create vehicle name
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "name": "group name",
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/name", vehicleController.createVehicleName);

/**
 * @swagger
 * /api/v2/vehicles/name/{key}:
 *  patch:
 *      tags: [Vehicles]
 *      summary: setActive vehicle name
 *      parameters:
 *        - in : path
 *          name : key
 *          type : string
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "active": true,
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/name/:key", vehicleController.updateVehicleName);

/**
 * @swagger
 * /api/v2/vehicles/service/{key}:
 *  patch:
 *      tags: [Vehicles]
 *      summary: setActive vehicle service group
 *      parameters:
 *        - in : path
 *          name : key
 *          type : string
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "active": true,
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/service/:key", vehicleController.updateVehicleServiceGroup);

/**
 * @swagger
 * /api/v2/vehicles/:
 *  get:
 *      tags: [Vehicles]
 *      summary: get list of vehicles
 *      parameters:
 *        - in : query
 *          name : filter
 *          description : example >> `{"field_name":"..."}`
 *          type : string
 *        - in : query
 *          name : sort
 *          description : example >> `{"field_name":-1}`
 *          type : string
 *        - in : query
 *          name : page
 *          type : number
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/", vehicleController.getListOfVehicles);

/**
 * @swagger
 * /api/v2/vehicles/{id}:
 *  get:
 *      tags: [Vehicles]
 *      summary: get details of specified vehicle id
 *      parameters:
 *         - in : path
 *           name : id
 *           type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          404:
 *              description: Vehicle Not Found
 *          500:
 *              description: Internal Error
 */
router.get("/:id", vehicleController.getVehicleDetails);

/**
 * @swagger
 * /api/v2/vehicles/drivers/assignable:
 *  get:
 *      tags: [Vehicles]
 *      summary: get list of assignable drivers
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/drivers/assignable", vehicleController.getAssignableDrivers);

/**
 * @swagger
 * /api/v2/vehicles/drivers/{method}:
 *  patch:
 *      tags: [Vehicles]
 *      summary: assign/unassign vehicle's driver
 *      parameters:
 *         - in : path
 *           name : method
 *           schema :
 *              type : string
 *              enum : ["assign" , "unassign"]
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/json"
 *              content:
 *                  application/json:
 *                      schema:
 *                        type: object
 *                        properties:
 *                            vehicle_id:
 *                                type: string
 *                                description: a valid vehicle id
 *                            user_id:
 *                                type: string
 *                                description: a valid user id (optional when method is unassigned)
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          422:
 *              description: An invalid vehicle or user id is sent
 *          404:
 *              description: when vehicle id does not exist
 *          500:
 *              description: Internal Error
 */
router.patch("/drivers/:method", vehicleController.assignDriver);

/**
 * @swagger
 * /api/v2/vehicles/:
 *  post:
 *      tags: [Vehicles]
 *      summary: create a new vehicle
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  group:
 *                      type: string
 *                      enum: ["TAXI" , "VAN" , "BIKE"]
 *                  driver_user:
 *                      type: string
 *                  plaque:
 *                      type: string
 *                  services:
 *                      type: array
 *                      items:
 *                          type: object
 *                          properties:
 *                              service:
 *                                  type: string
 *                                  enum: ["TAXI" , "DELIVERY" , "CARGO"]
 *                              capacity:
 *                                  type: integer
 *                  extra:
 *                      type: object
 *
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", vehicleController.createVehicle);

/**
 * @swagger
 * /api/v2/vehicles/agency:
 *  post:
 *      tags: [Vehicles]
 *      summary: create a new agency
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  agency_name:
 *                      type: string
 *                  agency_phone:
 *                      type: string
 *
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/agency", vehicleController.insertAgency);

/**
 * @swagger
 * /api/v2/vehicles/agency/{id}:
 *  put:
 *      tags: [Vehicles]
 *      summary: update existing agency
 *      parameters:
 *         - in : path
 *           name : id
 *           type : string
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  agency_name:
 *                      type: string
 *                  agency_phone:
 *                      type: string
 *
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/agency/:id", vehicleController.editAgency);

/**
 * @swagger
 * /api/v2/vehicles/{id}:
 *  put:
 *      tags: [Vehicles]
 *      summary: updates an existing vehicle
 *      parameters:
 *         - in : path
 *           name : id
 *           type : string
 *           schema :
 *              enum : ["assign" , "unassign"]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  group:
 *                      type: string
 *                      enum: ["TAXI" , "VAN" , "BIKE"]
 *                  driver_user:
 *                      type: string
 *                  plaque:
 *                      type: string
 *                  services:
 *                      type: array
 *                      items:
 *                          type: object
 *                          properties:
 *                              service:
 *                                  type: string
 *                                  enum: ["TAXI" , "DELIVERY" , "CARGO"]
 *                              capacity:
 *                                  type: integer
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/:id", vehicleController.updateVehicle);

module.exports = { vehiclesRouter: router };
