const socketIo = require("socket.io");
const config = require("config");
const jwt = require("jsonwebtoken");
const { User } = require("../_old/modules/user/model");
const { EVENT_FLEET_GPS_REQUEST, onFleetGpsRequest, EVENT_GPS_UPDATE, onUserGpsUpdate } = require("./events/fleetGpsRequest");
const roles = require("../_old/global_values/roles");
const { UserAccount } = require("../users/data/models/user-model");
const { userStatus } = require("../users/data/constants/userStatus");

const ROOMS = {
    ROOM_ADMIN: "room-admin",
    ROOM_REQUEST: (request_id) => `req-${request_id}`,
    ROOM_PASSENGER: (user_id) => `pass-${user_id}`,
    ROOM_DRIVER: (user_id) => `driver-${user_id}`,
    ROOM_USER: (user_id) => `user-${user_id}`,
}

class SocketService {
    static io = null;
}

const socketAuth = async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return;
    }
    try {
        const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
        const user = await UserAccount.findById(decoded._id);
        if (user == null || user.status != userStatus.ACTIVE.key) {
            return;
        }
        socket.user = user;
        next();
    } catch (ex) {
        return;
    }
};


function initNotificationService(server) {
    SocketService.io = socketIo(server, {
        cors: {
            origin: '*',
        },
        path: "/api/v2/socket"
    })

    SocketService.io.use((socket, next) => {
        socketAuth(socket, next);
    });

    SocketService.io.on("connection", async (socket) => {
        console.log("SOCKET CONNTECTED");

        // if (socket.user.role.includes(roles.admin) ||
        //     socket.user.role.includes(roles.dispatcher) ||
        //     socket.user.role.includes(roles.superDispatcher))
        //     socket.join(ROOMS.ROOM_ADMIN);
        // if (socket.user.role.includes(roles.driver)) socket.join(ROOMS.ROOM_DRIVER(socket.user._id.toString()));

        socket.join(ROOMS.ROOM_USER(socket.user._id.toString()));

        socket.on(EVENT_FLEET_GPS_REQUEST, onFleetGpsRequest(socket));
        socket.on(EVENT_GPS_UPDATE , onUserGpsUpdate(socket))
    });
}

module.exports.initNotificationService = initNotificationService;
module.exports.SocketService = SocketService;
module.exports.Rooms = ROOMS;
