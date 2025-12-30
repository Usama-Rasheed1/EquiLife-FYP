import React from 'react';
import AppModal from './AppModal';

// lightweight suggestions modal used by assessment results
const SuggestionModal = ({ isOpen, onClose, onTestAgain, suggestion, isLoading, error }) => {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Suggestions" closeOnOutsideClick={false}>
      <div className="space-y-4 sm:space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin mb-4">
                <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600">Generating personalized suggestion...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">{error}</p>
            <p className="text-xs text-amber-700 mt-2">
              {suggestion || 'Please try again or consult a healthcare provider for personalized guidance.'}
            </p>
          </div>
        )}

        {/* Success State */}
        {!isLoading && !error && suggestion && (
          <p className="text-sm text-gray-700 leading-relaxed">{suggestion}</p>
        )}

        {/* Empty State */}
        {!isLoading && !error && !suggestion && (
          <p className="text-sm text-gray-700 leading-relaxed">No suggestion available.</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
          >
            Back
          </button>
          <button
            onClick={() => { onTestAgain(); }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            Test Again
          </button>
        </div>
      </div>
    </AppModal>
  );
};

export default SuggestionModal;
