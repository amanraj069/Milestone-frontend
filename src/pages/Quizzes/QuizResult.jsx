import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';

export default function QuizResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const result = state?.attempt;
  const awarded = state?.awardedBadges || [];
  const questionDetails = state?.questionDetails || [];
  const quizTitle = state?.quizTitle || 'Quiz';
  const skillName = state?.skillName || '';
  const attemptsExhausted = state?.attemptsExhausted || false;

  const [activeQuestion, setActiveQuestion] = useState(null); // index for expanded question

  if (!result) {
    return (
      <DashboardPage title="Quiz Result">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No Result Data Available</p>
          <p className="text-gray-500 mb-4">Unable to load quiz results. Please try taking the quiz again.</p>
          <button 
            onClick={() => navigate('/freelancer/skills-badges')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Skills & Badges
          </button>
        </div>
      </DashboardPage>
    );
  }

  const headerAction = (
    <button
      onClick={() => navigate('/freelancer/skills-badges')}
      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      View All Badges
    </button>
  );

  // Calculate stats
  const correctAnswers = result.answers.filter(a => a.awardedMarks > 0).length;
  const wrongAnswers = result.answers.filter(a => a.selectedOptionIndex !== null && a.awardedMarks === 0).length;
  const unattempted = result.answers.filter(a => a.selectedOptionIndex === null || a.selectedOptionIndex === undefined).length;
  const totalQuestions = result.answers.length;

  // Question palette status
  const getQStatus = (idx) => {
    if (questionDetails.length > idx) {
      const q = questionDetails[idx];
      if (q.selectedOptionIndex === null || q.selectedOptionIndex === undefined) return 'unattempted';
      return q.isCorrect ? 'correct' : 'wrong';
    }
    // Fallback to result.answers
    const a = result.answers[idx];
    if (!a || a.selectedOptionIndex === null || a.selectedOptionIndex === undefined) return 'unattempted';
    return a.awardedMarks > 0 ? 'correct' : 'wrong';
  };

  const paletteColor = (status) => {
    switch (status) {
      case 'correct': return 'bg-green-500 text-white';
      case 'wrong': return 'bg-red-500 text-white';
      case 'unattempted': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  return (
    <DashboardPage title="Quiz Result" headerAction={headerAction}>
      <p className="text-gray-500 -mt-6 mb-6">Your quiz attempt results</p>

      {/*   Result Banner      */}
      <div className={`rounded-2xl p-6 mb-6 ${result.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white shadow-lg`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              {result.passed ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{result.passed ? 'Congratulations!' : 'Better Luck Next Time'}</h2>
              <p className="text-white/80 text-sm">{quizTitle} — {skillName}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{result.percentage.toFixed(1)}%</p>
              <p className="text-white/70 text-xs">Score</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{result.userMarks}/{result.totalMarks}</p>
              <p className="text-white/70 text-xs">Marks</p>
            </div>
          </div>
        </div>
      </div>

      {/*   Stats Cards       */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
            {result.passed ? 'Passed' : 'Failed'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Status</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
          <p className="text-xs text-gray-500 mt-1">Correct</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
          <p className="text-xs text-gray-500 mt-1">Wrong</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-500">{unattempted}</p>
          <p className="text-xs text-gray-500 mt-1">Unattempted</p>
        </div>
      </div>

      {/*   Badges Earned      */}
      {awarded.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Badges Earned!
            </h2>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            {awarded.map((b, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.skillName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*   Question Review (only after all attempts exhausted)  */}
      {questionDetails.length > 0 ? (
        <>
          {/*   Question Palette      */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Question Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">Click a question number to see details</p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {result.answers.map((_, idx) => {
                  const status = getQStatus(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveQuestion(activeQuestion === idx ? null : idx)}
                      className={`w-10 h-10 rounded-lg text-xs font-bold transition-all hover:scale-105 ${
                        activeQuestion === idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      } ${paletteColor(status)}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500"></span><span className="text-xs text-gray-600">Correct</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500"></span><span className="text-xs text-gray-600">Wrong</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200"></span><span className="text-xs text-gray-600">Unattempted</span></div>
              </div>
            </div>
          </div>

          {/*   Question Details      */}
          <div className="space-y-4 mb-6">
            {questionDetails.map((q, idx) => {
              const isExpanded = activeQuestion === idx;
              if (activeQuestion !== null && !isExpanded) return null;
              const isSkipped = q.selectedOptionIndex === null || q.selectedOptionIndex === undefined;
              const hasContent = !!q.text; // backend strips text for wrong/skipped
              
              return (
                <div key={idx} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  q.isCorrect ? 'border-green-200' : isSkipped ? 'border-gray-200' : 'border-red-200'
                }`}>
                  <button 
                    onClick={() => setActiveQuestion(isExpanded ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        q.isCorrect ? 'bg-green-500' : isSkipped ? 'bg-gray-400' : 'bg-red-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 text-left line-clamp-1">
                        {hasContent ? q.text : `Question ${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        q.isCorrect ? 'bg-green-100 text-green-700' : isSkipped ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                      }`}>
                        {q.isCorrect ? `+${q.awardedMarks}` : isSkipped ? 'Skipped' : '0'} / {q.marks}
                      </span>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && hasContent && (
                    <div className="px-6 pb-5 border-t border-gray-100">
                      <p className="text-gray-800 text-sm leading-relaxed mt-4 mb-4">{q.text}</p>
                      
                      {q.codeSnippet && (
                        <div className="mb-4 bg-gray-900 rounded-lg p-4">
                          <div className="text-xs text-gray-400 font-mono uppercase mb-2">{q.codeLanguage || 'CODE'}</div>
                          <pre className="text-green-400 font-mono text-sm overflow-x-auto"><code>{q.codeSnippet}</code></pre>
                        </div>
                      )}

                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const isSelected = q.selectedOptionIndex === opt.index;
                          const optLetter = String.fromCharCode(65 + oi);
                          
                          let borderColor = 'border-gray-200 bg-white';
                          let indicator = null;
                          
                          if (isSelected) {
                            borderColor = 'border-green-400 bg-green-50';
                            indicator = (
                              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                Your Answer
                              </span>
                            );
                          }

                          return (
                            <div key={oi} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${borderColor}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {optLetter}
                              </div>
                              <span className="text-sm text-gray-800 flex-1">{opt.text}</span>
                              {indicator}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                        {`You answered correctly and earned ${q.awardedMarks} mark${q.awardedMarks !== 1 ? 's' : ''}.`}
                      </div>
                    </div>
                  )}

                  {/* Locked state for wrong/skipped — no question content from server */}
                  {isExpanded && !hasContent && (
                    <div className="px-6 pb-5 border-t border-gray-100">
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                          isSkipped ? 'bg-gray-100' : 'bg-red-50'
                        }`}>
                          <svg className={`w-6 h-6 ${isSkipped ? 'text-gray-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className={`text-sm font-medium mb-1 ${
                          isSkipped ? 'text-gray-700' : 'text-red-700'
                        }`}>
                          {isSkipped ? 'Question Skipped' : 'Incorrect Answer'}
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs">
                          Question content is hidden to maintain quiz integrity. Only correctly answered questions are shown in detail.
                        </p>
                        <div className={`mt-3 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          isSkipped ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                        }`}>
                          {isSkipped ? 'Not attempted' : '0'} / {q.marks} marks
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {activeQuestion !== null && (
              <button 
                onClick={() => setActiveQuestion(null)} 
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                Show All Questions
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Detailed Review Not Available Yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              To maintain quiz integrity, the question-by-question breakdown is only shown after all your attempts have been used. 
              This prevents gaining an unfair advantage on retakes.
            </p>
          </div>
        </div>
      )}

      {/*   Action Buttons     */}
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => navigate('/freelancer/skills-badges')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
        >
          View All Badges
        </button>
        <button 
          onClick={() => navigate('/freelancer/home')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </DashboardPage>
  );
}
