const permissions = require("../../global_values/permissions");
const auth = require("../../middleware/auth");
const { canOnQuery, can } = require("../../middleware/can");
const { paramObjectId } = require("../../middleware/param_object_id");
const { checkSpecificity, isResponsibleAndCan } = require("./middleware");
const {
  getSingleRequestValidator,
  postRequestValidator,
  accptOthrRqstValidator,
  rjOthrRqstValidator,
  cnclOthrRqstValidator,
  chngOthrRqstTmValidator,
  chngOthrRqstStrtValidator,
  checkRequestValidator,
  postSelfRequestValidator,
  changeRequestValidator,
  checkManagerRequestValidator,
} = require("./schema_validator");

const {
  createRequest,
  deleteOthersRequest,
  getSelfRequests,
  getSelfSpeceficRequest,
  getUserRoleRequests,
  getUserRoleSpecificRequest,
  chngOthrRqstStrt,
  chngOthrRqstTm,
  cnclOthrRqst,
  rjOthrRqst,
  accptOthrRqst,
  cnclSlfRqst,
  checkRequest,
  changeRequestTime,
  checkManagerRequest,
} = require("./service");

module.exports = {
  configure(app) {
    //GET
    app.get(
      "/request",
      auth,
      can("GET", permissions.GET.rqstLs),
      getUserRoleRequests
    );
    app.get(
      "/request/me",
      auth,
      can("GET", permissions.GET.slRqstLs),
      getSelfRequests
    );

    app.get(
      "/request/:id",
      auth,
      can("GET", permissions.GET.rqstDt),
      getSingleRequestValidator,
      getUserRoleSpecificRequest
    );
    
    app.get(
      "/request/me/:id",
      auth,
      can("GET", permissions.GET.slRqstDt),
      getSelfSpeceficRequest
    );

    app.get(
      "/request/:id/check",
      paramObjectId,
      checkManagerRequestValidator,
      checkManagerRequest
    );

    //POST
    app.post(
      "/request",
      auth,
      can("POST", permissions.POST.rqst),
      postRequestValidator,
      checkSpecificity,
      createRequest
    );

    app.post(
      "/request/me",
      auth,
      can("POST", permissions.POST.slRqst),
      postSelfRequestValidator,
      checkSpecificity,
      createRequest
    );

    //PUT
    app.put(
      "/request/:id/check",
      auth,
      can("PUT", permissions.PUT.rqst),
      paramObjectId,
      checkRequestValidator,
      checkRequest
    );
    app.put(
      "/request/:id/time",
      auth,
      can("PUT", permissions.PUT.rqst),
      paramObjectId,
      changeRequestValidator,
      changeRequestTime
    );

    app.put(
      "/request/me/:id/cancel",
      auth,
      can("PUT", permissions.PUT.slRqst),
      paramObjectId,
      cnclSlfRqst
    );
  },
};
