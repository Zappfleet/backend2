const { serviceRequestStatus, serviceMissionStatus } = require("../services/constatns");
const { listServiceRequests, createImmediateMission, appendRequestToMission, assignVehicleToMission, setMissionStatus, listMissions } = require("../services/data");
const { getRequestDetails } = require("../services/routes/request-controller");
const moment = require("moment");
const { listVechilesNoPaginationSortForMission } = require("../vehicles/data");
const { User } = require("../_old/modules/user/model");
const roles = require("../_old/global_values/roles");
const { getAssignableVechilesForMission } = require("../services/routes/mission-controller");
const { FakeHttpRequest, FakeHttpResponse } = require("../utils-test");
const { vehicleStatus } = require("../vehicles/constants");
const { notifyMissionUpdate } = require("../services/routes/utils");
const { notifyServiceMissionUpdate } = require("../notification-service/emits");


async function exec() {
    const systemAdmin = await User.findOne({ role: roles.admin })

    try {
        await assignPendingRequestsToMissions(systemAdmin);
    } catch (e) {
        console.log(e);
    }

    try {
        await assignVehiclesToPublishedMissions(systemAdmin);
    } catch (e) {
        console.log(e);
    }

}

async function assignVehiclesToPublishedMissions(systemAdmin) {

    const filter = { status: serviceMissionStatus.PUBLISHED.key };
    const { docs: publishedMissions } = await listMissions(filter);
    for (let i = 0; i < publishedMissions.length; i++) {

        const fakeReq = new FakeHttpRequest();
        fakeReq.setPathParams({ mission_id: publishedMissions[i]._id })
        fakeReq.setQueryParams({});

        let operableVehciles;
        const fakeRes = new FakeHttpResponse((data) => operableVehciles = data);
        await getAssignableVechilesForMission(fakeReq, fakeRes);
        if (operableVehciles.docs.length > 0) {

            const { error } = await assignVehicleToMission(publishedMissions[i]._id, operableVehciles.docs[0]._id, systemAdmin._id)
            notifyServiceMissionUpdate(publishedMissions[i]._id);
            if (!error) {
                const resultMission = await setMissionStatus(systemAdmin._id, publishedMissions[i]._id, serviceMissionStatus.READY.key);
                if (!resultMission.error) notifyMissionUpdate(resultMission, publishedMissions[i]._id);
            } else {
                console.log(error);
            }

        } else {
            console.log("No operableVehciles found");
        }
    }

}

async function assignPendingRequestsToMissions(systemAdmin) {
    const { docs } = await listServiceRequests({
        status: serviceRequestStatus.PENDING.key,
        extra: { "details.direct_request": true }
    }, { gmt_for_date: 1 });

    const filtered_doc = docs.filter((item) => {
        const request_date = moment(item.gmt_for_date);
        const now = moment();
        const is_expired = now.isAfter(request_date);
        return !is_expired
    });



    const assignedMissions = await Promise.all(filtered_doc.map(async (request) => {
        const mission = await createImmediateMission({ created_by: systemAdmin._id });
        await appendRequestToMission(mission._id, request._id);
        const { mission: updatedMission } = await setMissionStatus(systemAdmin._id, mission._id, serviceMissionStatus.PUBLISHED.key);
        return updatedMission;
    }));
    return assignedMissions;
}

module.exports = {
    initMissionAssignLoop: (interval = 30_000) => {
        setInterval(exec, interval);
    }
}