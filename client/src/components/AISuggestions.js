import React, { useState, useEffect } from 'react';
import './AISuggestions.css';
import { getAISuggestions } from '../services/api';

const AISuggestions = ({ currentItems, onAddSuggestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSuggestions();
  }, [currentItems]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAISuggestions(currentItems);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Nie udało się załadować sugestii');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion) => {
    const itemData = {
      name: suggestion.name,
      category: suggestion.category || 'Inne',
      quantity: 1,
      price: null
    };
    
    if (onAddSuggestion) {
      onAddSuggestion(itemData);
    }
  };

  const getReasonIcon = (type) => {
    switch (type) {
      case 'regular':
        return '🔄';
      case 'overdue':
        return '⏰';
      case 'category':
        return '📦';
      case 'complementary':
        return '🔗';
      default:
        return '💡';
    }
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="ai-suggestions">
        <div className="suggestions-header" onClick={() => setExpanded(!expanded)}>
          <h3>💡 Sugestie AI</h3>
          <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
        </div>
        {expanded && (
          <div className="suggestions-loading">
            <div className="loading-spinner"></div>
            <span>Analizowanie historii zakupów...</span>
          </div>
        )}
      </div>
    );
  }

  if (!expanded && !loading) {
    return (
      <div className="ai-suggestions">
        <div className="suggestions-header" onClick={() => setExpanded(!expanded)}>
          <h3>💡 Sugestie AI</h3>
          <span className="toggle-icon">▶</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-suggestions">
      <div className="suggestions-header" onClick={() => setExpanded(!expanded)}>
        <h3>💡 Sugestie AI</h3>
        <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="suggestions-content">
          {error && (
            <div className="suggestions-error">
              {error}
              <button onClick={loadSuggestions} className="retry-button">
                Spróbuj ponownie
              </button>
            </div>
          )}
          
          {loading && (
            <div className="suggestions-loading">
              <div className="loading-spinner"></div>
              <span>Aktualizowanie sugestii...</span>
            </div>
          )}
          
          {!loading && suggestions.length === 0 && (
            <div className="suggestions-empty">
              <p>Brak sugestii. Dodaj produkty i oznacz je jako kupione, aby AI mogło się uczyć z Twoich zakupów!</p>
            </div>
          )}
          
          {!loading && suggestions.length > 0 && (
            <>
              <div className="suggestions-list">
                {suggestions.slice(0, 5).map((suggestion, idx) => (
                  <div key={idx} className="suggestion-item">
                    <div className="suggestion-info">
                      <span className="suggestion-icon">
                        {getReasonIcon(suggestion.type)}
                      </span>
                      <div className="suggestion-details">
                        <span className="suggestion-name">{suggestion.name}</span>
                        {suggestion.reason && (
                          <span className="suggestion-reason">{suggestion.reason}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="add-suggestion-btn"
                      onClick={() => handleAddSuggestion(suggestion)}
                      title="Dodaj do listy"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
              
              {suggestions.length > 5 && (
                <div className="suggestions-footer">
                  <button 
                    className="show-more-btn"
                    onClick={() => {
                      // Można rozwinąć do pokazania wszystkich sugestii
                      alert(`Dostępnych jest ${suggestions.length} sugestii. Pokazujemy top 5.`);
                    }}
                  >
                    Pokaż więcej ({suggestions.length - 5} więcej)
                  </button>
                </div>
              )}
              
              <div className="suggestions-refresh">
                <button onClick={loadSuggestions} className="refresh-btn">
                  🔄 Odśwież sugestie
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AISuggestions;

