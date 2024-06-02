// const processMessage = require("./message");

/**
 * Stores data related to a connected user
 */
let rooms = [];
let cons;
class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.history = {};
    this.members = [];
  }
  findmember(member) {
    return this.members.find((m) => m === member);
  }
  addmember(member) {
    this.members.push(member);
  }
  deletemember(member) {
    this.members.filter((m) => m !== member);
  }
  addMessage(message) {
    this.history = message;
  }
  clearHistory() {
    this.history = {};
  }
}

class Connections {
  constructor() {
    this.getConnection = this.getConnection.bind(this);
    this.removeConnection = this.removeConnection.bind(this);
    this.removeSocketsById = this.removeSocketsById.bind(this);
    this.addConnection = this.addConnection.bind(this);
    this.getAllSocketsOfUser = this.getAllSocketsOfUser.bind(this);
  }
  connections = [];

  getConnection(id) {
    if (!id) return undefined;
    for (let i = this.connections.length - 1; i >= 0; i--) {
      const s = this.connections[i];
      if (s.user._id.toString() == id.toString()) {
        const client = {
          join: (roomId) => {
            const allConnections = this.getAllSocketsOfUser(id);
            const disconnectedSocketIds = [];
            for (const socket of allConnections) {
              if (socket.connected) {
                socket.join(roomId);
              } else {
                disconnectedSocketIds.push(socket.id);
              }
            }
            this.removeSocketsById(disconnectedSocketIds);
          },
          id: s.user._id.toString()
        }
        return client;
      }
    }
    return undefined;
  }

  getAllSocketsOfUser(id) {
    const output = [];
    for (let i = this.connections.length - 1; i >= 0; i--) {
      const s = this.connections[i];
      if (s.user._id.toString() == id.toString()) {
        output.push(s);
      }
    }
    return output;
  }

  addConnection(socket) {

    this.connections.push(socket);
  }
  removeSocketsById(ids) {
    try {
      if (ids == null) return;

      this.connections = this.connections.filter(
        (s) => !ids.includes(s.id)
      );
    } catch (e) {
      console.log(e.message);
    }
  }
  removeConnection(id) {
    // this.connections = this.connections.filter(
    //   (s) => s.user._id.toString() != id.toString()
    // );
    // console.log("remove connection -> length:", this.connections.length);
  }
}

const getConnectionsInstance = () => {
  if (!cons) cons = new Connections();
  return cons;
};

function findRoom(roomId) {
  return rooms.find((r) => r.roomId === roomId);
}

function addRoom(roomId) {
  let room = findRoom(roomId);
  if (!room) {
    room = new Room(roomId);
    rooms.push(room);
  }
  return room;
}

function deleteRoom(roomId) {
  rooms = rooms.filter((r) => r.roomId !== roomId);
}

module.exports = { addRoom, findRoom, deleteRoom, getConnectionsInstance };
