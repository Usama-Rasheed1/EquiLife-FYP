import React, { useState, useEffect } from "react";
import axios from "axios";
import AppModal from "./AppModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SuggestionModal from "./suggestionModal";
import assessmentService from "../services/assessmentService";

const getSeverityInfo = (assessmentName, totalScore) => {
  let severity = "";
  let message = "";

  if (assessmentName === "GAD-7") {
    if (totalScore <= 4) {
      severity = "Minimal";
      message = "Your anxiety levels appear to be minimal.";
    } else if (totalScore <= 9) {
      severity = "Mild";
      message = "You may be experiencing mild anxiety. Consider self-care strategies.";
    } else if (totalScore <= 14) {
      severity = "Moderate";
      message = "You may be experiencing moderate anxiety. Consider speaking with a healthcare provider.";
    } else {
      severity = "Severe";
      message = "You may be experiencing severe anxiety. We recommend speaking with a mental health professional.";
    }
  } else if (assessmentName === "PHQ-9") {
    if (totalScore <= 4) {
      severity = "Minimal";
      message = "Your depression symptoms appear to be minimal.";
    } else if (totalScore <= 9) {
      severity = "Mild";
      message = "You may be experiencing mild depression. Consider self-care strategies.";
    } else if (totalScore <= 14) {
      severity = "Moderate";
      message = "You may be experiencing moderate depression. Consider speaking with a healthcare provider.";
    } else if (totalScore <= 19) {
      severity = "Moderately Severe";
      message = "You may be experiencing moderately severe depression. We recommend speaking with a mental health professional.";
    } else {
      severity = "Severe";
      message = "You may be experiencing severe depression. Please seek professional help as soon as possible.";
    }
  } else if (assessmentName === "GHQ-12") {
    if (totalScore <= 12) {
      severity = "Low";
      message = "Your psychological distress levels appear to be low.";
    } else if (totalScore <= 20) {
      severity = "Moderate";
      message = "You may be experiencing moderate psychological distress. Consider self-care strategies.";
    } else {
      severity = "High";
      message = "You may be experiencing high psychological distress. We recommend speaking with a mental health professional.";
    }
  }

  return { severity, message };
};

