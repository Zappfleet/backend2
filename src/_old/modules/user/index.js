const permissions = require("../../global_values/permissions");
const { manager } = require("../../global_values/roles");
const roles = require("../../global_values/roles");
const auth = require("../../middleware/auth");
const managerAuth = require("../../middleware/maangerAuth");
const { can, canRole } = require("../../middleware/can");
const {
  createUserValidator,
  saveFirebaseTokenValidator,
  checkMangerProjectInfoValidator,
  updateUserProfileValidator,
  deligationValidator,
} = require("./schema_validator");

const {
  createUser,
  searchUsers,
  saveFirebaseToken,
  getAvailableDispatchers,
  getAvailableDrivers,
  checkMangerProjectInfo,
  getUsers,
  getUser,
  updateUserProfile,
  updateUser,
  deleteUser,
  deligateAuthority,
  getAuthorizedUser,
  reactivateUser,
  allDrivers
} = require("./service");
const { uploadFile } = require("../../middleware/uploadFile");

module.exports = {
  configure(app) {
    app.get(
      "/search/user",
      auth,
      can("GET", permissions.GET.srchUsr),
      searchUsers
    );
    app.get(
      "/all-drivers",
      auth,
      can("GET", permissions.GET.srchUsr),
      allDrivers
    );
    app.get(
      "/user",
      auth,
      can("GET", permissions.GET.usrs),
      canRole([roles.admin]),
      getUsers
    );

    app.get(
      "/user/available-disaptchers",
      auth,
      can("GET", permissions.GET.usrs),
      canRole([roles.admin]),
      getAvailableDispatchers
    );
    app.get(
      "/user/available-drivers",
      auth,
      can("GET", permissions.GET.usrs),
      canRole([roles.admin]),
      getAvailableDrivers
    );
    app.get("/user/me",
      auth,
      // can("GET", permissions.GET.usrDt),
      // canRole([roles.admin]),
      getAuthorizedUser
    );
    app.get(
      "/user/:id",
      auth,
      can("GET", permissions.GET.usrDt),
      canRole([roles.admin]),
      getUser
    );

    app.post(
      "/user",
      auth,
      can("POST", permissions.POST.usr),
      createUserValidator,
      createUser
    );
    app.post('/user/deligation',
      auth,
      can("POST", permissions.POST.dlofaut),
      canRole([roles.manager, roles.admin]),
      deligationValidator,
      deligateAuthority
    )

    app.post(
      "/user/check-manager",
      managerAuth,
      canRole([roles.manager]),
      checkMangerProjectInfoValidator,
      checkMangerProjectInfo
    );

    app.post(
      "/user/firebase-token",
      auth,
      saveFirebaseTokenValidator,
      saveFirebaseToken
    );

    app.put('/user/me',
      auth,
      uploadFile.single('avatar'),
      updateUserProfileValidator,
      updateUserProfile
    );

    app.put("/user/:id",
      auth,
      can("PUT", permissions.PUT.usr),
      canRole([roles.admin]),
      updateUser
    );

    app.put("/user/:id/reactivate",
      auth,
      reactivateUser);

    app.delete("/user/:id",
      auth,
      // can("PUT", permissions.PUT.usr),
      // canRole([roles.admin]),
      deleteUser
    );

  },
};
