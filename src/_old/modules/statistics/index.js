const roles = require("../../global_values/roles");
const auth = require("../../middleware/auth");
const { canRole } = require("../../middleware/can");
const { getTripStatistics, getRequestStatistics, getMonthlyStatistics, getDailyStatistics } = require("./statistics.service");

module.exports = {
    configure(app) {
        
        app.get(
            "/stats/daily/:collection",
            auth,
            canRole([roles.admin, roles.dispatcher, roles.superDispatcher, roles.manager]),
            getDailyStatistics,
        );
        app.get(
            "/stats/monthly/:collection",
            auth,
            canRole([roles.admin, roles.dispatcher, roles.superDispatcher, roles.manager]),
            getMonthlyStatistics,
        );
        app.get(
            "/stat/requests",
            auth,
            canRole([roles.admin, roles.dispatcher, roles.superDispatcher, roles.manager]),
            getRequestStatistics,
        );
        app.get(
            "/stat/trips",
            auth,
            canRole([roles.admin, roles.dispatcher, roles.superDispatcher, roles.manager]),
            getTripStatistics,
        );
    }
}