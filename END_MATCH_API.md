# ThingsMatch API - End Match Endpoint

## Overview

This document describes the new API endpoint for ending a match in the ThingsMatch system. This endpoint allows item owners to complete a match transaction and mark their item as given away.

## Endpoint

### End Match

**PATCH** `/thingsMatch/matches/:matchId/end`

Ends a match and marks the associated item as given away. This action can only be performed by the item owner.

#### Requirements

- User must be authenticated as a ThingsMatch user
- User must be the owner of the item in the match
- Match must be in either "active" or "pendingInterest" status

#### Parameters

- `matchId` (path parameter): The ID of the match to end

#### Request Headers

- `Authorization`: Bearer token (handled by authentication middleware)

#### Response

**Success (200)**

```json
{
  "status": "success",
  "data": {
    "message": "Match ended successfully. Item marked as given away.",
    "match": {
      "_id": "matchId",
      "itemOwnerId": "ownerId",
      "itemSwiperId": "swiperId",
      "itemId": "itemId",
      "status": "completed_by_owner",
      "createdAt": "2025-06-26T...",
      "updatedAt": "2025-06-26T..."
    },
    "item": {
      "_id": "itemId",
      "name": "Item Name",
      "status": "given_away",
      "discoveryStatus": "faded"
      // ... other item fields
    }
  }
}
```

**Errors**

- `401 Unauthorized`: User not authenticated for ThingsMatch
- `404 Not Found`: Match not found
- `403 Forbidden`: Only the item owner can end this match
- `400 Bad Request`: Cannot end match with current status (e.g., already completed)

#### Side Effects

When a match is successfully ended:

1. **Item Updates**:

   - Item status changes to "given_away"
   - Item discoveryStatus changes to "faded" (hidden from discovery)

2. **Match Updates**:

   - Match status changes to "completed_by_owner"

3. **Message Cleanup**:

   - All messages associated with this match are deleted to prevent database bloat

4. **User Statistics**:

   - Item owner's `itemsShared` count is incremented by 1

5. **Real-time Notifications**:
   - Both participants receive a `matchEnded` socket event
   - The swiper receives a specific `matchCompleted` notification

#### Usage Example

```javascript
// Frontend code example
const endMatch = async (matchId) => {
  try {
    const response = await fetch(`/api/thingsMatch/matches/${matchId}/end`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.status === "success") {
      console.log("Match ended successfully");
      // Handle UI updates
    }
  } catch (error) {
    console.error("Failed to end match:", error);
  }
};
```

#### Socket Events

The endpoint emits the following socket events:

1. **matchEnded** (to match room):

   ```json
   {
     "match": {
       /* updated match object */
     },
     "item": {
       /* updated item object */
     },
     "message": "This match has been completed by the item owner"
   }
   ```

2. **matchCompleted** (to swiper):
   ```json
   {
     "match": {
       /* updated match object */
     },
     "reason": "Item has been given away by owner"
   }
   ```

## Related Models

### Match Status Values

- `active`: Match is confirmed and both users can chat
- `pendingInterest`: Swiper has expressed interest, waiting for owner confirmation
- `completed_by_owner`: Match ended by item owner (this endpoint)
- `completed_by_swiper`: Match ended by swiper
- `blocked`: One user has blocked the other
- `owner_blocked_swiper`: Owner specifically blocked the swiper
- `swiper_blocked_owner`: Swiper specifically blocked the owner
- `unmatched`: Match was unmatched
- `archived`: Match is archived

### Item Status Values

- `available`: Item is available for matching
- `matched`: Item is currently matched (but not yet given away)
- `given_away`: Item has been given away (set by this endpoint)

### Item Discovery Status Values

- `visible`: Item appears in discovery
- `hidden_temporarily`: Item is temporarily hidden
- `faded`: Item is faded/hidden (set by this endpoint)

## Security Notes

- Only the item owner can end a match
- Authentication is required through the `isThingsMatchUser` middleware
- The endpoint validates match ownership before proceeding
- All message cleanup is performed atomically

## Database Impact

This endpoint performs the following database operations:

1. Updates the match document
2. Updates the item document
3. Updates the user statistics
4. Deletes all related messages

All operations are designed to maintain data consistency and prevent orphaned records.
