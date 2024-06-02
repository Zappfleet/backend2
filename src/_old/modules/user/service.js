const { AppError } = require("../../constructor/AppError");
const {
  defaultPermitions,
} = require("../../global_values/default_permissions");
const roles = require("../../global_values/roles");
const async = require("../../middleware/async");
const getPaginateOptions = require("../../utils/paginateHelper");
const { getRoleString } = require("../../utils/userHelper");
const { Account } = require("../auth/model");
const { User } = require("./model");
const Area = require("../area/model");
const { getIrisaEmp, getProjInfo } = require("../../utils/irisaHelper");
const { Car } = require("../car/model");
const mongoose = require("mongoose");
const permissions = require("../../global_values/permissions");
const { getSort } = require("../../utils/sortHelper");
const { Driver } = require("../../mid_models/driver");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const user = require(".");
const { textIsNumeric, standardPhoneNum, standardNatNum, replaceArabicCharacters } = require("../../utils/stringHelper");
const { passenger } = require("../../global_values/roles");
const { arraysAreEqual, combinePermissions } = require("../../utils/arrayHelper");
const { Trip } = require("../trip/model");

const ERR_NOT_ALLOWED = "کاربر اجازه ی این عملیات را ندارد";

const SIMPLE_SUCCESS_RESPONSE = {
  info: "success",
  token: "",
  doc: "",
};

const reactivateUser = async (req, res) => {
  const itemsToAtivate = [];
  const user_id = req.params.id;

  if (req.user._id.equals(user_id)) {
    throw new AppError("کاربر امکان فعال کردن خود را ندارد", 404);
  }

  const user = await User.findById(user_id);
  itemsToAtivate.push(user);

  itemsToAtivate.push(await Account.findOne({ user_id }));
  for (const el of itemsToAtivate) {
    el.is_active = true;
    await el.save();
  }
  res.status(201).send(SIMPLE_SUCCESS_RESPONSE);
}

const deleteUser = async (req, res) => {

  const itemsToDeativate = [];
  const user_id = req.params.id;

  if (req.user._id.equals(user_id)) {
    throw new AppError("کاربر امکان غیر فعال کردن خود را ندارد", 404);
  }

  const user = await User.findById(user_id);
  itemsToDeativate.push(user);
  if (user.role.includes(roles.driver)) {
    itemsToDeativate.push(await Driver.findOne({ "user.account_id": user._id }));
    const car = await Car.findOne({ "driver.user.account_id": user._id });
    if (car != null) {
      car.driver = null;
      await car.save();
    }

  }
  itemsToDeativate.push(await Account.findOne({ user_id }));
  for (const el of itemsToDeativate) {
    el.is_active = false;
    await el.save();
  }
  res.status(201).send(SIMPLE_SUCCESS_RESPONSE);
}

const updateUser = async (req, res) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id);
  if (!user) throw new AppError("کاربر وجود ندارد.", 404);
  const account = await Account.findOne({ user_id: user._id });
  if (!account) throw new AppError("اکانت کاربر وجود ندارد.", 404);

  const { role, username, current_password, password, full_name } = req.body;
  let { nat_num, phone_num } = req.body;

  nat_num && (nat_num = standardNatNum(nat_num));
  phone_num && (phone_num = standardPhoneNum(phone_num));

  const is_self_update = user._id.equals(req.user._id);





  const role_changed = (role && !arraysAreEqual(role, user.role));

  const driver_role_is_removed = role_changed && !role.includes(roles.driver) && user.role.includes(roles.driver);

  const nat_num_changed = (nat_num && nat_num != user.nat_num);
  const phone_num_changed = (phone_num && phone_num != user.phone_num);

  // const roleStr = role && getRoleString(role);
  // const default_permissions = roleStr && defaultPermitions[roleStr];

  const is_administrative = [roles.admin, roles.manager].some((R) => req.user.role.includes(R));

  if (!is_self_update && !is_administrative) {
    throw new AppError(ERR_NOT_ALLOWED, 405);
  }

  if (is_administrative) {
    const is_permitted = req.user.permissions?.PUT?.includes(permissions.PUT.usr);
    if (!is_permitted) throw new AppError(ERR_NOT_ALLOWED, 405);
  }

  if (is_self_update && role_changed) {
    throw new AppError("کاربر امکان تغییر نقش خود را ندارد.", 405);
  }

  if (nat_num_changed) {
    const nat_num_exists = await User.findOne({ nat_num });
    if (nat_num_exists) {
      throw new AppError("کاربر با این کد ملی موجود است", 406);
    }
  }

  if (phone_num_changed) {
    const phone_num_exists = await User.findOne({ phone_num });
    if (phone_num_exists) {
      throw new AppError("کاربر با این شماره همراه موجود است", 406);
    }
  }

  if (password) {
    if (!current_password || !(await account.correctPassword(current_password)))
      throw new AppError("رمز فعلی کاربر نادرست است.", 406);
  }

  if ("is_active" in req.body) {
    if (is_self_update) {
      throw new AppError("کاربر امکان فعال یا غیر فعال سازی خود را ندارد", 406);
    } else {
      user.is_active = req.body.is_active;
      account.is_active = req.body.is_active;
    }
  }

  if (role) {
    user.role = role;
    account.role = role;
  }

  username && (account.username = username);
  password && (account.password = password);

  nat_num && (user.nat_num = nat_num);
  phone_num && (user.phone_num = phone_num);
  full_name && (user.full_name = full_name);

  role_changed && (user.permissions = combinePermissions(role));

  if (driver_role_is_removed) {
    await Car.updateOne({ "driver.user.account_id": user._id }, {
      $set: {
        driver: null,
      }
    })
  }

  try {
    await account.save();
    await user.save();
    res.status(201).send(SIMPLE_SUCCESS_RESPONSE);
  } catch (e) {
    throw new AppError("خطا در به روز رسانی کاربر", 500);
  }

}

