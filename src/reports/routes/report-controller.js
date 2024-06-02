const { ObjectId, LEGAL_TCP_SOCKET_OPTIONS } = require("mongodb");
const { ServiceMission } = require("../../services/data/mission-model");
const { IrisaUserbase } = require("../../services/modules/irisaExternalUserbase");
const moment = require("moment");

const { UserAccount } = require("../../users/data/models/user-model");
const { UserRole } = require("../../users/data/models/role-model");
const { listUserRoles } = require("../../users/data/role");
// const { UserRole } = require("../../users/data/models/role-model");

class ReportController {

  async getDriverGeneralReport(req, res) {
    const { driver_id } = req.params;
    const { date_start, date_end } = req.query;

    const missionsFilter = {
      driver_id: new ObjectId(driver_id),
      status: "DONE",
    };

    assignDateFilter(missionsFilter, date_start, date_end);

    const missions = await ServiceMission.find(missionsFilter);

    return res.status(200).send({
      // driver,
      // currentCar,
      missions,
    });
  }

  async getAgencyServiceReport(req, res) {
    const { agency_id } = req.params;
    const { date_start, date_end } = req.query;

    const missionsFilter = {
      vehicle_id: new ObjectId(agency_id),
      status: "DONE",
    };

    assignDateFilter(missionsFilter, date_start, date_end);

    const missions = await ServiceMission.find(missionsFilter);

    return res.status(200).send({
      // driver,
      // currentCar,
      missions,
    });
  }

  async getDriverMissionGroupedDaily(req, res) {
    const { user_id } = req.params;
    const { dateStart, dateEnd } = req.query;

    // const driver = await Driver.findOne({ "user.account_id": accountId });
    // const currentCar = await Car.findOne({ "driver.user.account_id": accountId });

    const missionsFilter = {
      driver_id: new ObjectId(user_id),
      status: "DONE",
    };

    assignDateFilter(missionsFilter, dateStart, dateEnd);

    const driverTrips = await ServiceMission.find(missionsFilter);
    const stats = {
      total_distance: 0,
      total_interval: 0,
    };
    const mission_report = {};
    driverTrips.map((serviceMission) => {
      const mission_day = moment(serviceMission.gmt_for_date)
        .startOf("day")
        .toISOString();
      if (mission_report[mission_day] == null) {
        mission_report[mission_day] = {
          distance: 0,
          mission_duration: 0,
        };
      }

      mission_report[mission_day].distance +=
        serviceMission.extra?.distance || 0;
      mission_report[mission_day].mission_duration +=
        serviceMission.extra?.mission_duration || 0;

      stats.total_distance += serviceMission.extra.distance || 0;
      stats.total_interval += serviceMission.extra.mission_duration || 0;
    });

    return res.status(200).send({
      //   driver,
      // currentCar,
      trip_report: mission_report,
      stats,
    });
  }


