const express = require("express");
const missionController = require("./mission-controller");

const router = express.Router();

/**
 * @swagger
 * /api/v2/services/missions/areal:
 *  get:
 *      tags: [Service Mission]
 *      summary: get list of missions concerning a user's areal permissions
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : page
 *          description : 0 indexed pagination
 *          type : number
 *        - in : query
 *          name : gmt_from
 *          type : string
 *        - in : query
 *          name : gmt_to
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/areal", missionController.getMissionsConcerningArea);

/**
 * @swagger
 * /api/v2/services/missions/passenger:
 *  get:
 *      tags: [Service Mission]
 *      summary: get list of missions containing a passengers request
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : page
 *          type : number
 *        - in : query
 *          name : sort
 *          description : example >> `{"field_name":-1}`
 *          type : string
 *        - in : query
 *          name : include_status_history
 *          type : boolean
 *        - in : query
 *          name : gmt_from
 *          type : string
 *        - in : query
 *          name : gmt_to
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/passenger", missionController.getMissionsConcerningPassenger);

/**
 * @swagger
 * /api/v2/services/missions/getMissions_by_StatusAndDriverID:
 *  get:
 *      tags: [Service Mission]
 *      summary: get list of missions containing a passengers request
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : status
 *          type : string
 *        - in : query
 *          name : driverID
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/getMissions_by_StatusAndDriverID", missionController.getMissions_by_StatusAndDriverID);

/**
 * @swagger
 * /api/v2/services/missions/driver/:
 *  get:
 *      tags: [Service Mission]
 *      summary: get list of missions assigned to the driver
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : page
 *          type : number
 *        - in : query
 *          name : sort
 *          description : example >> `{"field_name":-1}`
 *          type : string
 *        - in : query
 *          name : gmt_from
 *          type : string
 *        - in : query
 *          name : gmt_to
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/driver", missionController.getDriverMissions);

/**
 * @swagger
 * /api/v2/services/missions/full:
 *  post:
 *      tags: [Service Mission]
 *      summary: create a full service mission including all requests
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  extra:
 *                    type: object
 *                    default: {"anydata":123}
 *                  data:
 *                    type: array
 *                    items:
 *                      types: object
 *                      properties:
 *                          submitted_for:
 *                              type: string
 *                          service:
 *                              type: string
 *                              default: TAXI
 *                          gmt_for_date:
 *                              type: string
 *                              default: 2023-01-03T15:46:55+00:00
 *                          locations:
 *                              type: array
 *                              items:
 *                                  type: object
 *                                  properties:
 *                                      coordinates:
 *                                          type: array
 *                                          default: [29.607603 , 52.537465]
 *                                      wait:
 *                                          type: integer
 *                                      meta:
 *                                          type: object
 *                          details:
 *                              type: object
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/full", missionController.buildFullMission);

/**
 * @swagger
 * /api/v2/services/missions/:
 *  post:
 *      tags: [Service Mission]
 *      summary: create a draft service mission
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", missionController.buildMissionDraft);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/request/{request_id}:
 *  patch:
 *      tags: [Service Mission]
 *      summary: assign specified requestId to mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *        - in : path
 *          name : request_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch(
  "/:mission_id/request/:request_id",
  missionController.addRequestToMission
);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/request/{request_id}:
 *  delete:
 *      tags: [Service Mission]
 *      summary: remove specified requestId from mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *        - in : path
 *          name : request_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete(
  "/:mission_id/request/:request_id",
  missionController.removeMissionRequest
);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/vehicle/{vehicle_id}:
 *  patch:
 *      tags: [Service Mission]
 *      summary: assign specified vehcile id to mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *        - in : path
 *          name : vehicle_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch(
  "/:mission_id/vehicle/:vehicle_id",
  missionController.setMissionVehilce
);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/vehicle:
 *  delete:
 *      tags: [Service Mission]
 *      summary: remove the vehicle of specified from mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/:mission_id/vehicle/", missionController.removeMissionVehicle);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/vehicle/:
 *  get:
 *      tags: [Service Mission]
 *      summary: get sorted list operatable of vehicles for specified mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get(
  "/:mission_id/vehicle/",
  missionController.getAssignableVechilesForMission
);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/:
 *  get:
 *      tags: [Service Mission]
 *      summary: get details of mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/:mission_id/", missionController.getMissionDetails);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/history/:
 *  get:
 *      tags: [Service Mission]
 *      summary: get update history of mission
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/:mission_id/history", missionController.getMissionHistory);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/on-route:
 *  patch:
 *      tags: [Service Mission]
 *      summary: set mission status to (ON_ROUTE)
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/:mission_id/on-route", missionController.setMissionOnRoute);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/ready:
 *  patch:
 *      tags: [Service Mission]
 *      summary: set mission status to (READY)
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/:mission_id/ready", missionController.setMissionReady);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/draft:
 *  patch:
 *      tags: [Service Mission]
 *      summary: set mission status to (DRAFT)
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/:mission_id/draft", missionController.setMissionDraft);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/publish:
 *  patch:
 *      tags: [Service Mission]
 *      summary: set mission status to (PUBLISHED)
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/:mission_id/publish", missionController.publishMission);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/{request_id}/on-route:
 *  patch:
 *      tags: [Service Mission]
 *      summary: set mission request status to (ON_ROUTE)
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *        - in : path
 *          name : request_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch(
  "/:mission_id/:request_id/on-route",
  missionController.setMissionRequestOnRoute
);

/**
 * @swagger
 * /api/v2/services/missions/{mission_id}/{request_id}/location/{index}:
 *  patch:
 *      tags: [Service Mission]
 *      summary: set mission request current location to specified index
 *      parameters:
 *        - in : path
 *          name : mission_id
 *          type : string
 *        - in : path
 *          name : request_id
 *          type : string
 *        - in : path
 *          name : index
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch(
  "/:mission_id/:request_id/location/:index",
  missionController.setMissionRequestLocationIndex
);

module.exports = { missionsRouter: router };
