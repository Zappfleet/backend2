const express = require("express");
const { authenticate, restrict } = require("../../users/mid/auth");
const {
  createLocation,
  editLocation,
  getLocations,
  deleteLocation,
} = require("./locations-controller");

const router = express.Router();

/**
 * @swagger
 * /api/v2/locations/:
 *  post:
 *      tags: [Locations]
 *      summary: create a favorite location.
 *      description : anything other than specified fields is set in `properties`
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
 *                                  "name": "...",
 *                                  "properties": { },
 *                                  "lnglat" : [lng , lat],
 *                                  "is_private" : true
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", createLocation);

// options.show_privates
// options.show_publics

/**
 * @swagger
 * /api/v2/locations/:
 *  get:
 *      tags: [Locations]
 *      summary: get favorite locations of user
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : page
 *          description : 0 indexed pagination
 *          type : number
 *        - in : query
 *          name : sort
 *          description : example >> `{"name":-1}`
 *          type : string
 *        - in : query
 *          name : search
 *          type : string
 *        - in : query
 *          name : show_privates
 *          type : boolean
 *        - in : query
 *          name : show_publics
 *          type : boolean
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/", getLocations);

/**
 * @swagger
 * /api/v2/locations/{id}:
 *  put:
 *      tags: [Locations]
 *      summary: edit a favorite location
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
 *                                  "name": "...",
 *                                  "properties": { },
 *                                  "lnglat" : [lng , lat],
 *                                  "is_private" : true
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/:id", editLocation);

/**
 * @swagger
 * /api/v2/locations/{id}:
 *  delete:
 *      tags: [Locations]
 *      summary: delete a favorite location
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
router.delete("/:id", deleteLocation);

module.exports = { favoriteLocationsRouter: router };
