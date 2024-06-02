const { listUserRoles } = require("../role");

module.exports = async function identifyUserRoles(user) {
    const userRoles = await listUserRoles();
    
    const roles = [];
    userRoles.map((role)=>{
        if (role.userPassAutoAssignRule(user)){
            roles.push(role._id);
        }
    })

    return roles;
}
