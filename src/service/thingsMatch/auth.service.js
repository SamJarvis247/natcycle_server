const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const User = require("../../models/userModel.js");
const getCoordinates = require("../../utility/geocode.js");
const jwt = require("jsonwebtoken");

// Helper to verify JWT token
function getUserFromToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (!decoded._id) {
      throw new Error("Invalid token payload");
    }
    return decoded._id;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    throw new Error("Invalid token: " + error.message);
  }
}

// Helper to generate JWT token
function generateToken(accountId) {
  return jwt.sign(
    { _id: accountId, accountType: "thingsmatch" },
    process.env.TOKEN_SECRET
  );
}

async function thingsMatchAccount(token) {
  if (!token) {
    throw new Error("Token is required");
  }

  const natcycleId = getUserFromToken(token);

  const natCycleUser = await User.findById(natcycleId);
  if (!natCycleUser) {
    throw new Error("User not found in Natcycle collection");
  }

  let thingsMatchAccount = natCycleUser.thingsMatchAccount;
  let message = "ThingsMatch account fetched successfully";
  let newToken;
  let isRegistered = true;

  if (!thingsMatchAccount) {
    console.log(
      `User ${natcycleId} does not have a ThingsMatch account. Creating one...`
    );

    const query = {
      natcycleId: natcycleId,
      environmentalImpact: 0,
      monthlyGoal: 0,
      tags: [],
      interests: [],
      itemsShared: 0,
    };

    const newThingsMatchAccount = await ThingsMatchUser.create(query);
    if (!newThingsMatchAccount) {
      throw new Error("Failed to create ThingsMatch account");
    }

    thingsMatchAccount = newThingsMatchAccount._id;

    const updateResult = await natCycleUser.updateOne({ thingsMatchAccount });
    if (updateResult.modifiedCount !== 1) {
      throw new Error("Failed to link ThingsMatch account to Natcycle user");
    }

    console.log(`Created new ThingsMatch account: ${thingsMatchAccount}`);
    message = "ThingsMatch account created successfully";
    isRegistered = false;
  }

  newToken = generateToken(thingsMatchAccount);

  return {
    message,
    token: newToken,
    isRegistered,
  };
}

async function updateThingsMatchAccount(token, updateData) {
  if (!token) {
    throw new Error("Token is required");
  }

  // Handle address geocoding if provided
  if (updateData.address) {
    try {
      const geoData = await getCoordinates(updateData.address);

      updateData.location = {
        type: "Point",
        coordinates: [geoData.lng, geoData.lat],
        address: updateData.address,
      };

      // Log the geocoding result
      console.log(
        `Geocoded address to coordinates: [${geoData.lng}, ${geoData.lat}]`
      );

      delete updateData.address;
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  const thingsMatchAccountId = getUserFromToken(token);

  // Update the user account with the new data
  const updatedAccount = await ThingsMatchUser.findByIdAndUpdate(
    thingsMatchAccountId,
    updateData,
    { new: true, runValidators: true } // Added runValidators to ensure data integrity
  );

  if (!updatedAccount) {
    throw new Error("ThingsMatch account not found");
  }

  return updatedAccount;
}

//get user profile
async function getUser(thingsMatchAccountId) {
  const user = await ThingsMatchUser.findById(thingsMatchAccountId).populate(
    "natcycleId",
    "firstName lastName email profilePicture phoneNumber"
  );

  if (!user) {
    throw new Error("ThingsMatch user not found");
  }

  return user;
}

//admin services
async function getAllUsers() {
  const users = await ThingsMatchUser.find().populate(
    "natcycleId",
    "firstName lastName email profilePicture phoneNumber"
  );
  return users;
}
async function getUserById(thingsMatchAccountId) {
  const user = await ThingsMatchUser.findById(thingsMatchAccountId).populate(
    "natcycleId",
    "firstName lastName email profilePicture phoneNumber"
  );

  if (!user) {
    throw new Error("ThingsMatch user not found");
  }

  return user;
}

module.exports = {
  thingsMatchAccount,
  updateThingsMatchAccount,
  getUser,
  getAllUsers,
  getUserById,
};
