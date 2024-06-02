const Region = require("./region-model");
const { ObjectId } = require("mongodb");

async function listRegions(args = {}) {
  const { filter = {} } = args;
  filter.is_active = true;
  return await Region.find(filter).populate(["dispatcher"]);
}

async function getRegionsAssignedToUser(user_id) {
  return {
    regions: await Region.find({
      $or: [
        { dispatcher: new ObjectId(user_id) },
        { alternativeDispatcher: new ObjectId(user_id) },
      ],
      is_active: true,
    }),
  };
}

async function getRegionDocById(id) {
  const region = await Region.findOne({
    _id: new ObjectId(id),
    is_active: true,
  });
  if (region != null && region.alternativeDispatcher == null) {
    region.alternativeDispatcher = [];
  }
  return {
    region,
  };
}

async function createRegion(args) {
  const { name, geometry, properties, dispatcher } = args;
  const overlaps = await getOverlappingRegionsOnGeometry(geometry);

  if (overlaps != "") {
    return { error: "overlapping areas", extra: overlaps, status: 400 };
  }

  closeGeometry(geometry);

  return {
    region: await Region.create({ name, geometry, dispatcher, properties }),
  };
}

async function assignAlternativeDispatcher(region_id, user_id) {
  const { region } = await getRegionDocById(region_id);
  region.alternativeDispatcher.push(new ObjectId(user_id));
  await region.save();
}

async function revokeAlternativeDispatcher(region_id, user_id) {
  const { region } = await getRegionDocById(region_id);
  region.alternativeDispatcher = region.alternativeDispatcher.filter((id) => {
    return !new ObjectId(user_id).equals(id);
  });
  await region.save();
}

async function updateRegion(_id, args) {
  const { name, geometry, properties, dispatcher } = args;

  if (geometry) {
    const overlaps = await getOverlappingRegionsOnGeometry(geometry, _id);
    if (overlaps != "") {
      return { error: "overlapping areas", extra: overlaps, status: 400 };
    }
  }

  const $set = {};
  name && ($set.name = name);
  geometry && ($set.geometry = geometry);
  properties && ($set.properties = properties);
  dispatcher && ($set.dispatcher = dispatcher);

  closeGeometry(geometry);

  return {
    region: await Region.findByIdAndUpdate(_id, { $set }, { new: true }),
  };
}

async function disableRegion(_id) {
  return {
    region: await Region.findByIdAndUpdate(
      _id,
      { $set: { is_active: false } },
      { new: true }
    ),
  };
}

async function getOverlappingRegionsOnGeometry(geometry, original_region_id) {
  const results = [];
  for (el of geometry.coordinates[0]) {
    const regions = await Region.find({
      is_active: true,
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: el,
          },
        },
      },
    });

    const filteredRegions = regions.filter(
      (r) => !r._id.equals(original_region_id)
    );
    results.push(filteredRegions.length != 0);
  }
  return results.some((overlaps) => {
    return overlaps;
  });
}

function closeGeometry(geometry) {
  if (!geometry) return;
  if (
    geometry.coordinates[0][0] !=
    geometry.coordinates[0][geometry.coordinates[0].length - 1]
  ) {
    geometry.coordinates[0].push(geometry.coordinates[0][0]);
  }
}

module.exports = {
  createRegion,
  updateRegion,
  disableRegion,
  listRegions,
  getRegionDocById,
  getRegionsAssignedToUser,
  assignAlternativeDispatcher,
  revokeAlternativeDispatcher,
};
