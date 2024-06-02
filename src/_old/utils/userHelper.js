const { Account } = require("../modules/auth/model");
const { User } = require("../modules/user/model");

const banUser = async (id) => {
  await User.findByIdAndUpdate(id, { is_active: false });
  await Account.findOneAndUpdate({ user_id: id }, { is_active: false });
};

function password_generator(len) {
  var length = len ? len : 6;
  var string = "abcdefghijklmnopqrstuvwxyz"; //to upper
  var numeric = "0123456789";
  var punctuation = "#?!@$%^&*-+";
  var password = "";
  var character = "";
  while (password.length < length) {
    entity1 = Math.ceil(string.length * Math.random() * Math.random());
    entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
    entity3 = Math.ceil(punctuation.length * Math.random() * Math.random());
    hold = string.charAt(entity1);
    hold = password.length % 2 == 0 ? hold.toUpperCase() : hold;
    character += hold;
    character += numeric.charAt(entity2);
    character += punctuation.charAt(entity3);
    password = character;
  }
  password = password
    .split("")
    .sort(function () {
      return 0.5 - Math.random();
    })
    .join("");
  return password.substr(0, len);
}

function getAdministrativeRole(role) {
  if (role?.includes(5)) {
    return "admin"
  }
  if (role?.includes(4)) {
    return "superDispatcher"
  }
  if (role?.includes(3)) {
    return "dispatcher"
  }
  if (role?.includes(2)) {
    return "manager"
  }

  return "no-role";
}

function getRoleString(role) {
  switch (role) {
    case 5:
      return "admin";
    case 4:
      return "superDispatcher";
    case 3:
      return "dispatcher";
    case 2:
      return "manager";
    case 1:
      return "driver";
    case 0:
      return "passenger";
  }
}

function getRolePersian(role) {
  if (role.includes(5)) {
    return "مدیر"
  }
  if (role.includes(4)) {
    return "مدیر توزیع کننده"
  }
  if (role.includes(3)) {
    return "توزیع کننده"
  }
  if (role.includes(2)) {
    return "مدیر پروژه"
  }
  if (role.includes(1)) {
    return "راننده";
  }
  if (role.includes(0)) {
    return "مسافر";
  }

}

exports.banUser = banUser;
exports.getRolePersian = getRolePersian;
exports.getRoleString = getRoleString;
exports.password_generator = password_generator;
exports.getAdministrativeRole = getAdministrativeRole
