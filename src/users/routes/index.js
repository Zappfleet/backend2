const { Router } = require("express");
const {
  userSignUp,
  userSignIn,
  userAuth,
  userSignUpVerify,
  refreshUserBearerToken,
  triggerForgetPassword,
  resetUserPassword,
  orgInfo,
  createUser,
  updateUser,
  setUserActive,
  getUserList,
  setUserStatus,
  getUserListByPermissions,
  getPaginatedUsers,
} = require("./user-account-controller");
const { authenticate, restrict } = require("../mid/auth");

const router = Router();

/**
 * @swagger
 * /api/v2/users/auth:
 *  get:
 *      tags: [User Accounts]
 *      summary: get authenticated user and org info. if a bearer token is not specified it sends you org info only
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
router.get("/auth", authenticate, userAuth);

/**
 * @swagger
 * /api/v2/users/sign-in:
 *  post:
 *      tags: [User Accounts]
 *      summary: sign in user
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
 *                                  "username": "...",
 *                                  "password": "..."
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/sign-in", userSignIn);

/**
 * @swagger
 * /api/v2/users/sign-up:
 *  post:
 *      tags: [User Accounts]
 *      summary: sign up user. any field other than `username` , `phone` and `password` will be stored as user `details`
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
 *                                  "key" : "register type key",
 *                                  "username": "...",
 *                                  "phone": "...",
 *                                  "password" : "...",
 *                                  "extra_1" : "e1",
 *                                  "extra_2" : 9774
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/sign-up", userSignUp);

/**
 * @swagger
 * /api/v2/users/sign-up-verify:
 *  post:
 *      tags: [User Accounts]
 *      summary: sign up user. any field other than `username` , `phone` and `password` will be stored as user `details`
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
 *                                  "username": "...",
 *                                  "code": "..."
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/sign-up-verify", userSignUpVerify);

/**
 * @swagger
 * /api/v2/users/refresh-token:
 *  post:
 *      tags: [User Accounts]
 *      summary: create a new short live token for user
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
 *                                  "refresh_token": "..."
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/refresh-token", refreshUserBearerToken);

/**
 * @swagger
 * /api/v2/users/reset-pass:
 *  post:
 *      tags: [User Accounts]
 *      summary: create new secret token and send it as sms
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
 *                                  "username": "..."
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/reset-pass", triggerForgetPassword);

/**
 * @swagger
 * /api/v2/users/reset-pass:
 *  put:
 *      tags: [User Accounts]
 *      summary: reset user password using secret code
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
 *                                  "username": "...",
 *                                  "new_password": "...",
 *                                  "code": "..."
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/reset-pass", resetUserPassword);

/**
 * @swagger
 * /api/v2/users/:
 *  post:
 *      tags: [User Accounts]
 *      summary: create a user. any field other than `username` , `phone` and `password` will be stored as user `details`
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
 *                                  "key" : "register type key",
 *                                  "username": "...",
 *                                  "phone"   : "...",
 *                                  "password": "...",
 *                                  "roles"   : ["..."],
 *                                  "extra_1" : "e1",
 *                                  "extra_2" : 9774,
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/", authenticate, restrict, createUser);

/**
 * @swagger
 * /api/v2/users/{id}:
 *  put:
 *      tags: [User Accounts]
 *      summary: update a user. any field other than `username` , `phone` and `password` will be stored as user `details`
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
 *                                  "username": "...",
 *                                  "phone"   : "...",
 *                                  "password": "...",
 *                                  "extra_1" : "e1",
 *                                  "extra_2" : 9774,
 *                              }
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/:id", authenticate, restrict, updateUser);

/**
 * @swagger
 * /api/v2/users/paginated:
 *  get:
 *      tags: [User Accounts]
 *      summary: get paginated list of users
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : search
 *          type : string
 *        - in : query
 *          name : page
 *          type : number
 *        - in : query
 *          name : sort
 *          description : example >> `{"field_name":-1}`
 *          type : string
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/paginated", authenticate, restrict, getPaginatedUsers);

/**
 * @swagger
 * /api/v2/users:
 *  get:
 *      tags: [User Accounts]
 *      summary: get active users
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
router.get("/", authenticate, restrict, getUserList);

/**
 * @swagger
 * /api/v2/users/permission-filter:
 *  get:
 *      tags: [User Accounts]
 *      summary: get active users filterd by permission. `permissions` is a comma separated set of permission `keys`
 *      security:
 *              - BearerAuth: []
 *      parameters:
 *        - in : query
 *          name : search
 *          type : string
 *        - in : query
 *          name : permissions
 *          type : string
 *        - in : query
 *          name : include_external_base
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
  "/permission-filter",
  authenticate,
  restrict,
  getUserListByPermissions
);

module.exports = {
  userAccountRouter: router,
};
