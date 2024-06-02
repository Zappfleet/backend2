const getPaginateOptions = (query, select) => {
  const page = query?.page;
  const limit = query?.limit;
  return {
    select: select,
    page: page ? page : 1,
    limit: limit ? limit : 10,
  };
};
module.exports = getPaginateOptions;
