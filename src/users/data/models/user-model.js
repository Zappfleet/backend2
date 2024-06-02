const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const { COLLECTION_USER_ROLE } = require("./role-model");
const { userStatus } = require("../constants/userStatus");
const { keysOf } = require("../../../utils");
const { listUserRoles } = require("../role");
const mongoosePaginate = require("mongoose-paginate-v2");

const COLLECTION_USER_ACCOUNT = "UserAccount";

const userAccount = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      default: "",
    },
    reg_key: {
      type: String,
    },
    roles: {
      type: [ObjectId],
      ref: COLLECTION_USER_ROLE,
      required: true,
    },
    status: {
      type: String,
      enum: keysOf(userStatus),
      default: userStatus.PENDING.key,
      required: true,
    },
    one_time_token: {
      encrypted_value: {
        type: String,
      },
      expire_date_epoch: {
        type: Number,
      },
    },
    details: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userAccount.methods.getRefreshTokenData = async function () {
  return {
    _id: this._id,
  };
};

userAccount.methods.getBearerTokenData = async function () {
  return {
    username: this.username,
    phone: this.phone,
    _id: this._id,
    roles: await listUserRoles({ _id: { $in: this.roles } }),
  };
};

userAccount.plugin(mongoosePaginate);

module.exports.UserAccount = mongoose.model(
  COLLECTION_USER_ACCOUNT,
  userAccount
);
module.exports.COLLECTION_USER_ACCOUNT = COLLECTION_USER_ACCOUNT;
