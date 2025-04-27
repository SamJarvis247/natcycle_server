const CACHE_KEYS = {
  // General system keys
  ITEMS_LAST_UPDATED: "TMItemsLastUpdated", // Timestamp when any item was last added/updated/deleted

  // Item specific keys
  ITEM_DETAIL: (itemId) => `thingsMatchItem:${itemId}`, // Stores a single item's detailed data

  // User specific keys
  USER_AVAILABLE_ITEMS: (userId) => `TMUserAvailableItems:${userId}`, // Items available for a user to swipe
  USER_CACHE_TIMESTAMP: (userId) => `TMUserCacheTimestamp:${userId}`, // When user's item cache was last updated
  USER_SWIPES: (userId) => `TMUserSwipe:${userId}`, // User's swipe history
  USER_MATCHES: (userId) => `TMUserMatches:${userId}`, // User's matches
  USER_CREATED_ITEMS: (userId) => `TMUserCreatedItems:${userId}`, // Items created by a user

  //swipe related keys
  SWIPE_DETAILS: (swipeId) => `TMSwipe:${swipeId}`, // Details of a specific swipe
  SWIPE_HISTORY: (userId) => `TMSwipeHistory:${userId}`, // History of all swipes by a user
  SWIPE_MATCHES: (userId) => `TMSwipeMatches:${userId}`, // Matches made by a user
  // Match related keys
  MATCH_DETAILS: (matchId) => `TMMatch:${matchId}`, // Details of a specific match
  MATCH_HISTORY: (userId) => `TMMatchHistory:${userId}`, // History of all matches by a user

  // Potential future keys
  USER_LIKED_ITEMS: (userId) => `TMUserLikedItems:${userId}`, // Items a user has liked
  USER_PROFILE: (userId) => `TMUserProfile:${userId}`, // User profile data
  USER_STATS: (userId) => `TMUserStats:${userId}`, // User activity statistics
  CATEGORY_ITEMS: (category) => `TMCategoryItems:${category}`, // Items by category
  LOCATION_ITEMS: (location) => `TMLocationItems:${location}`, // Items by location
  POPULAR_ITEMS: "TMPopularItems", // Most popular/viewed items
  RECENT_ITEMS: "TMRecentItems", // Recently added items
  MATCH_DETAILS: (matchId) => `TMMatch:${matchId}`, // Details of a specific match

  /**
   * Helper method to get all keys for a specific user
   * Used for when a user deletes account or needs complete refresh
   */
  getAllUserKeys: (userId) => [
    CACHE_KEYS.USER_AVAILABLE_ITEMS(userId),
    CACHE_KEYS.USER_CACHE_TIMESTAMP(userId),
    CACHE_KEYS.USER_SWIPES(userId),
    CACHE_KEYS.USER_MATCHES(userId),
    CACHE_KEYS.USER_LIKED_ITEMS(userId),
    CACHE_KEYS.USER_PROFILE(userId),
    CACHE_KEYS.USER_STATS(userId),
    CACHE_KEYS.USER_CREATED_ITEMS(userId),
  ],
};

module.exports = CACHE_KEYS;
