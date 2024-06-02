const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User } = require("../user/model");
const roles = require("../../global_values/roles");
const {
  defaultPermitions,
} = require("../../global_values/default_permissions");
const { AppError } = require("../../constructor/AppError");
const { combinePermissions } = require("../../utils/arrayHelper");

//global schemas

//account schema
const accountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      minlength: 5,
      maxlength: 1024,
      index: true,
    },
    role: {
      type: [Number],
      default: 0,
      enum: [0, 1, 2, 3, 4, 5],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },

  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const PASS_HASH_LENGTH_LIMIT = 25;

accountSchema.pre("save", async function (next) {
  if (this.password?.length > PASS_HASH_LENGTH_LIMIT) {
    next();
    return;
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

accountSchema.methods.correctPassword = async function (password) {
  if (password?.length > PASS_HASH_LENGTH_LIMIT) {
    return this.password == password;
  }
  return await bcrypt.compare(password, this.password);
};

function validateAccount(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    password: Joi.string().min(5).max(10).required(),
  });

  return schema.validate(user);
}

const Account = mongoose.model("Account", accountSchema);
exports.Account = Account;
exports.validateAccount = validateAccount;

//user schema

//temperary account schema
const tempAccountSchema = new mongoose.Schema(
  {
    phone_num: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 11,
    },
    full_name: {
      type: String,
      required: true,
    },
    username: { type: String, required: true },
    post: { type: String, required: false },
    nat_num: {
      type: String,
      minlength: 9,
      maxlength: 10,
    },
    emp_num: {
      type: String,
      minlength: 4,
      maxlength: 8,
    },
    temp_num: String,
    temp_num_exp: {
      type: Date,
      default: Date.now() + 10 * 60 * 1000,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tempAccountSchema.methods.createAccounts = async function () {
  // let user = await User.findOne({
  //   $or: [{ emp_num: this.emp_num }, { nat_num: this.nat_num }],
  // });
  // if (user) {
  //   user.is_active = false;
  //   await user.save();
  //   throw new AppError("اکانت به دلایل امنیتی حذف شد ");
  // }

  let existingUser = await User.findOne({
    $or: [{ emp_num: this.emp_num }, { nat_num: this.nat_num }],
  });
  if (existingUser != null) {
    let existingAccount = await Account.findOne({ user_id: existingUser._id });
    const newRoles = [...existingUser.role, roles.passenger];
    existingUser.role = newRoles;
    existingAccount.role = newRoles;
    existingUser.permissions = combinePermissions(newRoles);

    await existingUser.save();
    await existingAccount.save();
    
    return existingUser;
  }

  let user = await User.create({
    role: [roles.passenger],
    nat_num: this.nat_num,
    full_name: this.full_name,
    phone_num: this.phone_num,
    emp_num: this.emp_num,
    permissions: defaultPermitions["passenger"],
  });
  await Account.create({
    username: this.username,
    password: this.nat_num,
    user_id: user._id,
  });
  return user;
};

tempAccountSchema.methods.createSMSToken = async function () {
  const resetToken = `${Math.floor(100000 + Math.random() * 900000)}`;
  this.temp_num = await bcrypt.hash(resetToken, 12);
  this.temp_num_exp = Date.now() + 10 * 60 * 1000;
  await this.save();
  return resetToken;
};

tempAccountSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      full_name: this.full_name,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) * 24 * 30 * 6, // six months 
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const TempAccount = mongoose.model("TempAccount", tempAccountSchema);
function validateTemp(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(50).required(),
    password: Joi.string().min(5).max(10).required(),
  });

  return schema.validate(user);
}

exports.TempAcc = TempAccount;
exports.validateTemp = validateTemp;
