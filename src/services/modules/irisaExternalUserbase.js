const cron = require("node-cron");
const { default: mongoose } = require("mongoose");
const { getIrisaPersonelList } = require("../../irisa/lib");
const {
  getUserByCredentials,
  getUserByUsername,
  getListOfUsers,
} = require("../../users/data/user");
const { replaceArabicCharacters } = require("../../utils");
const { userStatus } = require("../../users/data/constants/userStatus");
const { isArray } = require("lodash");

const irisaUserbaseSchema = new mongoose.Schema(
  {
    USER_NAME: String,
    NUM_PRSN_EMPL: {
      type: String,
      required: true,
      unique: true,
    },
    NAM_EMPL: String,
    NAM_SNAM_EMPL: String,
    COD_NAT_EMPL: String,
    DES_MANAG: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const IrisaUserbase = mongoose.model("IrisaUserbase", irisaUserbaseSchema);

async function convertToUserAccount(user) {
  const irisaUser = await IrisaUserbase.findById(user._id);
  console.log(425,irisaUser);
  
  const userAccount = {
    username: irisaUser.NUM_PRSN_EMPL,
    password: irisaUser.NUM_PRSN_EMPL,
    phone: "0",
    full_name: user.full_name,
    roles: [],
    status: userStatus.HIDDEN.key,
    details: irisaUser,
  };
  return userAccount;
}

async function deleteExitingOnes(full_external_list) {
  const listOfEmpNumbers = isArray(full_external_list) && full_external_list?.map(
    ({ NUM_PRSN_EMPL }) => NUM_PRSN_EMPL
  );

  const existingExternalUsers = await IrisaUserbase.find({
    NUM_PRSN_EMPL: { $in: listOfEmpNumbers },
  });

  const prunedList = isArray(full_external_list) && full_external_list
    .filter((item) => {
      return (
        existingExternalUsers.find((existing) => {
          return existing.NUM_PRSN_EMPL == item.NUM_PRSN_EMPL;
        }) == null
      );
    })
    .map((item) => {
      return {
        USER_NAME: replaceArabicCharacters(item.USER_NAME || ""),
        NUM_PRSN_EMPL: replaceArabicCharacters(item.NUM_PRSN_EMPL || ""),
        NAM_EMPL: replaceArabicCharacters(item.NAM_EMPL || ""),
        NAM_SNAM_EMPL: replaceArabicCharacters(item.NAM_SNAM_EMPL || ""),
        COD_NAT_EMPL: replaceArabicCharacters(item.COD_NAT_EMPL || ""),
        DES_MANAG: replaceArabicCharacters(item.DES_MANAG || ""),
      };
    });
  return {
    prunedList,
  };
}


async function updateExternalUserbase() {
  try {
    // دریافت لیست پرسنل
    const full_list_of_personel = await getIrisaPersonelList();

   // console.log(77,full_list_of_personel.data);
    
    // بررسی اینکه آیا داده‌ها به درستی دریافت شده‌اند
    if (!full_list_of_personel || !Array.isArray(full_list_of_personel)) {
     // console.error("Invalid personnel list received:", full_list_of_personel);
      return;
    }

    // حذف موارد موجود
    const { prunedList } = await deleteExitingOnes(full_list_of_personel);

    // بررسی اینکه prunedList آرایه‌ای معتبر است
    if (!Array.isArray(prunedList) || prunedList.some(item => typeof item !== 'object')) {
     // console.error("Invalid prunedList:", prunedList);
      return;
    }

    // درج داده‌ها در پایگاه داده
    await IrisaUserbase.insertMany(prunedList, {
      ordered: false,
    });

   // console.log("Data successfully updated in the database.");
  } catch (error) {
    console.error(525,"Error updating external user base:")//, error);
  }
}

// async function updateExternalUserbase() {
//   const full_list_of_personel = await getIrisaPersonelList();

//   const { prunedList } = await deleteExitingOnes(full_list_of_personel.data);
//   await IrisaUserbase.insertMany(prunedList, {
//     ordered: false,
//   });
// }

async function search(q, limit = 10) {
  const query = q.trim();

  const words = query.split(" ");

  const $and = [];

  words.map((word) => {
    $and.push({
      $or: [
        { USER_NAME: { $regex: word } },
        { NUM_PRSN_EMPL: { $regex: word } },
        { NAM_EMPL: { $regex: word } },
        { NAM_SNAM_EMPL: { $regex: word } },
        { COD_NAT_EMPL: { $regex: word } },
      ],
    });
  });

  return (
    await IrisaUserbase.find({
      $and,
    }).limit(limit)
  )?.map((resultItem) => {
    return {
      _id: resultItem._id,
      username: resultItem.USER_NAME,
      full_name: `${resultItem.NAM_EMPL} ${resultItem.NAM_SNAM_EMPL}`,
      details: {
        personel_code: resultItem.NUM_PRSN_EMPL,
        nat_num: resultItem.COD_NAT_EMPL,
      },
      is_external: true,
      module: "irisaExternalUserbase",
    };
  });
}

async function launch() {
  updateExternalUserbase();
  cron.schedule("0 * * * *", () => {
    updateExternalUserbase();
  });
}

module.exports = {
  launch,
  search,
  convertToUserAccount,
};
