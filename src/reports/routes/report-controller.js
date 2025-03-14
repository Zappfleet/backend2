const { ObjectId, LEGAL_TCP_SOCKET_OPTIONS } = require("mongodb");
const { ServiceMission } = require("../../services/data/mission-model");
const { IrisaUserbase } = require("../../services/modules/irisaExternalUserbase");
const { Vehicle } = require("../../vehicles/data/vehicle-model")
const moment = require("moment");
const ExcelJS=require("exceljs");
const { UserAccount } = require("../../users/data/models/user-model");
const { UserRole } = require("../../users/data/models/role-model");
const { listUserRoles } = require("../../users/data/role");
// const { UserRole } = require("../../users/data/models/role-model");

class ReportController {

 
   async download_Excel(req , res){
    try {
       const { headers, rows } = req.body;     // ایجاد فایل اکسل  

     const workbook = new ExcelJS.Workbook(); 
      const worksheet = workbook.addWorksheet("گزارش"); 

     worksheet.addRow(headers); // اضافه کردن هدرها   

     rows.forEach(row => worksheet.addRow(row)); // اضافه کردن داده‌ها 

     // تنظیمات استایل (اختیاری)   
   worksheet.columns.forEach(column => { column.width = 20; // تنظیم عرض ستون‌ها  
    });
     // ساخت خروجی به صورت فایل باینری  
     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
     res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    await workbook.xlsx.write(res); res.end();
  
}catch (error) {
     console.error("خطا در تولید فایل اکسل:", error);
      res.status(500).send("خطا در تولید فایل اکسل"); }
   }
    

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
      // First match to filter by status "DONE"
      {
        $match: { status: "DONE" }
      },
      // Lookup to join vehicles and filter based on group "agency"
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "_id",
          as: "vehicleDetails"
        }
      },
      // Unwind the vehicleDetails array to process individual vehicles
      {
        $unwind: {path:"$vehicleDetails",
          preserveNullAndEmptyArrays:true
        }
       
      },

      // Match to ensure vehicle group is "agency"
      //{
       // $match: { "vehicleDetails.group": "agency" }
      //},
      // First lookup to join servicerequests with servicemissions

      {
        $lookup: {
          from: "useraccounts",
          localField: "driver_id",
          foreignField: "_id",
          as: "driverDetails"
        }
      },


      {
        $unwind:{path: "$driverDetails",
          preserveNullAndEmptyArrays:true
        }
      },

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
      // Lookup to join useraccounts with the confirmed_by field in servicerequests
      {
        $lookup: {
          from: "useraccounts",
          localField: "result.confirmed_by",
          foreignField: "_id",
          as: "confirmedByDetails"
        }
      },
      // Unwind the confirmedByDetails array to get individual confirmed_by details
      {
        $unwind: {
          path: "$confirmedByDetails",
          preserveNullAndEmptyArrays: true // In case confirmed_by is null
        }
      },
      // Project the fields you need
      {
        $project: {
          _id: 1,
          project_Code: "$result.details.proj_code",
          proj_desc: "$result.details.proj_desc",
          manager_emp_num: "$result.details.manager_emp_num",
          bill_number: "$extra.bill_number",
          cost_center: "$result.details.cost_center",
          cost_agance: "$extra.bill_cost",
          cost: "$extra.cost",
          mission_date: "$result.gmt_for_date", // Renaming gmt_for_date to mission_date
          created_by: "$userDetails.full_name",  // Renaming full_name to created_by
          num_personel:"$userDetails.details.NUM_PRSN_EMPL",
          distance_dasti: "$extra.trip_distance",
          trip_stop:"$extra.trip_stop",
          distance: { $divide: [{$ifNull:["$extra.distance", 0]},1000] }, // Providing a default value for distance
          mission_start: {$arrayElemAt:['$result.locations.meta.address',0]},
          mission_end: {$arrayElemAt:['$result.locations.meta.address',1]},
          agency_name: "$vehicleDetails.extra.agency_name", // Adding agency_name from vehicle extra
          driver_name:"$driverDetails.full_name",
          confirmed_by: "$confirmedByDetails.full_name",
          //status:"$result.status"
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
        $lookup: {
          from: "vehicles", // ارتباط با جدول vehicles
          localField: "vehicle_id", // فیلدی که در servicemission با vehicleId مطابقت دارد
          foreignField: "_id",
          as: "vehicleInfo"
        }
      },
      {
        $project: {
          id: "$_id",
          status: "$status",
          mission_start: "$extra.mission_start",
          mission_end: "$extra.mission_end",
          name: {
            $cond: {
              if: { $eq: [{ $arrayElemAt: ["$vehicleInfo.group", 0] }, 'agency'] },
              then: { $arrayElemAt: ["$vehicleInfo.extra.agency_name", 0] }, // مقدار از vehicles
              else: { $arrayElemAt: ["$driverInfo.full_name", 0] } // مقدار از driverInfo
            }
          }
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


  async get_CountOfServicesByStartAndEndDate(req, res) {
    const { status, fromdate, todate, type } = req.query;

    var fromDate = fromdate ? new Date(fromdate) : new Date('1970-01-01');
    var toDate = todate ? new Date(todate) : new Date('2100-01-01');

    fromDate.setHours(0, 0, 0, 0); // شروع روز
    toDate.setHours(23, 59, 59, 999); // پایان روز

    const aggregationPipeline = (type === 'Daily') ?
      [
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
            _id: {
              driver_id: "$driver_id",
              vehicle_id: "$vehicle_id",
              day: {
                $dateToString: { format: "%Y-%m-%d", date: "$extra.mission_end" }
              }
            },
            count: { $sum: 1 },
            missions: { $push: "$$ROOT" } // ذخیره کردن اطلاعات مأموریت‌ها
          }
        },
        {
          $lookup: {
            from: "useraccounts",
            localField: "_id.driver_id", // ممکن است driver_id وجود نداشته باشد
            foreignField: "_id",
            as: "driverInfo"
          }
        },
        {
          $lookup: {
            from: "vehicles",
            localField: "missions.vehicle_id", // ممکن است vehicle_id وجود نداشته باشد
            foreignField: "_id",
            as: "vehicleInfo"
          }
        },
        {
          $project: {
            date: "$_id.day",
            driver_id: "$_id.driver_id",
            name: {
              $cond: {
                if: { $gt: [{ $size: "$driverInfo" }, 0] }, // اگر اطلاعات راننده وجود داشت
                then: { $arrayElemAt: ["$driverInfo.full_name", 0] },
                else: "---" // در غیر این صورت "راننده نامشخص"
              }
            },
            vehicleInfo: {
              $cond: {
                if: { $gt: [{ $size: "$vehicleInfo" }, 0] }, // اگر اطلاعات خودرو وجود داشت
                then: { $arrayElemAt: ["$vehicleInfo", 0] },
                else: "---" // در غیر این صورت "خودرو نامشخص"
              }
            },
            userInfo: {
              $cond: {
                if: { $gt: [{ $size: "$driverInfo" }, 0] },
                then: { $arrayElemAt: ["$driverInfo", 0] },
                else: null
              }
            },
            countOfServices: "$count",
            missions: "$missions"
          }
        }
        ,
        {
          $sort: { name: 1, date: 1 } // مرتب‌سازی بر اساس نام و تاریخ
        }
      ]
      // [
      //   {
      //     $match: {
      //       status: status,
      //       "extra.mission_end": {
      //         $gte: fromDate,
      //         $lte: toDate
      //       }
      //     }
      //   },
      //   {
      //     $group: {
      //       _id: {
      //         driver_id: "$driver_id",
      //         day: {
      //           $dateToString: { format: "%Y-%m-%d", date: "$extra.mission_end" }
      //         }
      //       },
      //       count: { $sum: 1 },
      //       missions: { $push: "$$ROOT" } // ذخیره کردن اطلاعات مأموریت‌ها
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: "useraccounts",
      //       localField: "_id.driver_id",
      //       foreignField: "_id",
      //       as: "driverInfo"
      //     }
      //   },
      //   {
      //     $project: {
      //       date: "$_id.day", // روز
      //       driver_id: "$_id.driver_id",
      //       name: { $arrayElemAt: ["$driverInfo.full_name", 0] }, // نام راننده
      //       countOfServices: "$count",
      //       missions: "$missions" // اطلاعات مأموریت‌ها
      //     }
      //   },
      //   {
      //     $sort: { name: 1, date: 1 } // مرتب‌سازی بر اساس تاریخ
      //   }
      // ]
      :
      [
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
      ]

    const result = await ServiceMission.aggregate(aggregationPipeline);

    return res.status(200).send({
      status: 200,
      data: result
    });
  }



  ////////////Report Count Of Services
  // async get_CountOfServicesByStartAndEndDate(req, res) {
  //   const { status, fromdate, todate } = req.query;


  //   console.log(11, fromDate, toDate);
  //   ///////////////////////////////
  //   var fromDate = fromdate !== null && fromdate !== undefined ? new Date(fromdate) : new Date('1970-01-01'); // تاریخ خیلی قبل;
  //   var toDate = todate !== null && todate !== undefined ? new Date(todate) : new Date('2100-01-01');   // تاریخ خیلی بعد;

  //   // Set the time part of the "from" date to the start of the day (00:00:00)
  //   fromDate?.setHours(0, 0, 0, 0);

  //   // Set the time part of the "to" date to the end of the day (23:59:59)
  //   toDate?.setHours(23, 59, 59, 999);

  //   const aggregationPipeline = [
  //     {
  //       $match: {
  //         status: status,
  //         "extra.mission_end": {
  //           $gte: fromDate,
  //           $lte: toDate
  //         }
  //       }
  //     },
  //     {
  //       $group: {
  //         _id: "$driver_id",
  //         count: { $sum: 1 },
  //         missions: { $push: "$$ROOT" } // ذخیره کردن اطلاعات مأموریت‌ها
  //       }
  //     },
  //     {
  //       $lookup: {
  //         from: "useraccounts",
  //         localField: "_id",
  //         foreignField: "_id",
  //         as: "driverInfo"
  //       }
  //     },
  //     {
  //       $project: {
  //         id: "$_id",
  //         name: { $arrayElemAt: ["$driverInfo.full_name", 0] }, // استخراج نام راننده
  //         driver_id: "$_id",
  //         countOfServices: "$count",
  //         missions: "$missions" // اضافه کردن اطلاعات مأموریت‌ها به خروجی
  //       }
  //     }
  //   ];

  //   const result = await ServiceMission.aggregate(aggregationPipeline);

  //   // console.log(4444, result);
  //   return res.status(200).send({
  //     status: 200,
  //     data: result
  //   });

  // }


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
