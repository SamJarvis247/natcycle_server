const { catchAsync } = require("../../utility/catchAsync.js");
const { errorResponse, successResponse } = require("../../utility/response.js");

//service
const thingsMatchAuthService = require("../../service/thingsMatch/auth.service.js");

//ADMIN CONTROLLERS
//get all users
const getAllUsers = catchAsync(async (req, res) => {
  try {
    console.log("Fetching all users...");
    const users = await thingsMatchAuthService.getAllUsers();

    return successResponse(res, {
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.log("Error in getAllUsers controller:", error);
    if (error instanceof Error) {
      console.log("Sending error response...");
      return errorResponse(res, error.message);
    }
  }
});
//get user by id
const getUserById = catchAsync(async (req, res) => {
  try {
    console.log("Fetching user by id...", req.params.id);
    const id = req.params.id;
    //get user by id
    const user = await thingsMatchAuthService.getUserById(id);
    console.log("🚀 ~ getUserById ~ user:", user)

    return successResponse(res, {
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.log("Error in getUserById controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

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

//get user
const getUser = catchAsync(async (req, res) => {
  try {
    console.log("Fetching user profile for ThingsMatch...", req.TMID);
    const TMID = req.TMID;
    //get user by TMID
    const user = await thingsMatchAuthService.getUser(TMID);

    return successResponse(res, {
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.log("Error in getUser controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

module.exports = {
  thingsMatchAccount,
  updateThingsMatchAccount,
  getUser,
  getAllUsers,
  getUserById,
};
