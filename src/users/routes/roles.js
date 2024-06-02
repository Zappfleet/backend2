const { Router } = require("express");
const {
  submitUserRole,
  updateUserRole,
  getUserRoles,
  setUserActivity,
  getAllPermissions,
  deligatePermissionsToOthers,
  getDeligationsOnOtherUser,
} = require("./user-roles-controller");

const router = Router();

/**
 * @swagger
 * /api/v2/roles:
 *  post:
 *      tags: [User Roles]
 *      summary: submit user roles. `auto_assign_rules` specifies the condition in witch the roles is assigned to user on register
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
 *                                  "title": "...",
 *                                  "permissions": ["..."],
 *                                  "auto_assign_rules" : [{"key": ".." , "value" : "..."}],
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", submitUserRole);

/**
 * @swagger
 * /api/v2/roles/{role_id}:
 *  put:
 *      tags: [User Roles]
 *      summary: update user roles. `auto_assign_rules` specifies the condition in witch the roles is assigned to user on register
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : path
 *          name : role_id
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
 *                                  "permissions": ["..."],
 *                                  "auto_assign_rules" : [{"key": ".." , "value" : "..."}],
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/:role_id", updateUserRole);

/**
 * @swagger
 * /api/v2/roles:
 *  get:
 *      tags: [User Roles]
 *      summary: get list of user roles
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
router.get("/", getUserRoles);

/**
 * @swagger
 * /api/v2/roles/{role_id}:
 *  patch:
 *      tags: [User Roles]
 *      summary: active or deactive a role
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : path
 *          name : role_id
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
 *                                  "active": "..."
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.patch("/:role_id", setUserActivity);

/**
 * @swagger
 * /api/v2/roles/permissions:
 *  get:
 *      tags: [User Roles]
 *      summary: get list of user roles
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
router.get("/permissions", getAllPermissions);

/**
 * @swagger
 * /api/v2/roles/permissions/deligate:
 *  post:
 *      tags: [User Roles]
 *      summary: deligate permissions to another user
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
 *                                  "other_user_id" : "...",
 *                                  "add_permits": ["..."],
 *                                  "revoke_permits": ["..."],
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/permissions/deligate", deligatePermissionsToOthers);

/**
 * @swagger
 * /api/v2/roles/permissions/deligate/{other_user_id}:
 *  get:
 *      tags: [User Roles]
 *      summary: get deligation object on other user
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : path
 *          name : other_user_id
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/permissions/deligate/:other_user_id", getDeligationsOnOtherUser);

module.exports = {
  userRolesRouter: router,
};
