const express = require("express");
const requestController = require("./request-controller");

const router = express.Router();

/**
 * @swagger
 * /api/v2/services/requests/:
 *  post:
 *      tags: [Service Requests]
 *      summary: submit a new request
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  service:
 *                      type: string
 *                      default: TAXI
 *                  gmt_for_date:
 *                      type: string
 *                      default: 2023-01-03T15:46:55+00:00
 *                  locations:
 *                      type: array
 *                      items:
 *                          type: object
 *                          properties:
 *                              coordinates:
 *                                  type: array
 *                                  default: [29.607603 , 52.537465]
 *                              wait:
 *                                  type: integer
 *                              meta:
 *                                  type: object
 *                  details:
 *                      type: object
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", requestController.submitRequest);

/**
 * @swagger
 * /api/v2/services/requests/{id}:
 *  put:
 *      tags: [Service Requests]
 *      summary: update an existing request
 *      parameters:
 *        - in : path
 *          name : id
 *          type : string
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  service:
 *                      type: string
 *                      default: TAXI
 *                  gmt_for_date:
 *                      type: string
 *                      default: 2023-01-03T15:46:55+00:00
 *                  locations:
 *                      type: array
 *                      items:
 *                          type: object
 *                          properties:
 *                              coordinates:
 *                                  type: array
 *                                  default: [29.607603 , 52.537465]
 *                              wait:
 *                                  type: integer
 *                              meta:
 *                                  type: object
 *                  details:
 *                      type: object
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/:id", requestController.updateRequest);

/**
 * @swagger
 * /api/v2/services/requests/{request_id}/history/:
 *  get:
 *      tags:  [Service Requests]
 *      summary: get update history of request
 *      parameters:
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
router.get("/:request_id/history", requestController.getRequestHistory);

/**
 * @swagger
 * /api/v2/services/requests/confirm/{id}:
 *  patch:
 *      tags: [Service Requests]
 *      summary: confirm specfied request
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
router.patch("/confirm/:id", requestController.confirmRequest);

/**
 * @swagger
 * /api/v2/services/requests/reject/{id}:
 *  patch:
 *      tags: [Service Requests]
 *      summary: reject specfied request
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
router.patch("/reject/:id", requestController.rejectRequest);

/**
 * @swagger
 * /api/v2/services/requests/cancel/{id}:
 *  patch:
 *      tags: [Service Requests]
 *      summary: cancel specfied request
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
router.patch("/cancel/:id", requestController.cancelRequest);

/**
 * @swagger
 * /api/v2/services/requests/areal:
 *  get:
 *      tags: [Service Requests]
 *      summary: get list of requests with areal access
 *      parameters:
 *        - in : query
 *          name : search
 *          type : string
 *        - in : query
 *          name : page
 *          type : number
 *        - in : query
 *          name : sort
 *          type : string
 *        - in : query
 *          name : area_id
 *          type : string
 *        - in : query
 *          name : gmt_from
 *          type : string
 *        - in : query
 *          name : gmt_to
 *          type : string
 *        - in : query
 *          name : service
 *          type : string
 *        - in : query
 *          name : submitted_by
 *          type : string
 *        - in : query
 *          name : status
 *          description : comma separated status list
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/areal", requestController.getRequests);

/**
 * @swagger
 * /api/v2/services/requests/mine:
 *  get:
 *      tags: [Service Requests]
 *      summary: get list of requests
 *      parameters:
 *        - in : query
 *          name : page
 *          type : number
 *        - in : query
 *          name : sort
 *          type : string
 *        - in : query
 *          name : area_id
 *          type : string
 *        - in : query
 *          name : gmt_from
 *          type : string
 *        - in : query
 *          name : gmt_to
 *          type : string
 *        - in : query
 *          name : service
 *          type : string
 *        - in : query
 *          name : status
 *          description : comma separated status list
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/mine", requestController.getMyReservedRequests);

/**
 * @swagger
 * /api/v2/services/requests/{id}:
 *  get:
 *      tags: [Service Requests]
 *      summary: get request details
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
router.get("/:id", requestController.getRequestDetails);

module.exports = { requestsRouter: router };
