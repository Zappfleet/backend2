const { default: mongoose } = require("mongoose");
const { UserRole } = require("./models/role-model");


async function createUserRole(title, permissions, auto_assign_rules) {
    const existingRole = await UserRole.findOne({ title });
    if (existingRole == null) {
        return await UserRole.create({
            title,
            permissions,
            auto_assign_rules
        })
    } else {
        existingRole.active = true;
        await existingRole.save();
        return existingRole;
    }
}


async function editUserRole(_id, title, permissions, auto_assign_rules) {

    const $set = {};
    if (title) $set.title = title;
    if (permissions) $set.permissions = permissions;
    if (auto_assign_rules) $set.auto_assign_rules = auto_assign_rules;
    const filter = {
        _id: new mongoose.Types.ObjectId(_id)
    };
    return await UserRole.findOneAndUpdate(filter, { $set }, { new: true });
}

async function reactivateUserRole(_id) {
    return await updateUserRoleActive(_id, true);
}

async function deactivateUserRole(_id) {
    return await updateUserRoleActive(_id, false);
}

async function updateUserRoleActive(_id, active) {
    const filter = {
        _id: new mongoose.Types.ObjectId(_id)
    };
    return await UserRole.findOneAndUpdate(filter, { $set: { active } }, { new: true });
}

async function listUserRoles(filter = {}) {
    return await UserRole.find({ active: true, ...filter });
}

module.exports = {
    createUserRole,
    editUserRole,
    deactivateUserRole,
    reactivateUserRole,
    listUserRoles
}