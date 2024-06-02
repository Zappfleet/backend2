const { driverHistory } = require("./driver");

module.exports = {
    configure(app) {
        app.get(
            "/report/driver/:accountId",
            driverHistory
        );
    },

}