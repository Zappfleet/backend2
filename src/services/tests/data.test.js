test("dummy" , ()=>{})
// const { ObjectId } = require("mongodb");
// const { default: mongoose } = require("mongoose");
// // const { insertSampleAreaData } = require("../../areas/test/sample-data");
// // const { insertSampleUserData } = require("../../users/test/sample-data");
// const { getRandomInt } = require("../../utils");
// const { ConnectDatabase, DropDatabase } = require("../../utils-test");
// const { vehicleServices, vehicleGroups } = require("../../vehicles/constants");
// const { createVehicle } = require("../../vehicles/data");
// const { Vehicle } = require("../../vehicles/data/vehicle-model");
// const roles = require("../../_old/global_values/roles");
// const { serviceRequestStatus, serviceMissionStatus, assignedRequestStatus } = require("../constatns");
// const { createServiceRequest, updateServiceRequest, listServiceRequests, createDraftMission, appendRequestToMission, removeRequestFromMission, assignVehicleToMission, removeVehicleFromMission, setMissionStatus, setMissionRequestStatus } = require("../data");
// const { ServiceRequest } = require("../data/service-request-model");
// const { ServiceStatusHistory } = require("../data/service-status-history-model");
// const { generateRandomLocations, autoDate } = require("./sample-data");


// const collections = {};

// let service_data_1, service_data_2 , exisingUserDocs, existingAreaDocs;

// beforeAll(async () => {
//     await ConnectDatabase("services");
//     await ServiceRequest.deleteMany({});
//     await Vehicle.deleteMany({});
//     await ServiceStatusHistory.deleteMany({});

//     collections.Users = mongoose.connection.db.collection("users");
//     collections.Areas = mongoose.connection.db.collection("areas");

//     exisingUserDocs = await insertSampleUserData();
//     existingAreaDocs = await insertSampleAreaData();


//     service_data_1 = {
//         locations: generateRandomLocations(2),
//         service: vehicleServices.TAXI.key,
//         gmt_for_date: autoDate.next().value.toISOString(),
//         submitted_by: new ObjectId(),
//         details: {
//             passengers: ["امید رضا", "محمد"],
//             phone: "09362370299",
//         }
//     };

//     service_data_2 = {
//         locations: generateRandomLocations(2),
//         service: vehicleServices.DELIVERY.key,
//         gmt_for_date: autoDate.next().value.toISOString(),
//         submitted_by: new ObjectId(),
//         details: {}
//     };

// });

// afterAll(async () => {
//     await DropDatabase();
// });


// test("mission status update", async () => {

//     const dummyId_1 = new ObjectId();
//     const dummyId_2 = new ObjectId();

//     const mission = await createDraftMission(dummyId_1);
//     expect(mission.status).toBe(serviceMissionStatus.DRAFT.key);
//     const result = await setMissionStatus(dummyId_2, mission._id, serviceMissionStatus.ON_ROUTE.key);
    
//     expect(result.mission.status).toBe(serviceMissionStatus.ON_ROUTE.key);

//     expect(result.history_entry.applied_by_user.toString()).toBe(dummyId_2.toString());
//     expect(result.history_entry.service_mission.toString()).toBe(mission._id.toString());
//     expect(result.history_entry.update_info.status_from).toBe(serviceMissionStatus.DRAFT.key);
//     expect(result.history_entry.update_info.status_to).toBe(serviceMissionStatus.ON_ROUTE.key);
//     await mission.delete();
// });

// test("vehicle assign/remove", async () => {
//     const sampleVehicle = await createSampleVehicle(vehicleServices.TAXI.key, true);

//     const mission = await createDraftMission(exisingUserDocs[0].insertedId);
//     const result = await assignVehicleToMission(mission._id, sampleVehicle._id, exisingUserDocs[0].insertedId);

//     expect(result.mission.assigned_by.toString()).toBe(exisingUserDocs[0].insertedId.toString());
//     expect(result.mission._id.toString()).toBe(mission._id.toString());
//     expect(result.vehicle._id.toString()).toBe(sampleVehicle._id.toString());

