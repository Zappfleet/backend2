const socketIo = require("socket.io");
const permissions = require("../global_values/permissions");
const roles = require("../global_values/roles");
const { messages } = require("../global_values/socket");
const logger = require("../middleware/logger");
const { User } = require("../modules/user/model");
const { getConnectionsInstance } = require("./connections");
const {
  joinActiveRooms,
  changeTripStatus,
  leavFinishedRooms,
  joinPersonalRoom,
} = require("./service");

let socketService;
const connectionInstance = getConnectionsInstance();
class SocketService {
  constructor(server) {
    this.emit = this.emit.bind(this);
    this.io = socketIo(server, {
      cors: {
        origin: '*',
      }
    })
    this.io.use((socket, next) => {
      require("./middleware")(socket, next);
    });
    this.io.on("connection", async (socket) => {
      console.log("new socket connection : "+socket.id);
      connectionInstance.addConnection(socket);
      logger.log("info", `Socket connected: ${socket.user._id}`);

      if ([roles.admin, roles.superDispatcher].some(r=>socket?.user?.role.includes(r))) socket.join('admins');

      if (socket?.user?._id != null) {
        const userEntity = await User.findById(socket.user._id);
        const deligations = userEntity?.deligated_permissions?.permissions || { GET: [], PUT: [], DELETE: [], POST: [] };
        if (deligations?.GET?.includes(permissions.GET.rqstLs)) {
          socket.join('admins');
        }
      }

      joinPersonalRoom(this.io , socket);
      
      joinActiveRooms(this.io, socket);
      socket.on(messages.changeTripStatus, (message) =>
        changeTripStatus(message, socket)
      );
      socket.on(messages.finishTrip, (message) =>
        leavFinishedRooms(message, socket)
      );
      socket.on("disconnect", () => {
        logger.log("info", `Socket disconnected: ${socket.user._id}`);
        connectionInstance.removeConnection(socket.user._id);
      });

    });
  }
  emit(message, body, to) {
    let i = 0

    this.io.in(to).emit(message, body);
  }
}

exports.SocketService = SocketService;
exports.socketService = socketService;
