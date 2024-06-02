const {
  assignAlternativeDispatcher,
  getRegionsAssignedToUser,
  revokeAlternativeDispatcher,
} = require("../../regions/data");
const { PermissionSet } = require("../data/constants/permissions");
const {
  createUserRole,
  editUserRole,
  listUserRoles,
  reactivateUserRole,
  deactivateUserRole,
} = require("../data/role");
const { updateUserDeligations, readDeligation } = require("../data/user");

async function submitUserRole(req, res) {
  const { title, permissions, auto_assign_rules } = req.body;
  const result = await createUserRole(title, permissions, auto_assign_rules);
  res.status(200).send(result);
}

async function updateUserRole(req, res) {
  const { title, permissions, auto_assign_rules } = req.body;
  const _id = req.params.role_id;
  const result = await editUserRole(_id, title, permissions, auto_assign_rules);
  res.status(200).send(result);
}

async function getUserRoles(req, res) {
  const roles = await listUserRoles();
  res.status(200).send(roles);
}

async function getAllPermissions(req, res) {
  res.status(200).send(PermissionSet);
}

async function getDeligationsOnOtherUser(req, res) {
  const other_user_id = req.params.other_user_id;
  res.status(200).send(await readDeligation(req.auth._id, other_user_id));
}

async function deligatePermissionsToOthers(req, res) {
  const { other_user_id, add_permits, revoke_permits } = req.body;

  const { regions: assignedRegions } = await getRegionsAssignedToUser(
    req.auth._id
  );

  await Promise.all(
    assignedRegions.map(async (region) => {
      if (add_permits.includes(PermissionSet.SERVICE.ORG.REQUEST_APPROVAL)) {
        await assignAlternativeDispatcher(region._id, other_user_id);
      }
      if (revoke_permits.includes(PermissionSet.SERVICE.ORG.REQUEST_APPROVAL)) {
        await revokeAlternativeDispatcher(region._id, other_user_id);
      }
    })
  );

  const result = await updateUserDeligations(
    req.auth,
    other_user_id,
    add_permits,
    revoke_permits
  );
  res.status(200).send(result);
}

async function setUserActivity(req, res) {
  const _id = req.params.role_id;
  const { active } = req.body;

  const result = await (active ? reactivateUserRole : deactivateUserRole)(_id);
  res.status(200).send(result);
}

module.exports = {
  submitUserRole,
  updateUserRole,
  getUserRoles,
  setUserActivity,
  getAllPermissions,
  deligatePermissionsToOthers,
  getDeligationsOnOtherUser,
};