//     const removeResult = await removeVehicleFromMission(mission._id);

//     expect(removeResult.vehicle_id).toBe(undefined);

//     await sampleVehicle.delete();
//     await mission.delete();
// })

// it("throws error for driverless vehicle", async () => {
//     const sampleVehicle = await createSampleVehicle(vehicleServices.TAXI.key);
//     const mission = await createDraftMission(exisingUserDocs[0].insertedId);
//     const result = await assignVehicleToMission(mission._id, sampleVehicle._id, exisingUserDocs[0].insertedId);

//     expect(result.error).toContain("not have a driver")

//     await sampleVehicle.delete();
//     await mission.delete();

// });


// it("throws error on request already assigned", async () => {
//     const request = await createRequest(service_data_1);
//     const mission = await createDraftMission(exisingUserDocs[0].insertedId);

//     await appendRequestToMission(mission._id, request._id);
//     const result = await appendRequestToMission(mission._id, request._id);

//     expect(result.error).toContain('already assigned');

//     await mission.delete();
//     await request.delete();
// })

// test("request assign/remove", async () => {
//     const dummyUserId = new ObjectId();
//     const request = await createRequest(service_data_1);
//     const mission = await createDraftMission(dummyUserId);

//     const result = await appendRequestToMission(mission._id, request._id);

//     expect(result.mission._id.toString()).toBe(mission._id.toString());
//     expect(result.serviceRequest._id.toString()).toBe(request._id.toString());

//     expect(result.serviceRequest.status).toBe(serviceRequestStatus.ASSIGNED_TO_MISSION.key);

//     const removeResult = await removeRequestFromMission(mission._id, request._id);
//     expect(removeResult.mission.service_requests.length).toBe(0);
//     expect(removeResult.serviceRequest.status).toBe(serviceRequestStatus.CONFIRM_ADMIN.key);

//     await mission.delete();
//     await request.delete();
// });

// test("mission request status update", async () => {
//     const dummyUserId = new ObjectId();
//     const dummyApplyUserId = new ObjectId();

//     const request1 = await createRequest(service_data_1);
//     const request2 = await createRequest(service_data_2);
//     const mission = await createDraftMission(dummyUserId);

//     const r = await appendRequestToMission(mission._id, request1._id);
//     const r2 = await appendRequestToMission(mission._id, request2._id);


//     const { mission: updatgedMission1, history_entry: history_entry_1 } = await setMissionRequestStatus(dummyApplyUserId, mission._id, request2._id, assignedRequestStatus.ON_ROUTE.key, 0);
//     expect(updatgedMission1.service_requests[1].status).toBe(assignedRequestStatus.ON_ROUTE.key);
//     expect(updatgedMission1.service_requests[1].current_location_index).toBe(0);

//     expect(history_entry_1[0].applied_by_user.toString()).toBe(dummyApplyUserId.toString());
//     expect(history_entry_1[0].service_request.toString()).toBe(request2._id.toString());
//     expect(history_entry_1[0].service_mission.toString()).toBe(mission._id.toString());
//     expect(history_entry_1[0].update_info.status_from).toBe(assignedRequestStatus.PENDING.key);
//     expect(history_entry_1[0].update_info.status_to).toBe(assignedRequestStatus.ON_ROUTE.key);

//     const { mission: updatgedMission2, history_entry: history_entry_2 } = await setMissionRequestStatus(dummyApplyUserId, mission._id, request2._id, assignedRequestStatus.ON_ROUTE.key, 1);
//     expect(updatgedMission2.service_requests[1].status).toBe(assignedRequestStatus.DONE.key);
//     expect(updatgedMission2.service_requests[1].current_location_index).toBe(1);

