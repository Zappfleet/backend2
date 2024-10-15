const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const { Restriction, keyEnum } = require("../restriction/restriction.model");

const restrictions = [
  // { title: " آخرین زمان ثبت درخواست روزانه", desc: "آخرین زمانی که کاربران برای روز جاری میتوانند درخواست خودرو کنند", value: '', key: 1, unit: 'ساعت ', type: 'time' },
  // { title: " اولین زمان ثبت درخواست روزانه", desc: "اولین زمانی که کاربران برای روز جاری میتوانند درخواست خودرو کنند", value: '', key: 2, unit: 'ساعت ', type: 'time' },
  // { title: "فاصله زمانی بین درخواست های یک کاربر", desc: " حداقل فاصله زمانی  بین دو درخواست متوالی یک کاربر در طول یک روز ", value: '', key: 3, unit: 'دقیقه ', type: 'number' },
  // { title: "محدودیت زمانی درخواست لحظه ای", desc: "حداقل زمان قبل از ثبت درخواست لحظه ای", value: '', key: 4, unit: 'دقیقه ', type: 'number' },
  { title: "محدودیت زمانی شروع پیش از موعد ماموریت توسط راننده", desc: "حداقل زمان قبل از ساعت سفر که رانندگان بتوانند سفر را آغاز نمایند ", value: '', key: 5, unit: 'دقیقه ', type: 'number' },
  // { title: "حداکثر فاصله زمانی نسبت به زمان درخواست برای شروع سفر توسط راننده", desc: "حداکثر زمان بعد از ساعت سفر که رانندگان بتوانند سفر را آغاز نمایند ", value: '', key: 6, unit: 'دقیقه ', type: 'number' },
];

exports.saveRestriction = async function (req, res) {
  const { key, value } = req.body;
  if (!keyEnum.includes(key)) return sendErrorByEnviorment('کلید وارد شده معتبر نیست')
  let restriction = await Restriction.findOneAndUpdate({ key }, { value });
  if (!restriction) restriction = Restriction.create({ key, value });
  res.status(201).send({ info: 'success', doc: "" })
};

exports.getRestriction = async function (req, res, next) {
  const savedRestrictions = await Restriction.find();
  restrictions.forEach(r => {
    const theRestriction = savedRestrictions.find(s => s.key === r.key)
    if (theRestriction) {
      r.value = theRestriction.value
    }
  });
  res.status(200).send({ info: 'success', docs: restrictions })
}

