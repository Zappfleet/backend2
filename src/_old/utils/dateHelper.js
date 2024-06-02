const jalaliMoment = require('jalali-moment')
exports.isoToJalali = function (iso) {
    if (iso == null) return "";
    //2021-12-06T00:00:00.000Z
    const gregString = iso?.substring(0, 10).split("-").join("/");
    return jalaliMoment(gregString, "YYYY/MM/DD")
        .locale("fa")
        .format("YYYY/MM/DD");

}
exports.IsoToJalaliWithTime = function (iso) {
    if (!iso) return ;
    //2021-12-06T00:00:00.000Z
    console.log(jalaliMoment(iso).locale("fa").format("YYYY/MM/DD hh:mm"));
    return jalaliMoment(iso)
        .locale("fa")
        .format("YYYY/MM/DD HH:mm");
}
exports.timeToString = function (time) {
    if (time == null) return "";
    let hour = Math.floor(time / 100);
    let min = time % 100;
    hour = hour < 10 ? "0" + hour : hour;
    min = min < 10 ? "0" + min : min;
    return `${hour}:${min}`;
}
