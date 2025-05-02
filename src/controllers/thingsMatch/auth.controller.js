const { catchAsync } = require("../../utility/catchAsync.js");
const { errorResponse, successResponse } = require("../../utility/response.js");

//service
const thingsMatchAuthService = require("../../service/thingsMatch/auth.service.js");

//signup/signin Thingsmatch
const thingsMatchAccount = catchAsync(async (req, res) => {
  try {
    const result = await thingsMatchAuthService.thingsMatchAccount(
      req.params.token
    );
    if (!result) {
      throw new Error("Unable to fetch ThingsMatch account");
    }
    //send success response
    return successResponse(res, result);
  } catch (error) {
    console.log("Error in thingsMatchAccount controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Update ThingsMatch account
const updateThingsMatchAccount = catchAsync(async (req, res) => {
  try {
    const token = req.params.token;
    const updateData = req.body;

    const updatedAccount =
      await thingsMatchAuthService.updateThingsMatchAccount(token, updateData);

    return successResponse(res, {
      message: "ThingsMatch account updated successfully",
      account: updatedAccount,
    });
  } catch (error) {
    console.log("Error in updateThingsMatchAccount controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Get ThingsMatch user profile
const getThingsMatchUser = catchAsync(async (req, res) => {
  try {
    // Use the authenticated user's ID from middleware
    const thingsMatchUserId = req.TMID;

    const user = await thingsMatchAuthService.getUser(thingsMatchUserId);

    return successResponse(res, {
      message: "User profile retrieved successfully",
      user: user,
    });
  } catch (error) {
    console.log("Error in getThingsMatchUser controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

module.exports = {
  thingsMatchAccount,
  updateThingsMatchAccount,
  getThingsMatchUser,
};
