const mongoose = require('mongoose');
const { ServiceRequest: new_Request } = require('../../services/data/service-request-model');
const { ServiceMission: new_Mission } = require('../../services/data/mission-model');
const { Request: old_Requests } = require('../../_old/modules/request/model');
const { Trip: old_trips } = require('../../_old/modules/trip/model');

const { ObjectId } = mongoose.Types;
const config = require("config");
const { serviceRequestStatus, serviceMissionStatus } = require("../../services/constatns");


// Function to connect to MongoDB
const connectToDB = async () => {
    const environment_name = config.get("environment_name");
    let db = "";

    if (environment_name === "local") {
        db = config.get("db");
    } else if (environment_name === "server") {
        db = config.get("db_SERVER");
    } else {
        throw new Error('Unknown environment name');
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`Connected to database`);
};

exports.migrateDataRequest = async function (req, res) {
    let x = {}
    try {
        await connectToDB()
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return;
    }
    try {

        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB connection is not established');
        }

        const oldRequests = await old_Requests.find({})//.limit(5)
        const oldTrips = await old_trips.find({})//.limit(5)

        for (const oldRequest of oldRequests) {

            try {

                const oldTrip = oldTrips.find(trip => trip?.request_ids[0]?.toString() === oldRequest?._id?.toString());

                let createCurrentLocationIndex = -1
                let createStatusRequest = ''
                let createStatusRequestInMission = null
                let createStatusMission = null

                switch (oldRequest.status) {
                    case 9:
                        // "انجام شده";
                        createStatusRequestInMission = serviceMissionStatus.DONE.key
                        createStatusMission = serviceMissionStatus.DONE.key
                        createStatusRequest = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
                        break
                    case 8:
                        // "در سفر";
                        createStatusRequestInMission = serviceMissionStatus.ON_ROUTE.key
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
                        break;
                    case 7:
                        // "در پیش نویس سفر";
                        createStatusRequestInMission = serviceRequestStatus.PENDING.key
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
                        break;

                    case 6:
                        // "رد شده - توزیع کننده";
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.REJECT.key
                        break;
                    case 5:
                        // "دیده شده- توزیع کننده";
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.PENDING.key
                        break;
                    case 4:
                        /// "تایید شده - مدیر پروژه";
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.CONFIRM.key
                        break;
                    case 3:
                        // "رد شده - مدیرپروژه";
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.REJECT.key
                        break;
                    case 2:
                        // "دیده شده - مدیرپروژه";
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.PENDING.key
                        break;
                    case 1:
                        // "لغو شده";
                        createStatusMission = serviceMissionStatus.DRAFT.key
                        createStatusRequest = serviceRequestStatus.CANCEL_USER.key
                        break;
                    case 0:
                        // "ثبت شده";
                        createStatusRequest = serviceRequestStatus.PENDING.key
                        break;
                }

                const createLocations = [
                    {
                        coordinates: oldRequest.locations.start.lnglat,
                        wait: 0, // default wait time
                        meta: {
                            adr: oldRequest.locations.start.adr
                        }
                    },
                    {
                        coordinates: oldRequest.locations.finish.lnglat,
                        wait: 0, // default wait time
                        meta: {
                            adr: oldRequest.locations.finish.adr
                        }
                    }
                ];


                let newRequest = new new_Request({
                    _id: oldRequest._id,
                    locations: createLocations,
                    service: oldRequest.service || "No Services",
                    gmt_for_date: oldRequest.for_date,
                    status: createStatusRequest,
                    submitted_by: oldRequest.creator,
                    confirmed_by: createStatusRequest !== 3 ? oldRequest.dispatcher[0]?.account_id : null,
                    rejected_by: createStatusRequest === 3 ? oldRequest.dispatcher[0]?.account_id : null,
                    details: {
                        userlist: oldRequest.passenger,
                        proj_code: oldRequest.cost_manager.proj_code,
                        cost_center: oldRequest.cost_manager.cost_center,
                        desc: oldRequest.desc,
                        distance: oldRequest.distance_props?.distance,
                        interval: oldRequest.distance_props?.interval,
                    },
                    area: oldRequest.area_id,
                    createdAt: oldRequest.createdAt,
                    updatedAt: oldRequest.updatedAt,
                    __v: oldRequest.__v
                });





                let newMission = createStatusMission && oldRequest.dispatcher[0]?.account_id && new new_Mission({
                    created_by: oldRequest.dispatcher[0]?.account_id,
                    status: createStatusMission,
                    service_requests: createStatusRequest === serviceRequestStatus.ASSIGNED_TO_MISSION.key ? [
                        {
                            request_id: oldRequest._id,
                            status: createStatusRequestInMission,
                            current_location_index: createCurrentLocationIndex,
                        }
                    ] : [],
                    createdAt: oldRequest.createdAt,
                    updatedAt: oldRequest.updatedAt,
                    __v: oldRequest.__v,
                    extra: createStatusRequest === serviceRequestStatus.ASSIGNED_TO_MISSION.key ? {
                        distance: oldRequest.distance_props?.distance,
                        mission_start: oldRequest.status_update_history?.status_4,
                        mission_end: oldRequest.status_update_history?.status_9,
                        //  mission_duration:,
                        // mission_duration_formatted:,
                    } : {},
                    assigned_by: oldRequest.dispatcher[0]?.account_id,
                    driver_id: oldTrip?.driver?.user?.account_id,
                    vehicle_id: oldTrip?.car?.car_id,

                })
                x = newMission
                await new_Request(newRequest).save();
                newMission && await new_Mission(newMission).save();

            } catch (error) {
                console.error(`Error migrating request ID ${oldRequest._id}:`, error.message);
                res.status(500).json({
                    status: "5000",
                    message: "Migration request failed",
                    error: `${error.message}${x} ${oldRequest._id}`
                });
            }
        }
        res.status(200).json({
            status: "200",
            data: oldRequests?.length,
        });
    } catch (error) {
        console.error('Migration request error:', error);
        res.status(500).json({
            status: "5000",
            message: "Migration request failed",
            error: error.message,
        });
    } finally {
        // Close the MongoDB connection
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        } catch (closeError) {
            console.error('Error closing MongoDB connection:', closeError.message);
        }
    }
}
