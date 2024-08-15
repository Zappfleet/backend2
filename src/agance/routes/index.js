
const aganceController = require("./agance-controller");
const express = require("express");

const router = express.Router();



/**
 * @swagger
 * /api/v2/agance/select_Agance:
 *   get:
 *     tags: [agance]
 *     summary: select_Agance
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_Agance", aganceController.select_Agance);


/**
 * @swagger
 * /api/v2/agance/insert_Agance:
 *   post:
 *     tags: [agance]
 *     summary: insert_Agance
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_Agance", aganceController.insert_Agance);


/**
 * @swagger
 * /api/v2/agance/update_Agance/{id}:
 *  put:
 *      tags: [agance]
 *      summary: update_Agance  
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_Agance/:id", aganceController.update_Agance);

/**
 * @swagger
 * /api/v2/agance/delete_Agance/{id}:
 *  delete:
 *      tags: [agance]
 *      summary: delete_Agance
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_Agance/:id", aganceController.delete_Agance);



//sodureParvane


/**
 * @swagger
 * /api/v2/agance/select_sodureParvane:
 *   get:
 *     tags: [sodureParvane]
 *     summary: select_sodureParvane
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_sodureParvane", aganceController.select_sodureParvane);

/**
 * @swagger
 * /api/v2/agance/insert_sodureParvane:
 *   post:
 *     tags: [sodureParvane]
 *     summary: insert_sodureParvane
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_sodureParvane", aganceController.insert_sodureParvane);


/**
 * @swagger
 * /api/v2/agance/update_sodureParvane/{id}:
 *  put:
 *      tags: [sodureParvane]
 *      summary: update_sodureParvane
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_sodureParvane/:id", aganceController.update_sodureParvane);

/**
 * @swagger
 * /api/v2/agance/delete_sodureParvane/{id}:
 *  delete:
 *      tags: [sodureParvane]
 *      summary: delete_sodureParvane
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_sodureParvane/:id", aganceController.delete_sodureParvane);



//aganceDriver
/**
 * @swagger
 * /api/v2/agance/select_AganceDriver:
 *   get:
 *     tags: [aganceDriver]
 *     summary: select_AganceDriver
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_AganceDriver", aganceController.select_AganceDriver);


/**
 * @swagger
 * /api/v2/agance/insert_AganceDriver:
 *   post:
 *     tags: [aganceDriver]
 *     summary: insert_AganceDriver
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_AganceDriver", aganceController.insert_AganceDriver);


/**
 * @swagger
 * /api/v2/agance/update_AganceDriver/{id}:
 *  put:
 *      tags: [aganceDriver]
 *      summary: update_AganceDriver  
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_AganceDriver/:id", aganceController.update_AganceDriver);

/**
 * @swagger
 * /api/v2/agance/delete_AganceDriver/{id}:
 *  delete:
 *      tags: [aganceDriver]
 *      summary: delete_AganceDriver
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_AganceDriver/:id", aganceController.delete_AganceDriver);


//aganceVehicle
/**
 * @swagger
 * /api/v2/agance/select_AganceVehicle:
 *   get:
 *     tags: [aganceVehicle]
 *     summary: select_AganceVehicle
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_AganceVehicle", aganceController.select_AganceVehicle);

/**
 * @swagger
 * /api/v2/agance/select_AganceVehicleByDriverID:
 *   get:
 *     tags: [aganceVehicle]
 *     summary: select_AganceVehicleByDriverID
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_AganceVehicleByDriverID", aganceController.select_AganceVehicleByDriverID);



/**
 * @swagger
 * /api/v2/agance/insert_AganceVehicle:
 *   post:
 *     tags: [aganceVehicle]
 *     summary: insert_AganceVehicle
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_AganceVehicle", aganceController.insert_AganceVehicle);


/**
 * @swagger
 * /api/v2/agance/update_AganceVehicle/{id}:
 *  put:
 *      tags: [aganceVehicle]
 *      summary: update_AganceVehicle  
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_AganceVehicle/:id", aganceController.update_AganceVehicle);

/**
 * @swagger
 * /api/v2/agance/delete_AganceVehicle/{id}:
 *  delete:
 *      tags: [aganceVehicle]
 *      summary: delete_AganceVehicle
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_AganceVehicle/:id", aganceController.delete_AganceVehicle);




//carteSalahiyat


/**
 * @swagger
 * /api/v2/agance/select_carteSalahiyat:
 *   get:
 *     tags: [carteSalahiyat]
 *     summary: select_carteSalahiyat
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_carteSalahiyat", aganceController.select_carteSalahiyat);

/**
 * @swagger
 * /api/v2/agance/insert_carteSalahiyat:
 *   post:
 *     tags: [carteSalahiyat]
 *     summary: insert_carteSalahiyat
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_carteSalahiyat", aganceController.insert_carteSalahiyat);


/**
 * @swagger
 * /api/v2/agance/update_carteSalahiyat/{id}:
 *  put:
 *      tags: [carteSalahiyat]
 *      summary: update_carteSalahiyat
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_carteSalahiyat/:id", aganceController.update_carteSalahiyat);

/**
 * @swagger
 * /api/v2/agance/delete_carteSalahiyat/{id}:
 *  delete:
 *      tags: [carteSalahiyat]
 *      summary: delete_carteSalahiyat
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_carteSalahiyat/:id", aganceController.delete_carteSalahiyat);




//TarefeAvarez

/**
 * @swagger
 * /api/v2/agance/select_TarefeAvarez:
 *   get:
 *     tags: [TarefeAvarez]
 *     summary: select_TarefeAvarez
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_TarefeAvarez", aganceController.select_TarefeAvarez);

/**
 * @swagger
 * /api/v2/agance/insert_TarefeAvarez:
 *   post:
 *     tags: [TarefeAvarez]
 *     summary: insert_TarefeAvarez
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_TarefeAvarez", aganceController.insert_TarefeAvarez);


/**
 * @swagger
 * /api/v2/agance/update_TarefeAvarez/{id}:
 *  put:
 *      tags: [TarefeAvarez]
 *      summary: update_TarefeAvarez
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_TarefeAvarez/:id", aganceController.update_TarefeAvarez);

/**
 * @swagger
 * /api/v2/agance/delete_TarefeAvarez/{id}:
 *  delete:
 *      tags: [TarefeAvarez]
 *      summary: delete_TarefeAvarez
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_TarefeAvarez/:id", aganceController.delete_TarefeAvarez);



//MoayeneFani

/**
 * @swagger
 * /api/v2/agance/select_MoayeneFani:
 *   get:
 *     tags: [MoayeneFani]
 *     summary: select_MoayeneFani
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/select_MoayeneFani", aganceController.select_MoayeneFani);

/**
 * @swagger
 * /api/v2/agance/insert_MoayeneFani:
 *   post:
 *     tags: [MoayeneFani]
 *     summary: insert_MoayeneFani
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.post("/insert_MoayeneFani", aganceController.insert_MoayeneFani);


/**
 * @swagger
 * /api/v2/agance/update_MoayeneFani/{id}:
 *  put:
 *      tags: [MoayeneFani]
 *      summary: update_MoayeneFani
 *      responses:
 *          200:
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.put("/update_MoayeneFani/:id", aganceController.update_MoayeneFani);

/**
 * @swagger
 * /api/v2/agance/delete_MoayeneFani/{id}:
 *  delete:
 *      tags: [MoayeneFani]
 *      summary: delete_MoayeneFani
 *      responses:
 *          200: 
 *              description: Success
 *          401:
 *              description: Unauthraize
 *          500:
 *              description: Internal Error
 */
router.delete("/delete_MoayeneFani/:id", aganceController.delete_MoayeneFani);


//selectAganceProfileByDriverId

/**
 * @swagger
 * /api/v2/agance/selectAganceProfileByDriverId:
 *   get:
 *     tags: [selectAganceProfileByDriverId]
 *     summary: selectAganceProfileByDriverId
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/selectAganceProfileByDriverId", aganceController.selectAganceProfileByDriverId);


module.exports = { aganceRouter: router };