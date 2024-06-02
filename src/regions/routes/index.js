const express = require("express");
const regionController = require("./region-controller");


const router = express.Router();


/**
 * @swagger
 * /api/v2/regions/:
 *  get:
 *      tags: [Regions]
 *      summary: get list of regions
 *      security:
 *              - BearerAuth: []
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/", regionController.getListOfRegions);

/**
 * @swagger
 * /api/v2/regions/{id}:
 *  get:
 *      tags: [Regions]
 *      summary: get one specific region
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : path
 *          name : id
 *          type : string
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/:id", regionController.getRegionById);

/**
 * @swagger
 * /api/v2/regions/:
 *  post:
 *      tags: [Regions]
 *      summary: create a new region
 *      security:
 *              - BearerAuth: []
 *      requestBody:
 *              required: true
 *              consumes:
 *                  - "application/raw"
 *              content:
 *                  application/json:
 *                      schema:
 *                              type: object
 *                              example: {
 *                                  "name": "region name", 
 *                                  "properties": {"item1" : "value1" , "item2" : "value2"}, 
 *                                  "geometry" : {
 *                                      "type": "Polygon",
 *                                      "coordinates" : [[[52.507059, 29.592448], [52.527059, 29.592448], [52.547059, 29.592448]]]
 *                                  } 
 *                              }
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", regionController.submitRegion);



/**
 * @swagger
 * /api/v2/regions/{id}:
 *  put:
 *      tags: [Regions]
 *      summary: update existing region
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : path
 *          name : id
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
 *                                  "name": "region name", 
 *                                  "properties": {"item1" : "value1" , "item2" : "value2"}, 
 *                                  "geometry" : {
 *                                      "type": "Polygon",
 *                                      "coordinates" : [[[52.507059, 29.592448], [52.527059, 29.592448], [52.547059, 29.592448]]]
 *                                  } 
 *                              }
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/:id", regionController.editRegion);


/**
 * @swagger
 * /api/v2/regions/{id}:
 *  delete:
 *      tags: [Regions]
 *      summary: disable a specific region
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : path
 *          name : id
 *          type : string
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/:id", regionController.deactivateRegion);



module.exports = { regionRouter: router }