const { default: mongoose } = require("mongoose");

const COLLECTION_USER_ROLE = "UserRole"

const ROLE_RANK_REGULAR = "regular";
const ROLE_RANK_ADMIN = "admin";

const userRole = new mongoose.Schema(
    {
        title: {
            type: String,
            unique: true
        },
        active: {
            type: Boolean,
            default: true,
        },
        is_static: {
            type: Boolean,
            default: false,
        },
        rank: {
            type: String,
            enum: [ROLE_RANK_REGULAR, ROLE_RANK_ADMIN],
            default: ROLE_RANK_REGULAR
        },
        permissions: {
            type: [String],
            required: true
        },
        auto_assign_rules: {
            type: [{
                key: String,
                value: String,
            }],
            default: [],
            required: true,
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

userRole.methods.userPassAutoAssignRule = function (user) {
    let pass = this.auto_assign_rules.length > 0;
    //NOTE : checks user details value only
    //NOTE : if both key and values are set to 'undefined' the user will always pass
    //NOTE : if the auto_assign_rules is empty array the user will never pass
    this.auto_assign_rules.map((rule) => {
        if (`${user.details[rule.key]}` != rule.value) pass = false
    })
    return pass;
}



module.exports.UserRole = mongoose.model(COLLECTION_USER_ROLE, userRole);
module.exports.COLLECTION_USER_ROLE = COLLECTION_USER_ROLE;
module.exports.ROLE_RANK_REGULAR = ROLE_RANK_REGULAR;
module.exports.ROLE_RANK_ADMIN = ROLE_RANK_ADMIN;
