
const moment = require("jalali-moment");
const { Types } = require("mongoose");
const { log } = require("winston");
const { AppError } = require("../../constructor/AppError");
const { getRoleString, getAdministrativeRole } = require("../../utils/userHelper");
const { Request } = require("../request/model");
const { Trip } = require("../trip/model");

exports.getDailyStatistics = async function (req, res) {

    const role = getAdministrativeRole(req.user.role)
    const today = moment().format("YYYY-MM-DDT00:00:00.000+00:00");

    const Collection = req.params.collection == 'requests' ? Request : req.params.collection == 'trips'
        ? Trip : null;

    if (Collection == null) {
        return res.status(403).send("Invalid Param : " + req.params.collection);
    }

    const result = {};


    for (let i = 0; i < 24; i++) {

        const hourLimit = {
            hourStart: i * 100,
            hourEnd: (i + 1) * 100
        }

        const requests = await Collection.aggregate([{
            $match: {
                ...(!["admin", "superDispatcher"].includes(role) && { [`${role}.account_id`]: Types.ObjectId(req.user._id) }),
                for_date: new Date(today),
                for_time: {
                    $gte: hourLimit.hourStart,
                    $lte: hourLimit.hourEnd,
                }
            }
        }, {
            $facet: {
                'by_stats': [{
                    $group: {
                        _id: "$status",
                        total: { $count: {} }
                    }
                }]
            }
        }]);

        result[i] = requests;
    }

    res.status(200).send({ result });
}

exports.getMonthlyStatistics = async function (req, res) {
    const role = getAdministrativeRole(req.user.role)

    const montlyGroups = getStartAndEndOfYears([1401]);

    const Collection = req.params.collection == 'requests' ? Request : req.params.collection == 'trips'
        ? Trip : null;

    if (Collection == null) {
        return res.status(403).send("Invalid Param : " + req.params.collection);
    }

    const result = {};
    const keys = Object.keys(montlyGroups);
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const requests = await Collection.aggregate([{
            $match: {
                ...(!["admin", "superDispatcher"].includes(role) && { [`${role}.account_id`]: Types.ObjectId(req.user._id) }),
                for_date: {
                    $gte: new Date(montlyGroups[k].startOfMonth),
                    $lte: new Date(montlyGroups[k].endOfMonth)
                }
            }
        }, {
            $facet: {
                'by_stats': [{
                    $group: {
                        _id: "$status",
                        total: { $count: {} }
                    }
                }]
            }
        }
        ]);
        result[k] = requests;
    }

    res.status(200).send({ result });

}

function getStartAndEndOfYears(years) {

    const result = {};
    for (let i = 0; i < years.length; i++) {
        const y = years[i];
        for (let j = 1; j <= 12; j++) {
            const key = `${y}/${j}`;
            const m = moment.from(key, 'fa', 'YYYY/MM');

            const startOfMonth = m.locale('fa').startOf('month').locale('en').format('YYYY-MM-DDT00:00:00.000+00:00');
            const endOfMonth = m.locale('fa').endOf('month').locale('en').format('YYYY-MM-DDT23:59:59.999+00:00');
            result[key] = { startOfMonth, endOfMonth };
        }
    }
    return result;

}

exports.getRequestStatistics = async function (req, res) {
    const role = getAdministrativeRole(req.user.role)
    const requests = await Request.aggregate([{
        $match: {
            ...(!["admin", "superDispatcher"].includes(role) && { [`${role}.account_id`]: Types.ObjectId(req.user._id) })
        }
    }, {
        $facet: {
            'by_status': [{
                $group: {
                    _id: "$status",
                    total: { $count: {} }
                }
            }],
            "by_area": [{
                $lookup: {
                    from: 'areas',
                    localField: 'area_id',
                    foreignField: "_id",
                    as: 'area'
                }
            }, { $unwind: '$area' }, { $group: { _id: '$area._id', name: { $first: '$$CURRENT.area.name' }, total: { $count: {} } } }],
            "by_dispatcher": [{
                $project: {
                    main_dispatcher: { $first: "$dispatcher" }
                }
            },
            {
                $group: {
                    _id: "$main_dispatcher.account_id", full_name: { $first: '$$CURRENT.main_dispatcher.full_name' }, total: { $count: {} }
                },
            }],
            "by_manager": [{
                $group: { _id: '$manager.full_name', total: { $count: {} } }
            }],
            "by_proj_code": [{
                $match: {
                    "cost_manager.proj_code": {
                        $exists: true,
                        $ne: null
                    }
                }
            },
            {
                $group: { _id: '$cost_manager.proj_code', total: { $count: {} } }
            }],
            "by_cost_center": [{
                $match: {
                    "cost_manager.cost_center": {
                        $exists: true,
                        $ne: null
                    }
                }
            },
            {
                $group: { _id: '$cost_manager.cost_center', total: { $count: {} } }
            }],
            "by_date": [{
                $group: { _id: { month: { $month: '$for_date' }, year: { $year: '$for_date' } }, total: { $count: {} } }
            }],
        }
    }])
    res.status(200).send({ info: 'success', requests })
}
exports.getTripStatistics = async function (req, res) {
    const role = getAdministrativeRole(req.user.role)
    const trips = await Trip.aggregate([{
        $match: {
            ...(!["admin", "superDispatcher"].includes(role) && { [`${role}.account_id`]: Types.ObjectId(req.user._id) })
        }
    }, {
        $facet: {
            'by_car': [{
                $group: {
                    _id: '$car.car_id',
                    car: { $first: "$$CURRENT.car" },
                    driver: { $first: "$$CURRENT.driver" },
                    total: { $count: {} }
                }
            }],
            "by_satisfaction_rate": [
                { $unwind: '$passengers' },
                { $unwind: '$reviews' },
                { $project: { passengers: 1, reviews: 1, driver: 1 } },
                {
                    $match: {
                        $expr: {
                            $eq: ['$passengers.account_id', "$reviews.user.account_id"]
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id', ave_rate: { $avg: '$reviews.satisfaction_rate' }, reviews: { $addToSet: '$reviews' }, passengers: { $addToSet: '$passengers' }, driver: { $first: '$$CURRENT.driver' }
                    }
                },
                {
                    $group: {
                        _id: '$driver.user.full_name', ave_rate: { $avg: '$ave_rate' }, total: { $count: {} }
                    }
                },
            ],
            'by_status': [{ $group: { _id: '$status', total: { $count: {} } } }],
            "by_dispatcher": [{ $group: { _id: '$dispatcher.full_name', total: { $count: {} } } }]
        }
    }])
    res.status(200).send({ info: 'success', trips })
}