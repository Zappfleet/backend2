const mongoose = require('mongoose'); // Ensure mongoose is imported
const identifyUserRoles = require("./modules/identifyUserRoles");
const { UserAccount } = require("./models/user-model");
const { userStatus } = require("./constants/userStatus");
const {
  encrypt,
  getRandomInt,
  generateActivationCode,
  getMongoosePaginateOptions,
} = require("../../utils");
const { UserRole, ROLE_RANK_REGULAR } = require("./models/role-model");
const userSearchFilterModule = require("./modules/userSearchFilter");
const { Deligation } = require("./models/deligate-model");
const { ObjectId } = require("mongodb");

async function createUserManually(args) {
  return await UserAccount.create(args);
}

async function updateUserManually(_id, args) {
  return await UserAccount.findByIdAndUpdate(_id, args);
}

async function getDeligationsTo(user_id) {
  return await Deligation.find({ toUser: new ObjectId(user_id) });
}

async function readDeligation(fromUserId, toUserId) {
  const d = await Deligation.findOne({
    fromUser: fromUserId,
    toUser: new ObjectId(toUserId),
  });
  if (d == null)
    return await Deligation.create({
      fromUser: fromUserId,
      toUser: toUserId,
      permissions: [],
    });
  return d;
}

async function updateUserDeligations(fromUser, toUserId, adds, revokes) {
  const checkResult = await checkForPermissions(fromUser, adds);

  const validAdds = Object.entries(checkResult)
    .filter(([_, isPermitted]) => isPermitted)
    .map(([key]) => key);

  const deligation = await readDeligation(fromUser._id, toUserId);
  deligation.permissions = deligation.permissions.filter((item) => {
    return !revokes.includes(item);
  });
  deligation.permissions.push(...validAdds);
  await deligation.save();
  return deligation;
}

async function checkForPermissions(user, permissions) {

  //console.log(8,user.permissions,permissions);
  const result = {};
  user.roles.map((r) => {
    permissions.map((p) => {
      // //console.log(5000,result[p],r.permissions,r.permissions.includes(p),p);
      if (result[p] != true) result[p] = r.permissions.includes(p);
    });
  });

 // console.log(89,result);
  return result;
}

async function getListOfUsersWithPermissions(permissions, search, search_all) {
  const permissionsCondition = permissions.map((item) => {
    return { permissions: item };
  });

  const filter = {
    $or: permissionsCondition,
    rank: ROLE_RANK_REGULAR,
  };
  if (search_all) delete filter.$or;
  const rolesWithPermissions = await UserRole.find(filter);

  const userAccount = await UserAccount.find({
    ...userSearchFilterModule(search),
    roles: { $in: rolesWithPermissions.map((item) => item.id) },
  })
    .sort({ createdAt: -1 })
    .limit(10);

  return userAccount;
}

async function getPaginatedListOfUsers(search, sort = {}, page = 0) {
  const options = getMongoosePaginateOptions(page, sort);
  options.select = "-password";
  const filter =
    search?.trim().length > 0
      ? {
          $or: [
            { username: { $regex: search } },
            { full_name: { $regex: search } },
            { phone: { $regex: search } },

            //TODO : details part is temporary for irisa
            { "details.details.personel_code": { $regex: search } },
            { "details.nat_num": { $regex: search } },
            { "details.details.nat_num": { $regex: search } },
          ],
        }
      : {};
  return await UserAccount.paginate(filter, options);
}

async function getListOfUsers(filter = {}) {
  return await UserAccount.find(filter).select(["-password"]);
}

async function activatePendingUser(username, one_time_token) {
  const existingUser = await UserAccount.findOne({ username });

  if (one_time_token == null) {
    return { error: `no token is provided`, username };
  }

  if (existingUser == null) {
    return { error: `the user not exists`, username };
  }

  if (existingUser.status != userStatus.PENDING.key) {
    return { error: `the user is not in pending mode`, username };
  }

  if (
    existingUser.one_time_token == null ||
    existingUser.expire_date_epoch - now() < 0
  ) {
    return { error: `the user token is expired`, username };
  }

  const encrypted_token = encrypt(one_time_token);
  if (existingUser.one_time_token.encrypted_value != encrypted_token) {
    return { error: `wrong token`, username };
  }

  existingUser.one_time_token = null;
  existingUser.status = userStatus.ACTIVE.key;
  await existingUser.save();

  return { user: existingUser };
}