const createUser = async (req, res) => {
  let { full_name, emp_num, phone_num, nat_num, role } = req.body;
  phone_num = standardPhoneNum(phone_num);
  emp_num = emp_num?.toString();
  nat_num = standardNatNum(nat_num);

  const or = [{ nat_num }, { phone_num }];
  if (emp_num) {
    or.push({ emp_num });
  }

  let user = await User.findOne({
    $or: or,
  });
  if (user) throw new AppError("کاربر قبلا ثبت نام شده است.", 406);

  const defaultPermissionsCombined = combinePermissions(role);

  full_name = full_name.trim();
  if (emp_num) {
    const irisaEmp = await getIrisaEmp(emp_num);

    if (irisaEmp.COD_NAT_EMPL === nat_num.toString()) {
      res.status(201).send({
        info: "success",
        tokne: "",
        doc: "",
      });
      full_name = replaceArabicCharacters(irisaEmp.NAM_EMPL + " " + irisaEmp.NAM_SNAM_EMPL);
      user = await User.create({
        full_name,
        nat_num,
        phone_num,
        emp_num,
        role,
        permissions: defaultPermissionsCombined,
      });
      await Account.create({
        username: irisaEmp.USER_NAME,
        password: nat_num,
        user_id: user._id,
        role,
      });
    } else {
      throw new AppError("کدملی وارد شده با اطلاعات کاربر مطابقت ندارد", 406);
    }
  } else {
    res.status(201).send(SIMPLE_SUCCESS_RESPONSE);
    user = await User.create({
      full_name,
      nat_num,
      phone_num,
      role,
      permissions: defaultPermissionsCombined,
    });
    await Account.create({
      username: phone_num,
      password: nat_num,
      user_id: user._id,
      role,
    });
  }
};

const allDrivers = async (req, res) => {
  const result = await Trip.find().distinct('driver.user.account_id');
  const driverUsers = await User.find({ _id: { $in: result } })
  res.status(200).send({
    info: "success",
    docs: driverUsers,
  });
}

const searchUsers = async (req, res) => {
  const { query, role = `${roles.passenger},${roles.manager},${roles.dispatcher},${roles.superDispatcher}` } = req.query;
  const options = getPaginateOptions(req.query, "full_name");

  const roleFilter = role.split(",").map((role) => {
    return {
      role: parseInt(role)
    }
  })

  const fieldsQuery = textIsNumeric(query) ? { emp_num: { $regex: query } } : { full_name: { $regex: query } };

  try {
    const users = await User.paginate(
      {
        is_active: true,
        $and: [
          {
            $or: [
              ...roleFilter,
            ]
          },
          { $or: [fieldsQuery] }
        ],
      },
      options
    );
    res.status(200).send({
      info: "success",
      ...users,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ info: "unseccessfull", doc: [] });
  }
};

const getAvailableDispatchers = async (req, res) => {
  const options = getPaginateOptions(req.query, "full_name");

  const dispatchersWithArea = await (
    await Area.find({ is_active: true })
  ).flatMap((area) => area.dispatcher.map((d) => d.account_id));
  const availableDispatchers = await User.paginate(
    {
      _id: { $nin: dispatchersWithArea },
      role: roles.dispatcher,
    },
    options
  );
  res.status(200).send({
    info: "success",
    ...availableDispatchers,
  });
};

