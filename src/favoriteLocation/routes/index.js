const express = require("express");
const { authenticate, restrict } = require("../../users/mid/auth");
const favoriteLocations_controller = require("./favoriteLocations-controller");

const router = express.Router();

/**
 * @swagger
 * /api/v2/favoriteLocations/insert_FavoriteLocation:
 *  post:
 *      tags: [favoriteLocations]
 *      summary: create a favorite location.
 *      description : anything other than specified fields is set in `properties`
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.post("/insert_FavoriteLocation", favoriteLocations_controller.insert_FavoriteLocation);

// options.show_privates
// options.show_publics

/**
 * @swagger
 * /api/v2/favoriteLocations/select_FavoriteLocation:
 *  get:
 *      tags: [favoriteLocations]
 *      summary: get favorite locations of user
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/select_FavoriteLocation", favoriteLocations_controller.select_FavoriteLocation);


/**
 * @swagger
 * /api/v2/favoriteLocations/getCars:
 *  get:
 *      tags: [favoriteLocations]
 *      summary: getCars
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.get("/getCars", favoriteLocations_controller.getCars);

/**
 * @swagger
 * /api/v2/favoriteLocations/update_FavoriteLocation/{id}:
 *  put:
 *      tags: [favoriteLocations]
 *      summary: edit a favorite location
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_FavoriteLocation/:id", favoriteLocations_controller.update_FavoriteLocation);

/**
 * @swagger
 * /api/v2/favoriteLocations/delete_FavoriteLocation/{id}:
 *  delete:
 *      tags: [favoriteLocations]
 *      summary: delete a favorite location
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_FavoriteLocation/:id", favoriteLocations_controller.delete_FavoriteLocation);

module.exports = { favoriteLocationsRouter: router };
