const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const {
  defaultPermitions,
} = require("../../global_values/default_permissions");
const roles = require("../../global_values/roles");

const deligationSchema = new mongoose.Schema({
  role: {
    type: [Number],
    enum: [0, 1, 2, 3, 4, 5],
    required: true,
  },
  full_name: String,
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  permissions: {
    type: {
      GET: [Number],
      POST: [Number],
      PUT: [Number],
      DELETE: [Number],
    },
    required: true,
  },
});
const userSchema = new mongoose.Schema(
  {
    emp_desc: String,
    role: {
      type: [Number],
      default: 0,
      enum: [0, 1, 2, 3, 4, 5],
    },
    nat_num: {
      type: String,
      index: "text",
      required: true,
    },
    avatar: {
      type: String,
    },
    emp_num: {
      type: String,
      index: "text",
    },
    full_name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
      index: "text",
    },
    phone_num: {
      type: String,
      index: "text",
    },
    permissions: {
      type: {
        GET: [Number],
        POST: [Number],
        PUT: [Number],
        DELETE: [Number],

      },
      default: defaultPermitions["passenger"],
    },
    deligated_permissions: deligationSchema,

    firebase_token: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_passenger: {
      type: Boolean,
      default: false,
    },
    last_login_date: {
      type: Date,
    },
  },
  { 
    collation: { locale: 'fa', strength: 1 }, 
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
  }
);

userSchema.methods.generateAuthToken = function () {
  let jwtSign = {
    avatar: this.avatar,
    _id: this._id,
    emp_num: this.emp_num,
    full_name: this.full_name,
    role: this.role,
    last_login_date: this.last_login_date,
    ...(this.role === roles.manager && { manager: true }),
  };

  const token = jwt.sign(jwtSign, config.get("jwtPrivateKey"), {
    expiresIn: config.get("TOKEN_EXPIRES_IN"),
  });
  return token;
};

userSchema.methods.generateManagerAuthToken = function () {
  let jwtSign = {
    _id: this._id,
    emp_num: this.emp_num,
    full_name: this.full_name,
    role: this.role,
    last_login_date: this.last_login_date,
  };
  const token = jwt.sign(jwtSign, config.get("jwtPrivateKey"), {
    expiresIn: config.get("TOKEN_EXPIRES_IN"),
  });
  return token;
};


userSchema.plugin(mongoosePaginate);

const User = mongoose.model("User", userSchema);
exports.User = User;
