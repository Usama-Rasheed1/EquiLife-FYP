import React, { useState, useEffect } from "react";
import AppModal from "./AppModal";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Assessment question data
const assessmentData = {
  gad7: {
    name: "GAD-7 (Anxiety Assessment)",
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it is hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid, as if something awful might happen",
    ],
    options: [
      "Not at all",
      "Several days",
      "More than half the days",
      "Nearly every day",
    ],
  },
  phq9: {
    name: "PHQ-9 (Depression Assessment)",
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or speaking so slowly that other people could have noticed. Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead, or of hurting yourself",
    ],
    options: [
      "Not at all",
      "Several days",
      "More than half the days",
      "Nearly every day",
    ],
  },
  ghq12: {
    name: "GHQ-12 (General Health Questionnaire)",
    questions: [
      "Been able to concentrate on whatever you're doing",
      "Lost much sleep over worry",
      "Felt that you are playing a useful part in things",
      "Felt capable of making decisions about things",
      "Felt constantly under strain",
      "Felt you couldn't overcome your difficulties",
      "Been able to enjoy your normal day-to-day activities",
      "Been able to face up to your problems",
      "Been feeling unhappy or depressed",
      "Been losing confidence in yourself",
      "Been thinking of yourself as a worthless person",
      "Been feeling reasonably happy, all things considered",
    ],
    options: [
      "Better than usual",
      "Same as usual",
      "Less than usual",
      "Much less than usual",
    ],
  },
};

const AssessmentModal = ({ isOpen, onClose, testId }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testData, setTestData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (testId && assessmentData[testId]) {
      setTestData(assessmentData[testId]);
      setCurrentQuestion(0);
      setAnswers({});
      setShowResults(false);
      setResults(null);
    }
  }, [testId]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
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

  const handleCalculateResults = () => {
    // Check if all questions are answered
    const allAnswered = testData.questions.every(
      (_, index) => answers[index] !== undefined
    );

    if (!allAnswered) {
      alert("Please answer all questions before calculating results.");
      return;
    }

    // Calculate score
    const totalScore = Object.values(answers).reduce(
      (sum, answerIndex) => sum + answerIndex,
      0
    );

    // Determine severity (simplified scoring)
    let severity = "";
    let message = "";

    if (testId === "gad7") {
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
    } else if (testId === "phq9") {
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
    } else if (testId === "ghq12") {
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

    // Store results and show results view
    setResults({
      score: totalScore,
      severity,
      message,
    });
    setShowResults(true);
  };

  const handleEndTest = () => {
    setShowResults(false);
    setResults(null);
    setCurrentQuestion(0);
    setAnswers({});
    onClose();
  };

  const handleTestAgain = () => {
    setShowResults(false);
    setResults(null);
    setCurrentQuestion(0);
    setAnswers({});
  };

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
              onClick={handleTestAgain}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              Test Again
            </button>
          </div>
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
            {testData.questions[currentQuestion]}
          </h3>

          {/* Answer Options */}
          <div className="space-y-2">
            {testData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  currentAnswer === index
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                {option}
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
              disabled={!allQuestionsAnswered}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium ${
                allQuestionsAnswered
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="text-sm">Calculate Results</span>
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

