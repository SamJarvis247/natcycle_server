const httpStatus = require('http-status');
const { catchAsync } = require('../../utility/catchAsync.js');
const { errorResponse, successResponse } = require('../../utility/response.js')

//service
const thingsMatchAuthService = require("../../service/thingsMatch/auth.service.js")

//signup/signin Thingsmatch
const thingsMatchAccount = catchAsync(async (req, res) => {
    try {
        const natcycleId = await thingsMatchAuthService.thingsMatchAccount(req.params.token)
        if (!natcycleId) {
            throw new Error("Unable to fetch natcycleId")
        }
        //send success response
        return successResponse(res, { natcycleId })
    } catch (error) {
        console.log("Error in thingsMatchAccount controller:", error)
        if (error instanceof Error) {
            return errorResponse(res, error.message)
        }
    }

});


module.exports = {
    thingsMatchAccount
}
