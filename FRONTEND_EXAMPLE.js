// Frontend example for using the End Match API

class ThingsMatchAPI {
  constructor(baseURL, authToken) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  async endMatch(matchId) {
    try {
      const response = await fetch(`${this.baseURL}/thingsMatch/matches/${matchId}/end`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Failed to end match:', error);
      throw error;
    }
  }
}

// Usage example
const api = new ThingsMatchAPI('http://localhost:3000/api', 'your-auth-token');

// In a React component or similar
const handleEndMatch = async (matchId) => {
  try {
    // Show loading state
    setLoading(true);
    setError(null);

    const result = await api.endMatch(matchId);

    // Handle success
    console.log('Match ended successfully:', result.data);

    // Update UI
    setMatchStatus('completed_by_owner');
    setItemStatus('given_away');

    // Show success message
    showNotification('Match completed! Item marked as given away.', 'success');

    // Refresh match list
    refreshMatches();

  } catch (error) {
    console.error('Error ending match:', error);
    setError(error.message);
    showNotification(`Failed to end match: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

// Example React component integration
const MatchCard = ({ match, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isOwner = match.itemOwnerDetails?.thingsMatchId === currentUser.TMID;
  const canEndMatch = isOwner && ['active', 'pendingInterest'].includes(match.status);

  const handleEndMatch = async () => {
    if (!window.confirm('Are you sure you want to end this match and mark the item as given away? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await api.endMatch(match._id);

      console.log('Match ended:', result.data);
      showNotification('Match completed successfully!', 'success');

      // The parent component should handle refreshing the match list
      onMatchUpdate();

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="match-card">
      <h4>Match with {match.itemSwiperDetails?.name || 'Unknown User'}</h4>
      <p><strong>Item:</strong> {match.itemDetails?.name}</p>
      <p><strong>Status:</strong> {match.status}</p>
      <p><strong>Your Role:</strong> {isOwner ? 'Item Owner' : 'Item Swiper'}</p>

      {error && <div className="error">{error}</div>}

      <div className="match-actions">
        {canEndMatch && (
          <button
            onClick={handleEndMatch}
            disabled={loading}
            className="btn btn-danger"
          >
            {loading ? 'Ending Match...' : 'Complete Match & Give Away Item'}
          </button>
        )}
      </div>
    </div>
  );
};

// Socket event handling
const socket = io('ws://localhost:3000');

socket.on('matchEnded', (data) => {
  console.log('Match ended:', data);
  // Update UI to reflect match completion
  updateMatchInUI(data.match);
  showNotification(data.message, 'info');
});

socket.on('matchCompleted', (data) => {
  console.log('Match completed by owner:', data);
  // Show notification to swiper that item was given away
  showNotification(`The item "${data.match.itemDetails?.name}" has been given away by the owner.`, 'info');
  // Remove match from active matches list
  removeMatchFromUI(data.match._id);
});

export { ThingsMatchAPI, MatchCard };
