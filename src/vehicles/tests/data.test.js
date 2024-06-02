const { ConnectDatabase, DropDatabase } = require("../../utils-test");
const { Vehicle } = require("../data/vehicle-model");
const { createVehicle, updateVehicleById, updateVehicleLatestGpsInfo, updateVehicleLatestGpsInfoForAll, insertVehicleGroup, insertVehicleSerivceGroup, getVehicleGroupsAndServices, insertVehicleColor, insertVehicleName, setActiveVehicleGroupByKey, setActiveVehicleServiceGroupByKey, setActiveVehicleColorByKey, setActiveVehicleNameByKey } = require("../data");
const { pushLocationIfFarEnough } = require("../../location/data");
const { default: mongoose } = require("mongoose");
const { PAGE_SIZE } = require("../../constants");
const { insertSampleUserData } = require("../../users/test/sample-data");
const roles = require("../../_old/global_values/roles");
const { vehicleGroups, vehicleStatus, vehicleServices } = require("../constants")
const { listVehicles, assignDriver, findVehicleById, getListOfAssignableDrivers, unassignVehicleDriver } = require("../data");
const { SAMPLE_VEHICLE_DATA } = require("./sample-data");

const existingVehicleDocs = [];
const collections = {};
let exisingUserDocs;

beforeAll(async () => {


    await ConnectDatabase("vechile-service");
    await Vehicle.deleteMany({});
    const insertedVehicles = await Promise.all(SAMPLE_VEHICLE_DATA.map(async (vehicle) => {
        return await createVehicle(vehicle.group, vehicle.driver_user, vehicle.plaque, vehicle.services, vehicle.extra, vehicle.status);
    }));
    for (const data of insertedVehicles) {
        if (data.error) throw { message: "Unexpected error in sample data" }
        existingVehicleDocs.push(data);
    }

    collections.Users = mongoose.connection.db.collection("users");
    exisingUserDocs = await insertSampleUserData();

});

afterAll(async () => {
    await DropDatabase();
});

test("vechile/service group crud", async () => {

    const vehicleGroup = await insertVehicleGroup("تاکسی");
    const vehicleServiceGroup = await insertVehicleSerivceGroup("باربری" , "kg");
    const vechileColor = await insertVehicleColor("قرمز");
    const vehicleName = await insertVehicleName("تیبا");

    expect(vehicleGroup.error).not.toBeTruthy();
    expect(vehicleServiceGroup.error).not.toBeTruthy();
    expect(vechileColor.error).not.toBeTruthy();
    expect(vehicleName.error).not.toBeTruthy();


    const data = await getVehicleGroupsAndServices();

    expect(data.groups.length).toBe(1);
    expect(data.services.length).toBe(1);
    expect(data.colors.length).toBe(1);
    expect(data.names.length).toBe(1);

    const result1 = await setActiveVehicleGroupByKey(vehicleGroup.key, false);
    const result2 = await setActiveVehicleServiceGroupByKey(vehicleServiceGroup.key, false);
    const result3 = await setActiveVehicleColorByKey(vechileColor.key, false);
    const result4 = await setActiveVehicleNameByKey(vehicleName.key, false);

    expect(result1.error).not.toBeTruthy();
    expect(result2.error).not.toBeTruthy();
    expect(result3.error).not.toBeTruthy();
    expect(result4.error).not.toBeTruthy();

    const data2 = await getVehicleGroupsAndServices();

    expect(data2.groups.length).toBe(0);
    expect(data2.services.length).toBe(0);
    expect(data2.colors.length).toBe(0);
    expect(data2.names.length).toBe(0);

})

it("returns assignabled drivers only", async () => {
    const userFilter = { is_active: true, role: roles.driver };
    const { Users } = collections;

    const totalActiveDriverCount = (await Users.find(userFilter).toArray()).length

    const assignCount = 10;
    let driverOffset = 10;
    let vehicleOffset = 10;

    for (let i = 0; i < assignCount; i++) {
        await assignUserToVehicle(userFilter, vehicleOffset + i, driverOffset + i);
    }
    const assignableDrivers = await getListOfAssignableDrivers();
    expect(assignableDrivers.length).toBe(totalActiveDriverCount - assignCount);
});



it("throws error for user being in-active ", async () => {
    const userFilter = { is_active: false, role: roles.driver };
    const { result } = await assignUserToVehicle(userFilter);
    expect(result.error).toContain('driver not found');
})