const saveFirebaseToken = async (req, res, next) => {
  const { firebase_token } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("کاربر پیدا نشد", 404);
  user.firebase_token = firebase_token;
  await user.save();
  res.status(200).send({ info: "success" });
};

const getAvailableDrivers = async (req, res) => {
  const cars = await Car.find({ is_active: true });
  const drivers = cars.map((car) => car?.driver?.user?.account_id);
  const availableDrivers = await User.find({
    is_active: true,
    role: roles.driver,
    _id: { $nin: drivers },
  }).select("full_name");
  res.status(200).send({ info: "success", docs: availableDrivers });
};

const checkMangerProjectInfo = async (req, res) => {
  const { proj_code } = req.body;
  const isProjValid = await getProjInfo(proj_code);
  if (!isProjValid)
    return res.status(403).send({ info: "پزوژه شما پایان یافته است" });
  const manager = await User.findById(req.user._id);
  const token = manager.generateManagerAuthToken();
  return res.status(200).send({ info: "success", token });
};

const getUsers = async (req, res) => {
  const { query, role } = req.query;
  const options = getPaginateOptions(
    req.query,
    "full_name role avatar emp_num is_passenger is_active"
  );

  const sort = getSort(req);

  let filter = {
    ...(role && { role }),
    ...(query && {
      $or: [
        { full_name: { $regex: query } },
        { phone_num: { $regex: query } },
        { emp_num: { $regex: query } },
      ],
    }),
  }
  if ('role' in req.query) {
    if (role == roles.passenger) {
      filter = {
        $and: [
          { $or: [{ role: roles.passenger }, { is_passenger: true }] },
          { $or: [{ full_name: { $regex: query } }, { phone_num: { $regex: query } }, { emp_num: { $regex: query } }] }
        ]
      }
    }
  }

  const availableUsers = await User.paginate(
    filter,
    { ...options, sort }
  );
  res.status(200).send({
    info: "success",
    ...availableUsers,
  });
};

const getUser = async (req, res) => {
  // this is for phase 1
  const { id } = req.params;
  const user = await User.findById(id)
  res.status(200).send({
    info: "success",
    doc: user,
  });
};

const getAuthorizedUser = async (req, res) => {
  // this is for phase 1
  // const { id } = req.params;
  const user = await User.findById(req.user._id)
  res.status(200).send({
    info: "success",
    doc: user,
  });
};

const updateUserProfile = async (req, res) => {

  const { current_password, password, phone_num: phone_num_original } = req.body;
  const phone_num = standardPhoneNum(phone_num_original)
  if (password) {
    const account = await Account.findOne({ user_id: req.user._id })
    if (!(await account.correctPassword(current_password)))
      throw new AppError("رمز عبور فعلی نادرست است", 403);
    account.password = password;
    account.phone_num = phone_num;
    account.save();
  }
  if (phone_num) {
    req.user.phone_num = phone_num
    await req.user.save();
  }

  if (req.file) {
    req.user.avatar = req.file.filename;
    await req.user.save()
  }
  res.send({ info: 'success' })
};
async function deligateAuthority(req, res) {
  const { permissions, user_id } = req.body;
  const user = await User.findOne({ _id: user_id, is_active: true });
  if (user?.deligated_permissions)
    if (!user.deligated_permissions?.account_id?.toString() === req.user?._id?.toString())
      throw new AppError('به کاربر مورد نظر قبلا اختیاراتی از شخص دیگر تفویض شده است');
    else return updateUserDeligatedPermitions(req, res, user);

  const { role, _id, full_name } = req.user;

  user.deligated_permissions = {
    role,
    full_name,
    account_id: _id,
    permissions,
  }

  user.save();
  res.status(200).send({ info: 'success', doc: '' })
}

async function updateUserDeligatedPermitions(req, res, user) {
  user.deligated_permissions.permissions = req.body.permissions;
  user.save();
  res.status(200).send({ info: 'success', doc: '' })
}

exports.getUser = getUser;
exports.deligateAuthority = deligateAuthority;
exports.getUsers = getUsers;
exports.updateUserProfile = updateUserProfile;
exports.checkMangerProjectInfo = checkMangerProjectInfo;
exports.saveFirebaseToken = saveFirebaseToken;
exports.getAvailableDrivers = getAvailableDrivers;
exports.createUser = async(createUser);
exports.searchUsers = async(searchUsers);
exports.allDrivers = async(allDrivers);
exports.getAvailableDispatchers = async(getAvailableDispatchers);
exports.updateUser = async(updateUser);
exports.deleteUser = async(deleteUser);
exports.getAuthorizedUser = async(getAuthorizedUser);
exports.reactivateUser = async(reactivateUser);
