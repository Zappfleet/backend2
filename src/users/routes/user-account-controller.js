
const mongoose = require('mongoose');
const {
  generateJwtToken,
  verifyJwtToken,
  encrypt,
  replaceArabicCharacters,
} = require("../../utils");
const retrieveUserDetails = require("../data/modules/retrieveUserDetails");
const sms = require("../../org-modules/notifications/sms");

const { UserAccount: User } = require('../data/models/user-model'); // مدل کاربر در پایگاه داده
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
const { json } = require("body-parser");
const { UserRole } = require('../data/models/role-model');
const { getIrisaEmp } = require('../../_old/utils/irisaHelper');

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
  // console.log(44);
  const { username, password } = req.body;

  const user = await getUserByCredentials(username.toLowerCase(), password);
  if (user == null) {
    return res.status(404).send({ error: "نام کاربری یا کلمه عبور نادرست است" });
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
  console.log(5200);

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

  console.log(123, permittedUsers);

  return res.status(200).send(permittedUsers);
}

// Route برای ورود با SSO

const baseUrl = 'https://em-stage.irisaco.com'; // مقدار BaseUrl
const apiUrl = `${baseUrl}/avand/api/me`; // آدرس API اصلی شما
const getUserData = async (accessToken) => {
  // const response = await axios.get(apiUrl, {
  //     headers: {
  //         'Authorization': `Bearer ${accessToken}`,
  //     },
  // });

  const data = {
    "tokenAttributes": {
      "sub": "f0a3d1f2-9a9f-44bd-8e28-8e407c76f73e",
      "resource_access": {
        "rahbord_client": {
          "roles": [
            "rahbord_workspace_client_role"
          ]
        },
        "account": {
          "roles": [
            "manage-account",
            "manage-account-links",
            "view-profile"
          ]
        }
      },
      "email_verified": false,
      "allowed-origins": [
        "*"
      ],
      "iss": "https://em-stage.irisaco.com/oauth/realms/irisa",
      "typ": "Bearer",
      "preferred_username": "co.ghanbari",
      "given_name": "Sedighe",
      "sid": "115a9ee2-ef61-4b74-95d6-8f9f4d3c6420",
      "aud": [
        "rahbord_client",
        "account"
      ],
      "acr": "1",
      "realm_access": {
        "roles": [
          "offline_access",
          "test-create-role-13",
          "default-roles-irisa",
          "avand_workspace_role",
          "uma_authorization"
        ]
      },
      "azp": "global-Client",
      "auth_time": 1731298795,
      "scope": "openid profile email user",
      "name": "Sedighe Ghanbari",
      "exp": "2024-11-11T04:49:56Z",
      "session_state": "115a9ee2-ef61-4b74-95d6-8f9f4d3c6420",
      "iat": "2024-11-11T04:19:56Z",
      "family_name": "Ghanbari",
      "jti": "c52712e2-0048-4b8c-b828-5d240af09c83",
      "username": "co.ghanbari"
    },
    "name": "f0a3d1f2-9a9f-44bd-8e28-8e407c76f73e",
    "authorities": [
      "SCOPE_openid",
      "SCOPE_email",
      "ROLE_manage-account",
      "ROLE_view-profile",
      "ROLE_manage-account-links",
      "SCOPE_profile",
      "SCOPE_user"
    ]
  }
  return data // response.data;
};


