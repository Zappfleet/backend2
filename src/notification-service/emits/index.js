const { SocketService, Rooms } = require("..");
const { readMissionDetails } = require("../../services/data");


async function notifyNewServiceMission(mission_id, notif) {
    const { broadCast, mission_details } = await buildMissinBroadcast(mission_id);
    broadCast.emit("mission", { action: "new", mission_details, notif });
}

async function notifyDeleteServiceMission(mission_id, notif) {
    const { broadCast, mission_details } = await buildMissinBroadcast(mission_id);
    broadCast.emit("mission", { action: "delete", mission_details, notif });
}

async function notifyServiceMissionUpdate(mission_id, notif) {
    const { broadCast, mission_details } = await buildMissinBroadcast(mission_id);
    broadCast.emit("mission", { action: "update", mission_details, notif });
}

async function notifyNewServiceRequest(request_id) {
    if (request_id == null) throw { message: "Programmer Error : please set request_id" };
    SocketService.io.to(Rooms.ROOM_ADMIN).to(Rooms.ROOM_REQUEST(request_id)).emit("request", { action: "new", request_id });
}

async function notifyServiceRequestUpdate(request_id) {
    if (request_id == null) throw { message: "Programmer Error : please set request_id" };
    SocketService.io.to(Rooms.ROOM_ADMIN).to(Rooms.ROOM_REQUEST(request_id)).emit("request", { action: "update", request_id });
}

async function notifyErrorMessageToSpecificUser(user_id, message) {
    SocketService.io.to(Rooms.ROOM_USER(user_id)).emit("error-message", { message });
}

async function buildMissinBroadcast(mission_id) {
    if (mission_id == null) throw { message: "Programmer Error : please set mission_id" };
    const mission_details = await readMissionDetails(mission_id);
    let broadCast = SocketService.io.to(Rooms.ROOM_ADMIN);

    if (mission_details.vehicle?.driver_user?._id) {
        broadCast = broadCast.to(Rooms.ROOM_DRIVER(`${mission_details.vehicle.driver_user._id}`));
    }
    return { broadCast, mission_details };
}


module.exports.notifyNewServiceMission = notifyNewServiceMission;
module.exports.notifyServiceMissionUpdate = notifyServiceMissionUpdate;
module.exports.notifyServiceRequestUpdate = notifyServiceRequestUpdate;
module.exports.notifyDeleteServiceMission = notifyDeleteServiceMission;
module.exports.notifyNewServiceRequest = notifyNewServiceRequest;
module.exports.notifyErrorMessageToSpecificUser = notifyErrorMessageToSpecificUser;