const AssessmentModal = ({ isOpen, onClose, testId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testData, setTestData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState(null);

  // Fetch assessment questions when modal opens with a testId
  useEffect(() => {
    if (isOpen && testId) {
      loadAssessment(testId);
    }
  }, [isOpen, testId]);



  const loadAssessment = async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      // Get assessment data from backend
      const response = await assessmentService.getAssessmentQuestions(assessmentId);
      if (response.ok) {
        setTestData(response.assessment);
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setResults(null);
      }
    } catch (err) {
      setError("Failed to load assessment. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleCalculateResults = async () => {
    // Check if all questions are answered
    const allAnswered = testData.questions.every(
      (_, index) => answers[index] !== undefined
    );

    if (!allAnswered) {
      alert("Please answer all questions before calculating results.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Submit assessment to backend
      const response = await assessmentService.submitAssessment(testData._id, answers);

      if (response.ok) {
        const { result } = response;
        setResults({
          score: result.totalScore,
          severity: result.severityLabel,
          message: getSeverityInfo(result.assessmentName, result.totalScore).message,
        });
        setShowResults(true);
      }
    } catch (err) {
      setError("Failed to calculate results. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndTest = () => {
    setShowResults(false);
    setResults(null);
    setCurrentQuestion(0);
    setAnswers({});
    setError(null);
    onClose();
  };

  const handleTestAgain = () => {
    setShowResults(false);
    setResults(null);
    setCurrentQuestion(0);
    setAnswers({});
    setError(null);
  };

  // Build a short suggestion paragraph based on the assessment and severity
  const generateSuggestionText = (res) => {
    if (!res) return "No suggestion available.";
    const sev = (res.severity || "").toLowerCase();
    const assessmentName = testData?.name || "";

    if (assessmentName === "GAD-7") {
      if (sev.includes("minimal")) return "Your anxiety appears minimal. Keep practicing self-care, maintain routines, and monitor symptoms.";
      if (sev.includes("mild")) return "Mild anxiety noted. Try relaxation techniques, regular exercise, and consider talking to a trusted person or a counselor.";
      if (sev.includes("moderate")) return "Moderate anxiety observed. Consider reaching out to a primary care provider or counselor for further guidance and coping strategies.";
      return "Severe anxiety detected. Please seek professional mental health support promptly, and contact emergency services if you feel unsafe.";
    }
    if (assessmentName === "PHQ-9") {
      if (sev.includes("minimal")) return "Symptoms appear minimal. Maintain social connections, sleep hygiene, and healthy habits.";
      if (sev.includes("mild")) return "Mild depressive symptoms. Consider self-help strategies, routine, and checking in with friends or family.";
      if (sev.includes("moderate")) return "Moderate depression indication. Consider consulting a healthcare professional for assessment and treatment options.";
      if (sev.includes("moderately severe")) return "Moderately severe depression. It's important to contact a mental health professional to discuss treatment and safety planning.";
      return "Severe depression detected. Please seek professional help urgently and contact emergency services if you are at risk.";
    }
    if (assessmentName === "GHQ-12") {
      if (sev.includes("low")) return "Low psychological distress. Keep using healthy coping strategies and monitor changes.";
      if (sev.includes("moderate")) return "Moderate distress. Consider stress management techniques and talking to a trusted person or counselor.";
      return "High psychological distress. We recommend reaching out to a mental health professional to discuss next steps and support options.";
    }
    return "General suggestion: consider reaching out to a healthcare professional if symptoms persist or worsen.";
  };

  /**
   * Generate AI-powered suggestion using OpenRouter
   * Called automatically when assessment results are ready
   */
  const generateAiSuggestion = async (res) => {
    if (!res || !testData) return;

    setAiSuggestionLoading(true);
    setAiSuggestionError(null);
    setAiSuggestion(null);

    try {
      // Try to include user's age if available (optional)
      let age = null;
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const profileRes = await axios.get(
            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const user = profileRes.data?.user;
          if (user) {
            if (user.age) age = user.age;
            else if (user.dob) {
              const dob = new Date(user.dob);
              age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            }
          }
        }
      } catch (e) {
        // If profile fetch fails, continue without age
        console.warn("Could not fetch profile for age; continuing without age.", e);
      }

      // Only send minimal context: the selected assessment and its score (and age if available)
      const context = {
        assessmentType: testData.name,
        score: res.score,
        severity: res.severity,
      };
      if (age) context.age = age;

      const response = await assessmentService.generateSuggestion(context);

      if (response.ok && response.suggestion) {
        setAiSuggestion(response.suggestion);
      } else {
        // Fallback to static suggestion on API error
        setAiSuggestion(generateSuggestionText(res));
      }
    } catch (err) {
      // Don't show error message, just use fallback
      // This prevents blocking the main flow
      setAiSuggestionError(
        "We couldn't generate a personalized suggestion right now, but here's general guidance:"
      );
      setAiSuggestion(generateSuggestionText(res));
    } finally {
      setAiSuggestionLoading(false);
    }
  };

  // Show loading state
  if (loading && !testData) {
    return (
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading Assessment"
        closeOnOutsideClick={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
            <p className="text-gray-600">Loading assessment...</p>
          </div>
        </div>
      </AppModal>
    );
  }

  if (!testData) return null;

  const totalQuestions = testData.questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const currentAnswer = answers[currentQuestion];
  const allQuestionsAnswered = testData.questions.every(
    (_, index) => answers[index] !== undefined
  );

  // Results View
  if (showResults && results) {
    return (
      <AppModal
        isOpen={isOpen}
        onClose={handleEndTest}
        title="Assessment Results"
        closeOnOutsideClick={false}
      >
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  {results.score}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Score: {results.score}
              </h3>
              <p className="text-lg font-medium text-blue-600 mb-4">
                Severity: {results.severity}
              </p>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6">
              {results.message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleEndTest}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              End Test
            </button>
            
            <button
              onClick={() => {
                setSuggestionsOpen(true);
                generateAiSuggestion(results);
              }}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              Suggestions
            </button>
          </div>

          <SuggestionModal
            isOpen={suggestionsOpen}
            onClose={() => setSuggestionsOpen(false)}
            onTestAgain={handleTestAgain}
            suggestion={aiSuggestion || generateSuggestionText(results)}
            isLoading={aiSuggestionLoading}
            error={aiSuggestionError}
          />
        </div>
      </AppModal>
    );
  }

  // Questions View
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={testData.name}
      closeOnOutsideClick={false}
    >
      <div className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {currentQuestion + 1}/{totalQuestions}
          </span>
        </div>

        {/* Question */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {testData.questions[currentQuestion].questionText}
          </h3>

          {/* Answer Options */}
          <div className="space-y-2">
            {testData.questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  currentAnswer === index
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                {option.optionText}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentQuestion === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleCalculateResults}
              disabled={!allQuestionsAnswered || loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium ${
                allQuestionsAnswered && !loading
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="text-sm">
                {loading ? "Calculating..." : "Calculate Results"}
              </span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentAnswer === undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentAnswer === undefined
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </AppModal>
  );
};

export default AssessmentModal;