async function getExternalSourceUser(user) {
  const { module } = user;
  const userAccount =
    await require(`../../services/modules/${module}`).convertToUserAccount(
      user
    );

  const existingUser = await UserAccount.findOne({
    username: userAccount.username,
  });
  if (existingUser != null) return existingUser;
  return await createUserManually(userAccount);
}

async function getUserById(_id) {
  return await UserAccount.findById(_id);
}

async function getUserByCredentials(username, password) {
  try {
    const user = await UserAccount.findOne({
      username,
      password: encrypt(password),
      status: userStatus.ACTIVE.key,
    });

    return user;
  } catch (error) {
    if (error instanceof mongoose.Error) {
      console.error('MongooseError:', error.message);
      // Handle the specific Mongoose error here if needed
    } else {
      console.error('Unexpected Error:', error);
    }
    // Return an appropriate response or rethrow the error
    throw error; // or return null / appropriate response
  }
  // const user = await UserAccount.findOne({
  //   username,
  //   password: encrypt(password),
  //   status: userStatus.ACTIVE.key,
  // });
  // return user;
}

async function resetUserPasswordWithSecretCode(username, code, new_password) {
  const filter = {
    username,
    "one_time_token.encrypted_value": encrypt(code),
  };
  return await UserAccount.findOneAndUpdate(
    filter,
    { $set: { password: encrypt(new_password), one_time_token: null } },
    { new: true }
  );
}

async function assignOneTimeToken(username) {
  const [one_time_token, code] = generateOneTimeToken();
  const user = await UserAccount.findOneAndUpdate(
    { username },
    { $set: { one_time_token } },
    { new: true }
  );
  return { code, user };
}

async function preSignUpUser(args) {
  const { details, ...rest } = args;
  const roles = await identifyUserRoles({ details });

  const [one_time_token, encrypted_value_original] = generateOneTimeToken();

  const userArgs = {
    ...rest,
    password: encrypt(rest.password),
    details,
    roles,
    status: userStatus.PENDING.key,
    one_time_token,
  };

  const existingUser = await UserAccount.findOne({ username: rest.username });
  if (existingUser != null && existingUser.status != userStatus.PENDING.key) {
    return { error: `the user is already registered`, args };
  }

  const user = await (async function () {
    if (existingUser == null) {
      return await UserAccount.create(userArgs);
    } else {
      return await UserAccount.findByIdAndUpdate(existingUser._id, userArgs, {
        new: true,
      });
    }
  })();

  return { user, encrypted_value_original };
}

function generateOneTimeToken() {
  const original_value = generateActivationCode();

  const token = {
    encrypted_value: encrypt(original_value),
    expire_date_epoch: minutesLater(5),
  };
  return [token, original_value];
}

function minutesLater(mins) {
  return new Date(new Date().getTime() + mins * 60 * 1000).getTime();
}

function now() {
  return new Date().getTime();
}

module.exports.preSignUpUser = preSignUpUser;
module.exports.activatePendingUser = activatePendingUser;
module.exports.getUserByCredentials = getUserByCredentials;
module.exports.getUserById = getUserById;
module.exports.assignOneTimeToken = assignOneTimeToken;
module.exports.resetUserPasswordWithSecretCode =
  resetUserPasswordWithSecretCode;
module.exports.createUserManually = createUserManually;
module.exports.updateUserManually = updateUserManually;
module.exports.getListOfUsers = getListOfUsers;
module.exports.getListOfUsersWithPermissions = getListOfUsersWithPermissions;
module.exports.checkForPermissions = checkForPermissions;
module.exports.getExternalSourceUser = getExternalSourceUser;
module.exports.updateUserDeligations = updateUserDeligations;
module.exports.readDeligation = readDeligation;
module.exports.getDeligationsTo = getDeligationsTo;
module.exports.getPaginatedListOfUsers = getPaginatedListOfUsers;
