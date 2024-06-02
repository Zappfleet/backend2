const { checkForPermissionsMiddleware } = require("../../middlewarePublic/checkForPermissionsMiddleware");
const { PermissionSet } = require("../../../src/users/data/constants/permissions");
const reportController = require("./report-controller");
const express = require("express");

const router = express.Router();

/**
 * @swagger
 * /api/v2/reports/driver-general/{driver_id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get driver general report
 *     parameters:
 *       - in: path
 *         name: driver_id
 *         type: string
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get(
  "/driver-general/:driver_id",
  reportController.getDriverGeneralReport
);

/**
 * @swagger
 * /api/v2/reports/agency-costs/{agency_id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get agency costs reports
 *     parameters:
 *       - in: path
 *         name: agency_id
 *         type: string
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get("/agency-costs/:agency_id", reportController.getAgencyServiceReport);

/**
 * @swagger
 * /api/v2/reports/driver-daily/{user_id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get reports of driver trips
 *     parameters:
 *       - in: path
 *         name: user_id
 *         type: string
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get(
  "/driver-daily/:user_id",
  reportController.getDriverMissionGroupedDaily
);

/**
 * @swagger
 * /api/v2/reports/TimeOfServices:
 *   get:
 *     tags: [Reports]
 *     summary: Get missions list by start and end date
 *     parameters:
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get(
  "/TimeOfServices",
  (req, res, next) => checkForPermissionsMiddleware({
    user: req.auth,
    permission: [PermissionSet.REPORTS.SERVICE_PERIODS]
  })(req, res, next),
  reportController.get_MissionsListByStartAndEndDate
);

/**
 * @swagger
 * /api/v2/reports/CountOfServices:
 *   get:
 *     tags: [Reports]
 *     summary: Get missions count by start and end date
 *     parameters:
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get(
  "/CountOfServices",
  (req, res, next) => checkForPermissionsMiddleware({
    user: req.auth,
    permission: [PermissionSet.REPORTS.SERVICE_COUNT]
  })(req, res, next),
  reportController.get_CountOfServicesByStartAndEndDate
);

/**
 * @swagger
 * /api/v2/reports/RestOfServices:
 *   get:
 *     tags: [Reports]
 *     summary: Get rest of services by start and end date
 *     parameters:
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get(
  "/RestOfServices",
  (req, res, next) => checkForPermissionsMiddleware({
    user: req.auth,
    permission: [PermissionSet.REPORTS.DRIVER_BREAKS]
  })(req, res, next),
  reportController.get_RestOfServicesByStartAndEndDate
);



/**
 * @swagger
 * /api/v2/reports/DriverList_By_LastServiceAdnDistanse:
 *   get:
 *     tags: [Reports]
 *     summary: Get DriverList_By_LastServiceAdnDistanse
 *     parameters:
 *       - in: query
 *         name: gmt_from
 *         type: string
 *       - in: query
 *         name: gmt_to
 *         type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Error
 */
router.get(
  "/DriverList_By_LastServiceAdnDistanse",
  // (req, res, next) => checkForPermissionsMiddleware({
  //   user: req.auth,
  //   permission: [PermissionSet.REPORTS.DRIVERLIST_LASTMISSION_DISTANCE]
  // })(req, res, next),
  reportController.get_DriverList_By_LastServiceAdnDistanse
);



module.exports = { reportsRouter: router };