//     expect(history_entry_2[0].applied_by_user.toString()).toBe(dummyApplyUserId.toString());
//     expect(history_entry_2[0].service_request.toString()).toBe(request2._id.toString());
//     expect(history_entry_2[0].service_mission.toString()).toBe(mission._id.toString());
//     expect(history_entry_2[0].update_info.status_from).toBe(assignedRequestStatus.ON_ROUTE.key);
//     expect(history_entry_2[0].update_info.status_to).toBe(assignedRequestStatus.DONE.key);

//     await mission.delete();
//     await request1.delete();
//     await request2.delete();
// });

// it("create a mission draft", async () => {
//     const draftMission = await createDraftMission(exisingUserDocs[0].insertedId);
//     expect(draftMission).not.toBeNull();
//     await draftMission.delete();
// })

// it("gets filtered list of requests based on area", async () => {
//     const count = 10;
//     for (let i = 0; i < count; i++) {
//         await createRequest(service_data_1);
//     }
//     const filter = { area_id: existingAreaDocs[0].insertedId };
//     const requests = await listServiceRequests(filter);
//     expect(requests.docs.length).toBe(count);
//     await ServiceRequest.deleteMany({});
// })

// it("updates an existing service request", async () => {

//     const originalData = { ...service_data_1 };
//     const { _id } = await createRequest(originalData);

//     const updateData = { ...service_data_2 };
//     const updatedRequest = await updateServiceRequest(_id.toString(), updateData.locations, updateData.service, updateData.gmt_for_date, updateData.details);

//     expect(updatedRequest.service).toBe(updateData.service);
//     expect(updatedRequest.gmt_for_date.toISOString()).toBe(updateData.gmt_for_date);

//     expect(updatedRequest.submitted_by.toString()).toBe(originalData.submitted_by);
//     expect(updatedRequest.confirmed_by).toBeNull();

//     for (let i = 0; i < updateData.locations.length; i++) {
//         expect(updatedRequest.locations[i].lat).toBe(updateData.locations[i].lat);
//         expect(updatedRequest.locations[i].lng).toBe(updateData.locations[i].lng);
//         expect(updatedRequest.locations[i].wait).toBe(updateData.locations[i].wait);
//     }

//     expect(Object.keys(updatedRequest.details).length).toBe(0);

//     await updatedRequest.delete();

// })

// it("creates a new service request", async () => {

//     const newRequest = await createRequest(service_data_1);
//     expect(newRequest.service).toBe(service_data_1.service);
//     expect(newRequest.gmt_for_date.toISOString()).toBe(service_data_1.gmt_for_date);

//     expect(newRequest.submitted_by.toString()).toBe(service_data_1.submitted_by);

//     for (let i = 0; i < service_data_1.locations.length; i++) {
//         expect(newRequest.locations[i].lat).toBe(service_data_1.locations[i].lat);
//         expect(newRequest.locations[i].lng).toBe(service_data_1.locations[i].lng);
//         expect(newRequest.locations[i].wait).toBe(service_data_1.locations[i].wait);
//     }

//     expect(newRequest.details.phone).toBe(service_data_1.details.phone);
//     expect(newRequest.details.passengers[0]).toBe(service_data_1.details.passengers[0]);
//     expect(newRequest.details.passengers[1]).toBe(service_data_1.details.passengers[1]);

//     await newRequest.delete();

// })

// async function createSampleVehicle(service, assignDriverId) {
//     const plaque = `${getRandomInt(1000, 2000)}-${getRandomInt(1000, 2000)}`;
//     const extra = { model: "samand", year: 1401 }
//     const services = [{ service, capacity: 3, }];

//     let driverId = null;
//     if (assignDriverId) {
//         const sampledDrivevr = await collections.Users.findOne({ is_active: true, role: roles.driver });
//         driverId = sampledDrivevr._id;
//     }

//     return await createVehicle(vehicleGroups.VAN.key, driverId, plaque, services, extra);
// }

// async function createRequest(data) {
//     return await createServiceRequest(data.submitted_by, data.locations, data.service, data.gmt_for_date, data.details);
// }