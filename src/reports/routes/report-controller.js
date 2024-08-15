const { ObjectId, LEGAL_TCP_SOCKET_OPTIONS } = require("mongodb");
const { ServiceMission } = require("../../services/data/mission-model");
const { IrisaUserbase } = require("../../services/modules/irisaExternalUserbase");
const { Vehicle } = require("../../vehicles/data/vehicle-model")
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

    // console.log(123,date_start,date_end,driver_id);
    // assignDateFilter(missionsFilter, date_start, date_end);

    const missions = await ServiceMission.find(missionsFilter);
    console.log(203, missions);
    return res.status(200).send({
      // driver,
      // currentCar,
      missions,
    });
  }

  async getAgencyCostReport(req, res) {
    //const taxiCars = await Vehicle.find({})// group: { $ne: IRISA } });

    const result = await ServiceMission.aggregate([
      // First lookup to join servicerequests with servicemissions
      {
        $lookup: {
          from: "servicerequests",
          localField: "service_requests.request_id",
          foreignField: "_id",
          as: "result"
        }
      },
      // Unwind the result array to process individual service requests
      {
        $unwind: "$result"
      },
      // Second lookup to join useraccounts with the result
      {
        $lookup: {
          from: "useraccounts",
          localField: "result.submitted_by",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      // Unwind the userDetails array to get individual user details
      {
        $unwind: "$userDetails"
      },
      // Project the fields you need
      {
        $project: {
          _id: 1,
          project_Code: "$result.details.proj_code",
          proj_desc: "$result.details.proj_desc",
          manager_emp_num: "$result.details.manager_emp_num",
          cost_center: "$result.details.cost_center",
          desc: "$result.details.desc",
          cost: "$extra.cost",
          mission_date: "$result.gmt_for_date", // Renaming gmt_for_date to mission_date
          created_by: "$userDetails.full_name",  // Renaming full_name to created_by
          distance: { $ifNull: ["$extra.distance", null] },// Providing a default value for distance
          mission_start: { $ifNull: ["$extra.mission_start", null] },
          mission_end: { $ifNull: ["$extra.mission_end", null] },
        }
      }
    ]);

    // console.log(54,result);
    res.status(200).send({ data: result });
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

    //console.log(100,user_id,dateStart,dateEnd);
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
    // console.log(111,driverTrips);
    driverTrips.map((serviceMission) => {
      const mission_day = moment(serviceMission?.extra?.mission_end)//moment(serviceMission.gmt_for_date)
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
          "extra.mission_end": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $lookup: {
          from: "useraccounts",
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
          name: "$driverInfo.full_name",
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

    const { status, fromdate, todate } = req.query;

    ///////////////////////////////
    var fromDate = new Date(fromdate);
    var toDate = new Date(todate);

    // Set the time part of the "from" date to the start of the day (00:00:00)
    fromDate.setHours(0, 0, 0, 0);

    // Set the time part of the "to" date to the end of the day (23:59:59)
    toDate.setHours(23, 59, 59, 999);

    //console.log(3332,status,fromDate,toDate);
    const aggregationPipeline = [
      {
        $match: {
          status: status
        }
      },
      {
        $match: {
          "extra.mission_end": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $lookup: {
          from: "useraccounts",
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
          mission_start: { $ifNull: ["$extra.mission_end", new Date(0)] },// "$extra.mission_start",
          mission_end: { $ifNull: ["$extra.mission_end", new Date(0)] },//"$extra.mission_end",
          name: "$driverInfo.full_name",
        }
      }
    ];




    const result = await ServiceMission.aggregate(aggregationPipeline);
    console.log(500, result);
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
      for (let i = 1; i < driverRecords.length; i++) {

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


    console.log(11, fromDate, toDate);
    ///////////////////////////////
    var fromDate = fromdate !== null && fromdate !== undefined ? new Date(fromdate) : new Date('1970-01-01'); // تاریخ خیلی قبل;
    var toDate = todate !== null && todate !== undefined ? new Date(todate) : new Date('2100-01-01');   // تاریخ خیلی بعد;

    // Set the time part of the "from" date to the start of the day (00:00:00)
    fromDate?.setHours(0, 0, 0, 0);

    // Set the time part of the "to" date to the end of the day (23:59:59)
    toDate?.setHours(23, 59, 59, 999);

    const aggregationPipeline = [
      {
        $match: {
          status: status,
          "extra.mission_end": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $group: {
          _id: "$driver_id",
          count: { $sum: 1 },
          missions: { $push: "$$ROOT" } // ذخیره کردن اطلاعات مأموریت‌ها
        }
      },
      {
        $lookup: {
          from: "useraccounts",
          localField: "_id",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      {
        $project: {
          id: "$_id",
          name: { $arrayElemAt: ["$driverInfo.full_name", 0] }, // استخراج نام راننده
          driver_id: "$_id",
          countOfServices: "$count",
          missions: "$missions" // اضافه کردن اطلاعات مأموریت‌ها به خروجی
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
