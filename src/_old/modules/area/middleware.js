const { AppError } = require("../../constructor/AppError");
const async = require("../../middleware/async");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const Area = require("./model");

const checkSpecificity = async (req, res, next) => {
  const area_id = req.params.id;
  const { location } = req.body;
  for (el of location.coordinates[0]) {
    const area = await Area.findOne({
      is_active: true,
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: el,
          },
        },
      },
    });
    if (area && (area_id == null || !area._id.equals(area_id))) {
      throw new AppError(
        `نقاط این محدوده با محدوده ${area.name} همپوشانی دارند`,
        406
      );
    }
  }
  next();
};

const maxDispatcherNumber = async (req, res, next) => {
  // const maxNumber = await Var.findOne({ key: "MAX_DISPATCHER_NUMBER" }).select(
  //   "value -_id"
  // );
  const maxNumber = 1;
  const area = await Area.findById(req.params.id);
  if (!area) return sendErrorByEnviorment("محدوده مورد نظر وجود ندارد");
  if (area.dispatcher.length > maxNumber)
    throw new AppError("محدوده به حداکثر تعداد توزیع کننده رسید", 406);
  next();
};

exports.checkSpecificity = async(checkSpecificity);
exports.maxDispatcherNumber = async(maxDispatcherNumber);
