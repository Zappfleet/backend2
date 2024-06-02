module.exports = (search) => {
    const searchTrimmed = search?.trim() || "";
    if (searchTrimmed.length == 0) return {};
    return {
        $or: [
            { full_name: { '$regex': searchTrimmed } },
            { username: { '$regex': searchTrimmed } },
            { phone: { '$regex': searchTrimmed } },
            { "details.nat_num": { '$regex': searchTrimmed } },
            { "details.personel_code": { '$regex': searchTrimmed } }
        ]
    }
}