// تابع برای اضافه کردن رول‌ها
async function addRolesIfNotExist() {
  // لیست رول‌هایی که باید اضافه شوند
  const newRoles = [
    { _id: new mongoose.Types.ObjectId('663902a12733b1e14bcde2f4'), title: 'مسافر', active: true, is_static: false, rank: 'regular' },//passenger
    { _id: new mongoose.Types.ObjectId('663902a02733b1e14bcde2ee'), title: 'راننده', active: true, is_static: false, rank: 'regular' },//driver
    { _id: new mongoose.Types.ObjectId('663f11c3185aeaa232719f76'), title: 'مدیر پروژه', active: true, is_static: false, rank: 'regular' },//manager
    { _id: new mongoose.Types.ObjectId('663f7ec2665933a1316d2697'), title: 'دیسپاچر', active: true, is_static: false, rank: 'regular' },//dispatcher
    { _id: new mongoose.Types.ObjectId('664a047476905c9e69a259d0'), title: 'سوپر دیسپاچر', active: true, is_static: false, rank: 'regular' },//superDispatcher
    { _id: new mongoose.Types.ObjectId('663902a12733b1e14bcde2f2'), title: 'مدیر سیستم', active: true, is_static: false, rank: 'admin' },//admin
    { _id: new mongoose.Types.ObjectId('66605998eafc2a3a887c0dc4'), title: 'اپراتور', active: true, is_static: false, rank: 'regular' }//operator
  ];
  try {


    for (const role of newRoles) {
      await UserRole.findOneAndUpdate(
        { _id: role._id }, // شرط جستجو (مثلاً براساس _id)
        { $set: role }, // به‌روزرسانی داده‌ها با newAccount
        { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
      );

    }
  } catch (error) {
    console.error(5478787, 'Error adding roles:', error);
  }
}

async function SSO_Irisa_Auth(req, res) {
  console.log('sso 3-0');
  const { accessToken } = req.body;
  console.log('sso 3');
  try {
    // بررسی اعتبار توکن جیمیل با استفاده از Google API
    //const { data } = await getUserData(accessToken);
    const data = JSON.parse(`
      {
        "tokenAttributes": {
          "sub": "f0a3d1f2-9a9f-44bd-8e28-8e407c76f73e",
          "resource_access": {
            "rahbord_client": {
              "roles": [
                "rahbord_workspace_client_role"
              ]
            },
            "account": {
              "roles": [
                "manage-account",
                "manage-account-links",
                "view-profile"
              ]
            }
          },
          "email_verified": false,
          "allowed-origins": [
            "*"
          ],
          "iss": "https://em-stage.irisaco.com/oauth/realms/irisa",
          "typ": "Bearer",
          "preferred_username": "co.ghanbari",
          "given_name": "Sedighe",
          "sid": "115a9ee2-ef61-4b74-95d6-8f9f4d3c6420",
          "aud": [
            "rahbord_client",
            "account"
          ],
          "acr": "1",
          "realm_access": {
            "roles": [
              "offline_access",
              "test-create-role-13",
              "default-roles-irisa",
              "avand_workspace_role",
              "uma_authorization"
            ]
          },
          "azp": "global-Client",
          "auth_time": 1731298795,
          "scope": "openid profile email user",
          "name": "Sedighe Ghanbari",
          "exp": "2024-11-11T04:49:56Z",
          "session_state": "115a9ee2-ef61-4b74-95d6-8f9f4d3c6420",
          "iat": "2024-11-11T04:19:56Z",
          "family_name": "Ghanbari",
          "jti": "c52712e2-0048-4b8c-b828-5d240af09c83",
          "username": "co.ghanbari"
        },
        "name": "f0a3d1f2-9a9f-44bd-8e28-8e407c76f73e",
        "authorities": [
          "SCOPE_openid",
          "SCOPE_email",
          "ROLE_manage-account",
          "ROLE_view-profile",
          "ROLE_manage-account-links",
          "SCOPE_profile",
          "SCOPE_user"
        ]
      }
    `);

    console.log('sso 4', data?.tokenAttributes?.username);
    // بررسی اینکه آیا کاربر وجود دارد یا خیر
    let exist_user = await User.findOne({ username: data?.tokenAttributes?.username });

    console.log('ss0 4-1 ');

    if (exist_user == null || exist_user == undefined) {
      //   اگر کاربر وجود ندارد، آن را ایجاد کنید


      addRolesIfNotExist()

      let createNewRole = []
      data?.tokenAttributes?.realm_access.roles?.map(role => {
        switch (role) {
          case 0: //passenger
            createNewRole.push(new ObjectId('663902a12733b1e14bcde2f4'))
            break;

          case 1: //driver
            const DB_ROLE_DRIVER_ID = '663902a02733b1e14bcde2ee'
            createNewRole.push(new ObjectId(DB_ROLE_DRIVER_ID))
            break;

          case 2: //manager
            createNewRole.push(new ObjectId('663f11c3185aeaa232719f76'))
            break;

          case 3://dispatcher
            createNewRole.push(new ObjectId('663f7ec2665933a1316d2697'))
            break;

          case 4: //superDispatcher
            createNewRole.push(new ObjectId('664a047476905c9e69a259d0'))
            break;

          case 5://admin
            createNewRole.push(new ObjectId('663902a12733b1e14bcde2f2'))
            break;

          case 6://operator
            createNewRole.push(new ObjectId('66605998eafc2a3a887c0dc4'))
            break;
        }

      })

      console.log('sso-4-2-2');
      //  const userInfo = await getIrisaEmp([`${data?.tokenAttributes?.emp_num}`] || ['4001010']) //from Irisa helper


      let newAccount = new User({
        // _id: userInfo._id,
        username: data?.tokenAttributes?.username,
        password: encrypt(data?.tokenAttributes?.username),
        email: data?.tokenAttributes?.email || '',
        phone: data?.tokenAttributes?.phone || '120', // Ensure phone is included
        full_name: `${data?.tokenAttributes?.name}` || '',
        reg_key: 'irisa',
        roles: createNewRole,
        status: userStatus.ACTIVE.key,// data?.tokenAttributes?.is_active === true ? userStatus.ACTIVE.key : userStatus.INACTIVE.key,
        details: {
          nat_num: data?.tokenAttributes?.nat_num,
          personel_code: data?.tokenAttributes?.emp_num,
          key: 'irisa'
        },
        createdAt: data?.tokenAttributes?.createdAt,
        updatedAt: data?.tokenAttributes?.updatedAt,
        // last_login_date:olduser.last_login_date
      });

      await User.findOneAndUpdate(
        { username: newAccount.username }, // شرط جستجو (مثلاً براساس _id)
        { $set: newAccount }, // به‌روزرسانی داده‌ها با newAccount
        { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
      )
    }

    const user = await getUserByCredentials(data?.tokenAttributes?.username.toLowerCase(), data?.tokenAttributes?.username);
    if (user == null) {
      return res.status(404).send({ error: "نام کاربری یا کلمه عبور نادرست است" });
    } else {
      const bearer_token_data = await user.getBearerTokenData();
      const refresh_token_data = await user.getRefreshTokenData();
      return res.status(200).send({
        message: "you're logged into your account",
        bearer_token: generateJwtToken(bearer_token_data),
        refresh_token: generateJwtToken(refresh_token_data, true),
      });
    }

  } catch (error) {
    console.error(66, 'Internal Server Error - SSO Irisa:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error - SSO Irisa'
    });
  }
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
  SSO_Irisa_Auth
};
