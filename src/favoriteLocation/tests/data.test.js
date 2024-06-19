const { expectCt } = require("helmet");
const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const { getRandomInt, getRandomFloat } = require("../../utils");
const { ConnectDatabase, DropDatabase } = require("../../utils-test");
const {
  getLastLocation,
  getLocationHistory,
  pushLocationIfFarEnough,
  createFavoriteLocation,
  editFavoriteLocation,
  listFavoriteLocations,
  deleteFavoriteLocation,
} = require("../data");
const { GpsHistory } = require("../data/gps");
const { FavoriteLocation } = require("../data/favorit-location-model");

beforeAll(async () => {
  await ConnectDatabase("locations-test");
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await DropDatabase();
});

async function clearDatabase() {
  await GpsHistory.deleteMany({});
  await FavoriteLocation.deleteMany({});
}

test("delete favorite location", async () => {
  const name = "test-loc-11542";
  const lnglat = [59, 32];
  const create_by_account_id = new mongoose.Types.ObjectId();
  const is_private = false;
  const result = await createFavoriteLocation(
    name,
    undefined,
    lnglat,
    create_by_account_id,
    is_private
  );
  const { location } = result;
  expect(location.properties).toBeTruthy();

  const list = await listFavoriteLocations(create_by_account_id);
  expect(list.length).toBe(1);

  await deleteFavoriteLocation(location._id, create_by_account_id);
  const updatedList = await listFavoriteLocations(create_by_account_id);
  expect(updatedList.length).toBe(0);
});

test("create favorite location create/update", async () => {
  const name = "test-loc";
  const properties = {
    test1: "some-value",
  };
  const lnglat = [59, 32];
  const create_by_account_id = new mongoose.Types.ObjectId();
  const is_private = false;
  const result = await createFavoriteLocation(
    name,
    properties,
    lnglat,
    create_by_account_id,
    is_private
  );
  const { location } = result;

  expect(location.name).toBe(name);
  expect(location.is_private).toBe(is_private);
  expect(location.location.coordinates[0]).toBe(lnglat[0]);
  expect(location.location.coordinates[1]).toBe(lnglat[1]);
  expect(location.properties.test1).toBe(properties.test1);

  const name2 = "test-loc";
  const properties2 = {
    another_filed: "some-value",
  };
  const lnglat2 = [50, 44];

  const another_create_by_account_id = new mongoose.Types.ObjectId();
  const { location: updatedLocation } = await editFavoriteLocation(
    location._id,
    name2,
    properties2,
    lnglat2,
    undefined,
    another_create_by_account_id
  );

  expect(updatedLocation.name).toBe(name2);
  expect(updatedLocation.location.coordinates[0]).toBe(lnglat2[0]);
  expect(updatedLocation.location.coordinates[1]).toBe(lnglat2[1]);
  expect(updatedLocation.properties.test1).not.toBeTruthy();

  expect(updatedLocation.properties.another_filed).toBe(
    properties2.another_filed
  );
});

test("location gps push", async () => {
  const owner_id = new ObjectId();
  const lng = 50.35214555;
  const lat = 29.11214555;
  const speed = 30;
  const gmt_date = new Date();
  const entity = await pushLocationIfFarEnough(
    owner_id,
    lng,
    lat,
    gmt_date,
    speed
  );

  expect(entity.owner_id.toString()).toBe(owner_id.toString());
  expect(entity.coordinates[0]).toBe(lng);
  expect(entity.coordinates[1]).toBe(lat);
  expect(entity.speed).toBe(speed);
});

test("location history", async () => {
  const owner_id = new ObjectId();
  const count = 10;

  const path = await generateLocation(count, owner_id);
  const lastGeneratedResult = path[path.length - 1];

  const lastLocation = await getLastLocation(owner_id);

  expect(lastLocation.owner_id.toString()).toBe(
    lastGeneratedResult.owner_id.toString()
  );
  expect(lastLocation.coordinates[0]).toBe(lastGeneratedResult.coordinates[0]);
  expect(lastLocation.coordinates[1]).toBe(lastGeneratedResult.coordinates[1]);
  expect(lastLocation.speed).toBe(lastGeneratedResult.speed);

  const history = await getLocationHistory(
    owner_id,
    path[0].gmt_date,
    path[path.length - 1].gmt_date
  );
  expect(history.length).toBe(path.length - 1);
});

async function generateLocation(count, owner_id) {
  const path = [];

  const seedLng = getRandomFloat(50.3, 51.8);
  const seedLat = getRandomFloat(29.3, 29.8);

  const seedDate = new Date();

  for (let i = 0; i < count; i++) {
    const lng = seedLng + i * getRandomFloat(-0.06, 0.06);
    const lat = seedLat + i * getRandomFloat(-0.06, 0.06);
    const speed = getRandomInt(0, 5) > 3 ? 100 : 0;
    const gmt_date = new Date(seedDate.getTime() + i * 10000);
    const entity = await pushLocationIfFarEnough(
      owner_id,
      lng,
      lat,
      gmt_date,
      speed
    );
    path.push(entity);
  }

  return path;
}