it("throws error for user being a none-driver", async () => {
    const userFilter = { is_active: true, role: roles.passenger };
    const { result } = await assignUserToVehicle(userFilter);
    expect(result.error).toContain('driver not found');
})

it("successfully assignes/unassign a driver to a vehicle", async () => {
    const userFilter = { is_active: true, role: roles.driver };
    const { result, user } = await assignUserToVehicle(userFilter);
    expect(result.vehicle.driver_user.toString()).toBe(user._id.toString());

    const unassignResult = await unassignVehicleDriver(result.vehicle._id);
    expect(unassignResult.vehicle.driver_user).toBeNull();
})

it("retursn all IDLE vehicles providing DELIVERY_SERVICE", async () => {
    const expectedCount = existingVehicleDocs.filter(
        (item) =>
            item.status == vehicleStatus.IDLE.key &&
            item.services.find((entry) => entry.service == vehicleServices.DELIVERY.key))
        .length;
    const result = await listVehicles({ 'services.service': vehicleServices.DELIVERY.key, "status": vehicleStatus.IDLE.key });
    expect(result.totalDocs).toBe(expectedCount);
})

it("returns all vehicles providing DELIVERY_SERVICE", async () => {
    const expectedCount = existingVehicleDocs.filter((item) => item.services.find((entry) => entry.service == vehicleServices.DELIVERY.key)).length;
    const result = await listVehicles({ 'services.service': vehicleServices.DELIVERY.key });
    expect(result.totalDocs).toBe(expectedCount);
})

it("returns all vehicles in TAXI group", async () => {
    const expectedTaxiCount = existingVehicleDocs.filter((item) => item.group == vehicleGroups.TAXI.key).length;
    const result = await listVehicles({ group: vehicleGroups.TAXI.key });
    expect(result.totalDocs).toBe(expectedTaxiCount);
})

it("returns the third page of sample vehicles", async () => {
    const page = 3;
    const result = await listVehicles(null, null, page);
    expect(result.totalDocs).toBe(SAMPLE_VEHICLE_DATA.length);
    expect(result.totalPages).toBe(parseInt(SAMPLE_VEHICLE_DATA.length / PAGE_SIZE) + 1);
    expect(result.docs.length <= PAGE_SIZE).toBeTruthy();
    expect(result.page).toBe(page);
});



it("throws an error for unspecified capacity", async () => {
    const plaque = "50-b-52-65";
    const extra = { model: "samand", year: 1401 }
    const services = [{
        service: vehicleServices.TAXI.key,
    }];
    const result = await createVehicle(vehicleGroups.VAN.key, null, plaque, services, extra);

    expect(result.error).toContain('Path `capacity` is required');
})

it("throws an error for unspecified plaque", async () => {
    const plaque = null;
    const extra = { model: "samand", year: 1401 }
    const services = [{
        service: vehicleServices.TAXI.key,
        capacity: 3,
    }];
    const result = await createVehicle(vehicleGroups.VAN.key, null, plaque, services, extra);

    expect(result.error).toContain('Path `plaque` is required');
})


it("throws an error for empty services", async () => {
    const plaque = "50-b-52-65";
    const extra = {
        model: "samand",
        year: 1401,
    }
    const services = [];
    const result = await createVehicle(vehicleGroups.VAN.key, null, plaque, services, extra);

    expect(result.error).toContain('services should contain at least one element');
})

it("updates an existing vehicle", async () => {

    const orginalPlaque = "37-w-82-65";
    const orginalExtra = { model: "peugeot", year: 1401 }
    const orginalServices = [{ service: vehicleServices.TAXI.key, capacity: 3 }];
    const originalGroup = vehicleGroups.VAN.key;
    const originalVehicle = await createVehicle(originalGroup, null, orginalPlaque, orginalServices, orginalExtra);

    const updatedPlaque = "54-m-54-65";
    const updatedExtra = { model: "tiba", year: 1400 };
    const updatedGroup = vehicleGroups.TAXI.key;

    const updatedVehicle = await updateVehicleById(originalVehicle._id, updatedGroup, null, updatedPlaque, null, updatedExtra);

    expect(updatedVehicle.status).toBe(originalVehicle.status);
    expect(updatedVehicle.group).toBe(updatedGroup);
    expect(updatedVehicle.driver_user).toBeNull();
    expect(updatedVehicle.plaque).toBe(updatedPlaque);

    expect(updatedVehicle.extra.model).toBe(updatedExtra.model);
    expect(updatedVehicle.extra.year).toBe(updatedExtra.year);


    expect(updatedVehicle.services[0].service).toBe(originalVehicle.services[0].service);
    expect(updatedVehicle.services[0].capacity).toBe(originalVehicle.services[0].capacity);

});

