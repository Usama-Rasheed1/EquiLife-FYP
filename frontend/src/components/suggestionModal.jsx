import React from 'react';
import AppModal from './AppModal';

// lightweight suggestions modal used by assessment results
const SuggestionModal = ({ isOpen, onClose, onTestAgain, suggestion }) => {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Suggestions" closeOnOutsideClick={false}>
      <div className="space-y-4 sm:space-y-6">
        <p className="text-sm text-gray-700 leading-relaxed">{suggestion}</p>

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
