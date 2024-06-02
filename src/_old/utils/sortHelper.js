const getSort = (req , def = {}) => {
    let sort;
    const { path, order } = req.query;
    // console.log(path);
    if (path) {
        sort = {[path] : order || 1};
        if (path == "for_date"){
            sort.for_time = order || 1;
        }
    }
    return sort || def;
}

module.exports = { getSort };