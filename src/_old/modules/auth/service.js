const config = require("config");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const async = require("../../middleware/async");
const { sendVerificationSms } = require("../../utils/smsHelper");
const { getIrisaEmp } = require("../../utils/irisaHelper");
const { Account, TempAcc } = require("./model");
const { AppError } = require("../../constructor/AppError");
const { User } = require("./../user/model");
const { replaceArabicCharacters, standardPhoneNum } = require("../../utils/stringHelper");
const roles = require("../../global_values/roles");

const signupStepOne = async (req, res) => {
  const { emp_num, phone_num: phone_num_original, nat_num } = req.body;

  let phone_num = standardPhoneNum(phone_num_original);

  const user = await User.findOne({
    $or: [{ emp_num }, { phone_num }, { nat_num }],
  });
  if (user != null && user.role.includes(roles.passenger)) {
    throw new AppError("کاربر قبلا به عنوان مسافر ثبت نام شده است", 400);
  }

  let tempAccount = await TempAcc.findOne({
    emp_num,
    nat_num,
    phone_num,
    temp_num_exp: { $gt: Date.now() },
  });
  if (tempAccount)
    return res.status(200).send({
      info: "کد اعتبار سنجی قبلا ارسال شده است",
      token: tempAccount.generateAuthToken(),
      doc: "",
    });
  const irisaEmp = await getIrisaEmp(emp_num);
  console.log({ irisaEmp });
  const full_name = replaceArabicCharacters(irisaEmp.NAM_EMPL + " " + irisaEmp.NAM_SNAM_EMPL);
  if (irisaEmp.COD_NAT_EMPL === nat_num.toString()) {
    tempAccount = await TempAcc.create({
      emp_num,
      nat_num,
      phone_num,
      full_name,
      username: irisaEmp.USER_NAME,
      post: irisaEmp.DES_MANAG,
    });
    const token = await tempAccount.createSMSToken();

    try {
      // console.log({sms : token});
      await sendVerificationSms(
        phone_num,
        token,
        config.get("KAVEHNEGAR_TEMP")
      );
      const resObj = {
        info: "کد اعتبار سنجی با موفقیت ارسال شد",
        token: tempAccount.generateAuthToken(),
        doc: "",
      };

      return res.status(201).send(resObj);
    } catch (error) {

      await tempAccount.delete();
      if (error?.response?.data?.return?.message)
        throw new AppError(error?.response?.data?.return?.message, 400);
      throw new AppError("اشکال در ارسال پیامک اعتبار سنجی", 400);
    }
  } else {
    throw new AppError("ثبت نام غیر مجاز", 400);
  }
};

const signupStepTwo = async (req, res) => {
  const { temp_num } = req.body;
  const tempAccount = await TempAcc.findById(req.user._id);
  if (!tempAccount) throw new AppError("کاربر یافت نشد", 404);
  if (await bcrypt.compare(temp_num, tempAccount.temp_num)) {
    if (moment(Date.now()).isAfter(tempAccount.temp_num_exp))
      throw new AppError("کد اعتبار سنجی منقضی شده است", 400);
    const user = await tempAccount.createAccounts();
    await tempAccount.delete();
    const token = user.generateAuthToken();

    return res.status(201).send({
      info: "ثبت نام با موفقیت انجام شده",
      token,
      doc: "",
    });
  } else {
    tempAccount.delete();
    throw new AppError(
      "کد اعتبار سنجی اشتباه وارد شد. لطفا دوباره اقدام به ثبت نام نمایید"
    );
  }
};

const signin = async (req, res) => {
  const { username, password, is_passenger } = req.body;
  const account = await Account.findOne({ username, is_active: true });

  if (!account) throw new AppError("کاربر یافت نشد", 404);

  if (!(await account.correctPassword(password)))
    throw new AppError("نام کاربری یا رمز عبور نادرست است", 404);
  const user = await User.findById(account.user_id);

  if (is_passenger && !user.is_passenger) {
    user.is_passenger = true;
    await user.save();
  }

  res.status(200).send({
    info: "شما با موفقیت وارد شدید",
    token: user.generateAuthToken(),
    doc: "",
  });
  user.last_login_date = new Date();
  user.save();
};

exports.signupStepOne = async(signupStepOne);
exports.signupStepTwo = async(signupStepTwo);
exports.signin = async(signin);