it("creates a vehicle", async () => {

    const plaque = "12-b-12-65";
    const extra = {
        model: "peugeot",
        year: 1401,
    }
    const services = [{
        service: vehicleServices.TAXI.key,
        capacity: 3,
    }];
    const vehicle = await createVehicle(vehicleGroups.VAN.key, null, plaque, services, extra);

    expect(vehicle).not.toBeNull();

    expect(vehicle.status).toBe(vehicleStatus.IDLE.key);
    expect(vehicle.group).toBe(vehicleGroups.VAN.key);
    expect(vehicle.driver_user).toBeNull();
    expect(vehicle.plaque).toBe(plaque);

    expect(vehicle.extra.model).toBe(extra.model);
    expect(vehicle.extra.year).toBe(extra.year);


    expect(vehicle.services[0].service).toBe(services[0].service);
    expect(vehicle.services[0].capacity).toBe(services[0].capacity);

    await vehicle.delete();

});

it("finds a newly created vehicle", async () => {
    const plaque = "88-p-12-65";
    const extra = { model: "rana", year: 1388, some_other_field: 6687 };
    const services = [{ service: vehicleServices.TAXI.key, capacity: 3 }];
    const group = vehicleGroups.VAN.key;
    const { _id } = await createVehicle(group, null, plaque, services, extra);

    const vehicle = await findVehicleById(`${_id}`);

    expect(vehicle).not.toBeNull();

    expect(vehicle.status).toBe(vehicleStatus.IDLE.key);
    expect(vehicle.group).toBe(group);
    expect(vehicle.driver_user).toBeNull();
    expect(vehicle.plaque).toBe(plaque);

    expect(vehicle.extra.model).toBe(extra.model);
    expect(vehicle.extra.year).toBe(extra.year);
    expect(vehicle.extra.some_other_field).toBe(extra.some_other_field);
    expect(vehicle.extra.some_undefined_field).toBe(undefined);

    expect(vehicle.services[0].service).toBe(services[0].service);
    expect(vehicle.services[0].capacity).toBe(services[0].capacity);

})

// it("throws error for user already being a driver ", async () => {
//     const userFilter = { is_active: true, role: roles.driver };
//     const userOffset = 30;
//     await assignUserToVehicle(userFilter, 10, userOffset);
//     const { result } = await assignUserToVehicle(userFilter, 15, userOffset);
//     expect(result.error).toContain('the driver is already assigned');
// })

// test("vechile area detection", async () => {
//     const vechile = await newSimpleVehicle("qq-ww-ee-rr");
//     const SHRZ = {
//         lng: 52.529754638671875,
//         lat: 29.633755425777093
//     }
//     const ESF = {
//         lng: 51.68792723609376,
//         lat: 32.72144315007595
//     }
//     await pushLocationIfFarEnough(vechile._id, ESF.lng, ESF.lat, new Date, 100);
//     await pushLocationIfFarEnough(vechile._id, SHRZ.lng, SHRZ.lat, new Date, 100);
//     expect(vechile.latest_location_info).toBe(undefined);
//     const updatedVechile = await updateVehicleLatestGpsInfo(vechile._id);

//     expect(updatedVechile.latest_location_info.area).not.toBeNull();

//     await updateVehicleLatestGpsInfoForAll();
// })

async function assignUserToVehicle(userFilter, VechileIndex = 0, userOffset = 0) {
    const { Users } = collections;
    const user = await Users.findOne(userFilter, { skip: userOffset });
    const vehicle = existingVehicleDocs[VechileIndex]
    return {
        result: await assignDriver(vehicle._id.toString(), user._id),
        user
    }
}


async function newSimpleVehicle(plaque) {
    const extra = { model: "samand", year: 1401 }
    const services = [{
        service: vehicleServices.TAXI.key,
        capacity: 1,
    }];
    const gps_uid = "dummyid";
    return await createVehicle(vehicleGroups.VAN.key, null, plaque, services, extra, null, gps_uid);
}