const {
  createFavoriteLocation,
  editFavoriteLocation,
  listFavoriteLocations,
  deleteFavoriteLocation,
} = require("../data");

async function createLocation(req, res) {
  const { name, properties, lnglat, is_private } = req.body;
  const create_by_account_id = req.auth._id;
  const result = await createFavoriteLocation(
    name,
    properties,
    lnglat,
    create_by_account_id,
    is_private
  );

  if (result.error) return res.status(400).send(result.error);
  return res.status(200).send(result);
}
async function editLocation(req, res) {
  const _id = req.params.id;
  const editor_account_id = req.auth._id;
  const { name, properties, lnglat, is_private } = req.body;
  const result = await editFavoriteLocation(
    _id,
    name,
    properties,
    lnglat,
    is_private,
    editor_account_id
  );

  if (result.error) return res.status(400).send(result.error);
  return res.status(200).send(result);
}
async function getLocations(req, res) {
  const account_id = req.auth._id;

  const options = req.query;

  const result = await listFavoriteLocations(account_id, options);
  return res.status(200).send(result);
}
async function deleteLocation(req, res) {
  const _id = req.params.id;
  const result = await deleteFavoriteLocation(_id);

  if (result.error) return res.status(400).send(result.error);
  return res.status(200).send(result);
}

module.exports.createLocation = createLocation;
module.exports.editLocation = editLocation;
module.exports.getLocations = getLocations;
module.exports.deleteLocation = deleteLocation;
