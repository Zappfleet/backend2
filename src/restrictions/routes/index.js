const { checkForPermissionsMiddleware } = require("../../middlewarePublic/checkForPermissionsMiddleware");
const { PermissionSet } = require("../../../src/users/data/constants/permissions");
const restrictionsController = require("./restrictions.controller");
const express = require("express");



const router = express.Router();

/**
 * @swagger
 * /api/v2/restrict/insert_InactiveSystem:
 *   post:
 *     tags: [restrict]
 *     summary: Insert Inactive System
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_InactiveSystem", restrictionsController.insert_InactiveSystem);

/**
 * @swagger
 * /api/v2/restrict/insertRestrictionShowRequests:
 *   post:
 *     tags: [restrict]
 *     summary: insertRestrictionShowRequests
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insertRestrictionShowRequests", restrictionsController.insertRestrictionShowRequests);



/**
 * @swagger
 * /api/v2/restrict/selectRestrictionShowRequests:
 *   get:
 *     tags: [restrict]
 *     summary: selectRestrictionShowRequests
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/selectRestrictionShowRequests", restrictionsController.selectRestrictionShowRequests);



/**
 * @swagger
 * /api/v2/restrict/insertSetWorkingWeek:
 *   post:
 *     tags: [restrict]
 *     summary: insertSetWorkingWeek
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insertSetWorkingWeek", restrictionsController.insertSetWorkingWeek);



/**
 * @swagger
 * /api/v2/restrict/selectSetWorkingWeek:
 *   get:
 *     tags: [restrict]
 *     summary: selectSetWorkingWeek
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/selectSetWorkingWeek", restrictionsController.selectSetWorkingWeek);

/**
 * @swagger
 * /api/v2/restrict/select_InactiveSystem:
 *   get:
 *     tags: [restrict]
 *     summary: Insert Inactive System
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_InactiveSystem", restrictionsController.select_InactiveSystem);


/**
 * @swagger
 * /api/v2/restrict/delete_InactiveSystem/{id}:
 *  delete:
 *      tags: [restrict]
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
router.delete("/delete_InactiveSystem/:id", restrictionsController.delete_InactiveSystem);



/**
 * @swagger
 * /api/v2/restrict/update_InactiveSystem/{id}:
 *  put:
 *      tags: [restrict]
 *      summary: inactivesystemController_update
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
 *                                  "title": "...",
 *                                  "status":"",
 *                                  "start_date" : "",
 *                                  "end_date" : "",
 *                                  "inactive_permissions":[]
 *                              }
 *    
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_InactiveSystem/:id", restrictionsController.update_InactiveSystem);

module.exports = { restrictionsRouter: router };
