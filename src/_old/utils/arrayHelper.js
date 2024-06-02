const { defaultPermitions } = require("../global_values/default_permissions");
const { getRoleString } = require("./userHelper");

function arraysAreEqual(array1, array2) {
    if (array1.length === array2.length) {
        return array1.every((element) => {
            return array2.includes(element);
        });
    }
    return false;
}

function combinePermissions(roles) {
    const combinedPermissions = {
        GET: [],
        POST: [],
        PUT: [],
        DELETE: [],
    }

    for (let i = 0; i < roles.length; i++) {
        const r = roles[i];
        const roleStr = getRoleString(r);
        const defaultPermitionsOfRole = defaultPermitions[roleStr];

        const methods = ["GET", "POST", "PUT", "DELETE"];
        for (const METHOD of methods) {
            for (let k = 0; k < defaultPermitionsOfRole[METHOD].length; k++) {
                const value = defaultPermitionsOfRole[METHOD][k];
                const group = combinedPermissions[METHOD];
                if (!group.includes(value)) {
                    group.push(value);
                }
            }
        }

    }
    return combinedPermissions
}

module.exports = {
    arraysAreEqual,
    combinePermissions
}