const SavedHostelService = require("../services/saved-hostel.service.js");
const ApiResponse = require("../utils/apiResponse.js");

const saveHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.id;

    const result = await SavedHostelService.saveHostel(userId, hostelId);

    return ApiResponse.success(res, "Hostel saved successfully", result, 201);
  } catch (error) {
    next(error);
  }
};

const unsaveHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.id;

    const result = await SavedHostelService.unsaveHostel(userId, hostelId);

    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};

const toggleSaveHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.id;

    const result = await SavedHostelService.toggleSave(userId, hostelId);

    return ApiResponse.success(res, result.message, {
      isSaved: result.isSaved,
    });
  } catch (error) {
    next(error);
  }
};

const getSavedHostels = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sortBy = "recent", search = "" } = req.query;

    const result = await SavedHostelService.getSavedHostels(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      search,
    });

    return ApiResponse.success(
      res,
      "Saved hostels retrieved successfully",
      result,
    );
  } catch (error) {
    next(error);
  }
};

const checkSavedStatus = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const userId = req.user.id;

    const result = await SavedHostelService.isHostelSaved(userId, hostelId);

    return ApiResponse.success(res, "Status retrieved", result);
  } catch (error) {
    next(error);
  }
};

const checkMultipleSavedStatus = async (req, res, next) => {
  try {
    const { hostelIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(hostelIds) || hostelIds.length === 0) {
      return ApiResponse.error(res, "hostelIds must be a non-empty array", 400);
    }

    const result = await SavedHostelService.checkSavedStatus(userId, hostelIds);

    return ApiResponse.success(res, "Status retrieved", result);
  } catch (error) {
    next(error);
  }
};

const getSavedCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await SavedHostelService.getSavedCount(userId);

    return ApiResponse.success(res, "Count retrieved", result);
  } catch (error) {
    next(error);
  }
};

const clearAllSaved = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await SavedHostelService.clearAllSaved(userId);

    return ApiResponse.success(res, result.message, { count: result.count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveHostel,
  unsaveHostel,
  toggleSaveHostel,
  getSavedCount,
  checkSavedStatus,
  getSavedHostels,
  checkMultipleSavedStatus,
  clearAllSaved,
};
