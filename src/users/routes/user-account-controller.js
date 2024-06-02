const {
  generateJwtToken,
  verifyJwtToken,
  encrypt,
  replaceArabicCharacters,
} = require("../../utils");
const retrieveUserDetails = require("../data/modules/retrieveUserDetails");
const sms = require("../../org-modules/notifications/sms");
const {
  preSignUpUser,
  activatePendingUser,
  getUserByCredentials,
  getUserById,
  assignOneTimeToken,
  resetUserPasswordWithSecretCode,
  createUserManually,
  updateUserManually,
  getListOfUsers,
  getListOfUsersWithPermissions,
  readDeligation,
  getDeligationsTo,
  getPaginatedListOfUsers,
} = require("../data/user");
const {
  OrgDataSourceFilterd,
  OrgDataSource,
} = require("../../org-modules/constants/OrgDataSource");
const { userStatus } = require("../data/constants/userStatus");

function getUserRegisterModule(key) {
  return require(`../data/modules/signup/${key}`);
}

async function orgInfo(req, res) {
  res.status(200).send(OrgDataSourceFilterd);
}

async function userAuth(req, res) {
  const deligations = await getDeligationsTo(req.auth?._id);

  res.status(200).send({
    auth: req.auth,
    deligations,
    org: OrgDataSourceFilterd,
  });
}

async function userSignUpVerify(req, res) {
  const { username, code } = req.body;
  const result = await activatePendingUser(username, code);
  if (result.error != null) {
    return res.status(400).send({ error: result.error });
  } else {
    const bearer_token_data = await result.user.getBearerTokenData();
    const refresh_token_data = await result.user.getRefreshTokenData();
    return res.status(200).send({
      message: "your account is verified",
      bearer_token: generateJwtToken(bearer_token_data),
      refresh_token: generateJwtToken(refresh_token_data, true),
    });
  }
}

async function userSignUp(req, res) {
  const { key, phone, ...rest } = req.body;

  const userRegisterModule = getUserRegisterModule(key);
  const {
    details,
    username,
    password,
    full_name,
    error: moduleError,
  } = await userRegisterModule({
    phone,
    ...rest,
  });

  if (moduleError) {
    return res.status(400).send({ error: moduleError });
  }

  const result = await preSignUpUser({
    details,
    username,
    password,
    phone,
    reg_key: key,
    full_name,
  });

  if (result.error != null) {
    return res.status(400).send({ error: result.error });
  } else {
    console.log("code : ", result.encrypted_value_original);
    sms
      .sendSecretVerificationToken(
        result.user.phone,
        result.encrypted_value_original
      )
      .catch(console.log);
    return res
      .status(200)
      .send({ message: "verification token was sent to you", username });
  }
}

async function refreshUserBearerToken(req, res) {
  const verified = verifyJwtToken(req.body.refresh_token);
  const user = await getUserById(verified._id);
  if (user == null) return res.status(400).send({ error: "invalid request" });

  const bearer_token_data = await user.getBearerTokenData();
  return res.status(200).send({
    message: "you're bearer token is refreshed",
    bearer_token: generateJwtToken(bearer_token_data),
  });
}

async function resetUserPassword(req, res) {
  const { username, code, new_password } = req.body;
  const user = await resetUserPasswordWithSecretCode(
    username,
    code,
    new_password
  );
  if (user == null) {
    return res.status(200).send({ message: "unable to reset user password" });
  } else {
    const bearer_token_data = await user.getBearerTokenData();
    const refresh_token_data = await user.getRefreshTokenData();
    return res.status(200).send({
      message: "you're logged into your account",
      bearer_token: generateJwtToken(bearer_token_data),
      refresh_token: generateJwtToken(refresh_token_data, true),
    });
  }
}

async function triggerForgetPassword(req, res) {
  const { username } = req.body;
  const { code, user } = await assignOneTimeToken(username);
  console.log("code : ", code);
  sms.sendSecretVerificationToken(user.phone, code).catch(console.log);
  return res
    .status(200)
    .send({ message: "verification token was sent to you" });
}

async function userSignIn(req, res) {
  console.log(44);
  const { username, password } = req.body;
 
  const user = await getUserByCredentials(username.toLowerCase(), password);
  if (user == null) {
    return res.status(404).send({ error: "wrong user credentials" });
  } else {
    const bearer_token_data = await user.getBearerTokenData();
    const refresh_token_data = await user.getRefreshTokenData();
    return res.status(200).send({
      message: "you're logged into your account",
      bearer_token: generateJwtToken(bearer_token_data),
      refresh_token: generateJwtToken(refresh_token_data, true),
    });
  }
}

async function createUser(req, res) {
  const { key, phone, roles, status, ...rest } = req.body;

  const userRegisterModule = getUserRegisterModule(key);

  const {
    details,
    username,
    password,
    full_name,
    error: moduleError,
  } = await userRegisterModule({
    phone,
    ...rest,
  });

  if (moduleError) {
    return res.status(400).send({ error: moduleError });
  }

  // const details = await retrieveUserDetails({ username, ...rest })
  const args = {
    username,
    full_name,
    phone,
    password: encrypt(password),
    roles,
    status,
    reg_key: key,
    // status: userStatus.ACTIVE.key,
    details: { ...rest, ...details },
  };
  const userEntity = await createUserManually(args);
  return res.status(200).send(userEntity);
}

async function updateUser(req, res) {
  const { username, phone, roles, full_name, status, password, ...rest } =
    req.body;
  const _id = req.params.id;
  const args = {};
  username && (args.username = username.toLowerCase());
  phone && (args.phone = phone);
  roles && (args.roles = roles);
  status && (args.status = status);
  full_name && (args.full_name = full_name);
  password && (args.password = encrypt(password));
  args.details = rest;

  const updatedEntity = await updateUserManually(_id, args);
  return res.status(200).send(updatedEntity);
}

async function getPaginatedUsers(req, res) {
  const { search, sort, page } = req.query;
  return res
    .status(200)
    .send(await getPaginatedListOfUsers(search, sort, page));
}

async function getUserList(req, res) {
  const filter = {};
  return res.status(200).send(await getListOfUsers(filter));
}

async function getUserListByPermissions(req, res) {
  const search = replaceArabicCharacters(req.query.search?.trim());
  const permissions = req.query.permissions
    .split(",")
    .map((item) => item.trim());

  const search_all = req.query.search_all;
  const permittedUsers = await getListOfUsersWithPermissions(
    permissions,
    search,
    search_all
  );

  if (req.query.include_external_base == [true]) {
    const externalModule = require(`../../services/modules/${OrgDataSource.externalUserbaseModule}`);
    const externalUsers = await externalModule.search(search || "");
    permittedUsers.push(...externalUsers);
  }

  return res.status(200).send(permittedUsers);
}

module.exports = {
  createUser,
  updateUser,
  getUserList,
  userSignUp,
  userSignIn,
  userAuth,
  userSignUpVerify,
  refreshUserBearerToken,
  triggerForgetPassword,
  resetUserPassword,
  orgInfo,
  getUserListByPermissions,
  getPaginatedUsers,
};
