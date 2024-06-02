const { notifyServiceMissionUpdate } = require("../../notification-service/emits");
const { serviceMissionStatus } = require("../constatns");

function notifyMissionUpdate(result, mission_id) {
    const notif = function () {
        if (result.mission.status == serviceMissionStatus.DONE.key)
            return {
                title: "پایان ماموریت",
                message: "ماموریت شما به پایان رسید"
            }
        if (result.mission.status == serviceMissionStatus.PUBLISHED.key || result.mission.status == serviceMissionStatus.READY.key)
            return {
                title: "ماموریت آماده به شروع",
                message: "هم اکنون امکان شروع ماموریت را دارید"
            }

        return null;
    }();

    notifyServiceMissionUpdate(mission_id, notif);
}

module.exports = {
    notifyMissionUpdate
}