  ///////////Report Time Of Services
  async get_MissionsListByStartAndEndDate(req, res) {
    // const { user_id } = req.params;
    //console.log(88, req.query);
    const { status, fromdate, todate } = req.query;

    const missionsFilter = {
      // driver_id: new ObjectId(user_id),
      status: status,
    };
    // assignDateFilter(missionsFilter, dateStart, dateEnd);
    const result = await ServiceMission.find(missionsFilter);
    //const users = await IrisaUserbase.find({})


    ///////////////////////////////
    var fromDate = new Date(fromdate);
    var toDate = new Date(todate);

    // Set the time part of the "from" date to the start of the day (00:00:00)
    fromDate.setHours(0, 0, 0, 0);

    // Set the time part of the "to" date to the end of the day (23:59:59)
    toDate.setHours(23, 59, 59, 999);

    const aggregationPipeline = [
      {
        $match: {
          status: status,
          // Uncomment and adjust these lines if you want to filter by date range
          "extra.mission_start": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $lookup: {
          from: "irisauserbases",
          localField: "driver_id",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      {
        $project: {
          id: "$_id",
          status: "$status",
          mission_start: "$extra.mission_start",
          mission_end: "$extra.mission_end",
          name: { $arrayElemAt: ["$driverInfo.NAM_EMPL", 0] },
          family: { $arrayElemAt: ["$driverInfo.NAM_SNAM_EMPL", 0] },

        }
      }
    ];

    const result2 = await ServiceMission.aggregate(aggregationPipeline);

    ///////////////////////////////////////    

    //console.log(9898);
    return res.status(200).send({
      status: 200,
      data: result2
    });
  }


  ////////////Report DriverList_By_LastServiceAdnDistanse
  async get_DriverList_By_LastServiceAdnDistanse(req, res) {
   // console.log(1456);
    const { status } = req.query;

    // Step 1: Find the role ID for "راننده"
    // const driverRoleId = new ObjectId('663902a02733b1e14bcde2ee')// UserRole.findOne({ title: "راننده" })._id;
    const driverRoleId = (await listUserRoles({ title: "راننده" }))[0]._id;


    // Step 2-5: Aggregation pipeline
    const aggregationPipeline = [
      {
        $match: {
          status: "DONE"
        }
      },
      {
        $lookup: {
          from: "useraccounts",
          localField: "driver_id",
          foreignField: "_id",
          as: "driver"
        }
      },
      {
        $unwind: "$driver"
      },
      {
        $project: {
          _id: 1,
          status: 1,
          created_by: 1,
          gmt_for_date: 1,
          reviews: 1,
          service_requests: 1,
          createdAt: 1,
          updatedAt: 1,
          assigned_by: 1,
          driver_id: 1,
          vehicle_id: 1,
          "mission_start": "$extra.mission_start",
          "mission_end": "$extra.mission_end",
          "mission_duration": "$extra.mission_duration",
          "mission_duration_formatted": "$extra.mission_duration_formatted",
          "driver_full_name": "$driver.full_name",
          "distance": "$extra.distance"
        }
      },
      {
        $sort: {
          mission_end: -1
        }
      }
    ]

    // console.log(4455,UserAccount);
    const result = await ServiceMission.aggregate(aggregationPipeline);
    // console.log(523, result);
    return res.status(200).send({
      status: 200,
      data: result
    });

  }


  ////////////Report Rest Of Services
  async get_RestOfServicesByStartAndEndDate(req, res) {
    //console.log(3332);
    const { status, fromdate, todate } = req.query;

    ///////////////////////////////
    var fromDate = new Date(fromdate);
    var toDate = new Date(todate);

    // Set the time part of the "from" date to the start of the day (00:00:00)
    fromDate.setHours(0, 0, 0, 0);

    // Set the time part of the "to" date to the end of the day (23:59:59)
    toDate.setHours(23, 59, 59, 999);
    const aggregationPipeline = [
      {
        $match: {
          status: status,
          // Uncomment and adjust these lines if you want to filter by date range
          "extra.mission_start": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $lookup: {
          from: "irisauserbases",
          localField: "driver_id",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      {
        $project: {
          id: "$_id",
          driver_id: "$driver_id",  // Ensure the driver_id is included
          status: "$status",
          mission_start: "$extra.mission_start",
          mission_end: "$extra.mission_end",
          name: { $arrayElemAt: ["$driverInfo.NAM_EMPL", 0] },
          family: { $arrayElemAt: ["$driverInfo.NAM_SNAM_EMPL", 0] },
        }
      }
    ];




    const result = await ServiceMission.aggregate(aggregationPipeline);

    ///////////////////////////////////

    let records = result

    // Step 1: Sort the array by driver_id and then by mission_start
    records.sort((a, b) => {
      if (a.driver_id.toString() === b.driver_id.toString()) {
        return a.mission_start - b.mission_start;
      }
      return a.driver_id.toString() > b.driver_id.toString() ? 1 : -1;
    });

    // Step 2: Group records by driver_id
    const groupedRecords = records.reduce((acc, record) => {
      const driverId = record.driver_id.toString();
      if (!acc[driverId]) {
        acc[driverId] = [];
      }
      acc[driverId].push(record);
      return acc;
    }, {});


    // Helper function to convert milliseconds to hh:mm:ss
    function msToTime(duration) {
      let seconds = Math.floor((duration / 1000) % 60);
      let minutes = Math.floor((duration / (1000 * 60)) % 60);
      let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

      hours = (hours < 10) ? "0" + hours : hours;
      minutes = (minutes < 10) ? "0" + minutes : minutes;
      seconds = (seconds < 10) ? "0" + seconds : seconds;

      return hours + ":" + minutes + ":" + seconds;
    }
    // Step 3: Create array of objects with driver_id, mission_start of current record and mission_end of previous record
    const result2 = [];
    for (const driverId in groupedRecords) {
      const driverRecords = groupedRecords[driverId];
      for (let i = 0; i < driverRecords.length; i++) {

        let entry;
        if (driverRecords.length === 1) {
          entry = {
            driver_id: driverRecords[i].driver_id,
            mission_start: driverRecords[i].mission_start,
            RestOfServices: "اولین سرویس",
            name: driverRecords[i].name,  // Ensure name and family are included
            family: driverRecords[i].family
          };
        } else {
          const currentMissionStart = driverRecords[i].mission_start;
          const previousMissionEnd = driverRecords[i - 1].mission_end;

          const currentStartDate = currentMissionStart.toISOString().split('T')[0];
          const previousEndDate = previousMissionEnd.toISOString().split('T')[0];

          let duration;
          if (currentStartDate !== previousEndDate) {
            duration = "اولین سرویس";
          } else {
            const timeDifference = currentMissionStart - previousMissionEnd;
            duration = msToTime(timeDifference);
          }

          entry = {
            id: driverRecords[i].id,
            driver_id: driverRecords[i].driver_id,
            name: driverRecords[i].name,
            family: driverRecords[i].family,
            startCurrentService: driverRecords[i].mission_start,
            endBeforeService: previousMissionEnd,
            RestOfServices: duration
          };
        }
        result2.push(entry);
      }
    }


    // console.log(56, result2);
    ///////////////////////////////////
    //console.log(3333, result);
    return res.status(200).send({
      status: 200,
      data: result2
    });

  }



  ////////////Report Count Of Services
  async get_CountOfServicesByStartAndEndDate(req, res) {
    const { status, fromdate, todate } = req.query;

    ///////////////////////////////
    var fromDate = new Date(fromdate);
    var toDate = new Date(todate);

    // Set the time part of the "from" date to the start of the day (00:00:00)
    fromDate.setHours(0, 0, 0, 0);

    // Set the time part of the "to" date to the end of the day (23:59:59)
    toDate.setHours(23, 59, 59, 999);

    const aggregationPipeline = [
      {
        $match: {
          status: status,
          "extra.mission_start": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $group: {
          _id: "$driver_id",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "irisauserbases",
          localField: "_id",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      {
        $project: {
          id: "$_id",
          name: { $arrayElemAt: ["$driverInfo.NAM_EMPL", 0] },
          family: { $arrayElemAt: ["$driverInfo.NAM_SNAM_EMPL", 0] },
          driver_id: "$_id",
          countOfServices: "$count"
        }
      }
    ];

    const result = await ServiceMission.aggregate(aggregationPipeline);
    // console.log(4444, result);
    return res.status(200).send({
      status: 200,
      data: result
    });

  }


}
//////////////////////////////////////////////////////

function assignDateFilter(filter, dateStart, dateEnd) {
  if (dateStart != null || dateEnd != null) {
    filter.gmt_for_date = {
      $gte: dateStart,
      $lte: dateEnd,
    };
    if (filter.gmt_for_date.$gte == null) delete filter.gmt_for_date.$gte;
    if (filter.gmt_for_date.$lte == null) delete filter.gmt_for_date.$lte;
  }
  return filter;
}

module.exports = new ReportController();
