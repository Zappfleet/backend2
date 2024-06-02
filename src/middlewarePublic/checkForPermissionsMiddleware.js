const { checkForPermissions } = require("../users/data/user");
//const {PermissionSet} = require("../../../src/users/data/constants/permissions"); // Adjust the path according to your project structure

// Define a function that returns the middleware with user and permissions parameters
const checkForPermissionsMiddleware = (params) => {
  //console.log(2000, params.user.roles[0].permissions);
  return async (req, res, next) => {
    try {
      const isPermitted = await checkForPermissions(params.user, params.permission)
    //  console.log(3000, isPermitted,isPermitted[params.permission])
      // If everything is fine, proceed to the next middleware or controller
      if (isPermitted[params.permission] === true) {
        return next();
      }
     // console.log(123);
      return res.send({
        status: 403,
        data: null
      });

    } catch (error) {
    //  console.log(8000);
      // Handle any errors that occur during permission checking
      console.error("Error in permission checking middleware:", error);
      return res.status(500).json({ message: "SGH Not Access" });
    }
  };
};

module.exports.checkForPermissionsMiddleware = checkForPermissionsMiddleware
