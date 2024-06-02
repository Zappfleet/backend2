const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");

const DEFAULT_POINT_TYPE = "Point";

const pointType = new mongoose.Schema(
    {
        type: {
            type: String,
            default: DEFAULT_POINT_TYPE,
        },
        coordinates: [Number],
    },
    { _id: false }
);

const favoriteLocationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        location: {
            type: pointType,
            index: "2dsphere",
        },
        properties: {
            type: Object,
            default: {},
            required: true,
        },
        created_by: {
            type: mongoose.Schema.ObjectId,
            ref: COLLECTION_USER_ACCOUNT,
            required: true,
            immutable: true,
        },
        is_private: {
            type: Boolean,
            default: true,
            required: true,
            immutable: true,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },

    },
    {
        collation: { locale: 'fa', strength: 1 },
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
favoriteLocationSchema.plugin(mongoosePaginate);

const FavoriteLocation = mongoose.model("FavoriteLocation", favoriteLocationSchema);

module.exports.FavoriteLocation = FavoriteLocation;
module.exports.DEFAULT_POINT_TYPE = DEFAULT_POINT_TYPE;
