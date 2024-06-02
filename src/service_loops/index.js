const { initMissionAssignLoop } = require("./missionAssignLoop")

module.exports = {
    initServiceLoops: () => {
        initMissionAssignLoop();
    }
}