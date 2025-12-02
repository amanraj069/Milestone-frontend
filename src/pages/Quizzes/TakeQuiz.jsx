import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/DashboardLayout';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const subscription = useSelector((state) => state.subscription);
  
  // Calculate premium status (not in dependency array to avoid re-fetches)
  const isPremium = user?.subscription === 'Premium' || subscription?.plan === 'Premium';
  const maxAttempts = isPremium ? 3 : 2;
  const cooldownDays = isPremium ? 5 : 10;
  
  // Local state
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [shuffledQuiz, setShuffledQuiz] = useState(null);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState(null);

  // Load quiz and check eligibility on mount (only when id changes)
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Check eligibility first
        const eligibilityRes = await axios.get(`${API_BASE_URL}/api/quizzes/${id}/eligibility`, {
          withCredentials: true
        });
        
        if (eligibilityRes.data.success) {
          setEligibility(eligibilityRes.data);
          
          // If can't attempt, show cooldown modal
          if (!eligibilityRes.data.canAttempt) {
            // Use backend-provided values
            setCooldownInfo({
              maxAttempts: eligibilityRes.data.maxAttempts,
              cooldownDays: eligibilityRes.data.cooldownDays,
              daysRemaining: eligibilityRes.data.daysRemaining || 0,
              hoursRemaining: eligibilityRes.data.hoursRemaining || 0,
              isPremium: eligibilityRes.data.isPremium
            });
            setShowCooldownModal(true);
            setLoading(false);
            return;
          }
        }
        
        // Load quiz data
        const quizRes = await axios.get(`${API_BASE_URL}/api/quizzes/${id}`, {
          withCredentials: true
        });
        
        if (quizRes.data.success) {
          setQuiz(quizRes.data.data);
        } else {
          setError('Failed to load quiz');
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id]);

  // Shuffle quiz options when quiz loads
  useEffect(() => {
    if (quiz) {
      const shuffled = {
        ...quiz,
        questions: quiz.questions.map(q => {
          const shuffledOptions = shuffleArray(q.options.map((opt, idx) => ({ ...opt, originalIndex: idx })));
          return {
            ...q,
            options: shuffledOptions
          };
        })
      };
      setShuffledQuiz(shuffled);
    }
  }, [quiz]);

  function startQuiz() {
    setShowInstructions(false);
    setQuizStarted(true);
    if (shuffledQuiz?.timeLimitMinutes) {
      setTimeLeft(shuffledQuiz.timeLimitMinutes * 60);
    }
  }

  useEffect(()=>{
    if (!timeLeft || timeLeft <= 0) return;
    setQuizStarted(true);
    const t = setInterval(()=> setTimeLeft(s => { 
      if (s<=1){ 
        clearInterval(t); 
        onSubmit(); 
        return 0; 
      } 
      return s-1; 
    }), 1000);
    return ()=> clearInterval(t);
  }, [timeLeft]);

  // Prevent leaving page during quiz - block back button completely
  useEffect(() => {
    if (!quizStarted || showInstructions) return;
    
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Quiz in progress! Leaving will count as an attempt and you will lose your progress.';
      return e.returnValue;
    };

    // Completely block back button during quiz
    const blockBackButton = () => {
      window.history.pushState(null, '', window.location.href);
    };

    // Push initial state
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', blockBackButton);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', blockBackButton);
    };
  }, [quizStarted, showInstructions]);

  function select(qid, originalIndex){ 
    setAnswers(a=> ({...a, [qid]: originalIndex})); 
  }

  async function leaveQuiz() {
    setShowLeaveConfirm(false);
    // Submit current answers (even if incomplete) as the attempt
    const payload = shuffledQuiz.questions.map((q) => ({ 
      questionId: q._id, 
      selectedOptionIndex: answers[q._id] ?? null 
    }));
    
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/quizzes/${id}/attempt`,
        { answers: payload },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        navigate('/quizzes/' + id + '/result', { 
          state: { 
            attempt: response.data.data.attempt,
            awardedBadges: response.data.data.awardedBadges || [] 
          } 
        });
      } else {
        navigate('/freelancer/skills-badges');
      }
    } catch (err) {
      console.error('Submit failed:', err);
      navigate('/freelancer/skills-badges');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit() {
    setShowConfirm(false);
    const payload = shuffledQuiz.questions.map((q) => ({ 
      questionId: q._id, 
      selectedOptionIndex: answers[q._id] ?? null 
    }));
    
    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Submitting quiz attempt:', { quizId: id, payload });
    
    // Debug: Show what user selected vs what's being sent
    shuffledQuiz.questions.forEach((q, idx) => {
      const selectedOriginalIndex = answers[q._id];
      const selectedOption = q.options.find(opt => opt.originalIndex === selectedOriginalIndex);
      console.log(`Question ${idx + 1}:`, {
        questionId: q._id,
        userSelectedOriginalIndex: selectedOriginalIndex,
        selectedOptionText: selectedOption?.text?.substring(0, 50),
        allOptions: q.options.map((opt, i) => ({
          displayIndex: i,
          originalIndex: opt.originalIndex,
          text: opt.text.substring(0, 30)
        }))
      });
    });
    console.log('=== END DEBUG ===');
    
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/quizzes/${id}/attempt`,
        { answers: payload },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        console.log('Submission successful:', response.data);
        console.log('Navigating with result:', response.data.data);
        navigate('/quizzes/' + id + '/result', { 
          state: { 
            attempt: response.data.data.attempt,
            awardedBadges: response.data.data.awardedBadges || [] 
          } 
        });
      } else {
        alert('Submit failed: ' + (response.data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Submit failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !shuffledQuiz) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            Error loading quiz: {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Cooldown modal
  if (showCooldownModal && cooldownInfo) {
    return (
      <DashboardLayout>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[slideUp_0.3s_ease]">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Maximum Attempts Reached
            </h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-center text-red-800 font-semibold mb-3">
                You have used all {cooldownInfo.maxAttempts} attempts for this quiz.
              </p>
              <div className="text-center text-gray-700">
                <p className="mb-2">You can take your next attempt after <strong>{cooldownInfo.cooldownDays} days</strong>.</p>
                <p className="text-lg font-bold text-red-600">
                  Time remaining: {cooldownInfo.daysRemaining} day(s)
                </p>
                <p className="text-sm text-gray-600">
                  (approximately {cooldownInfo.hoursRemaining} hours)
                </p>
              </div>
            </div>

            {!cooldownInfo.isPremium && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">Upgrade to Premium to get:</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <strong>3 attempts</strong> instead of 2
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <strong>{cooldownInfo.cooldownDays === 10 ? '5-day' : '4-day'} cooldown</strong> instead of {cooldownInfo.cooldownDays} days
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Priority support and more!
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowCooldownModal(false);
                navigate('/freelancer/skills-badges');
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const answered = Object.keys(answers).length;
  const total = shuffledQuiz.questions.length;

  // Show instructions dialog before starting quiz
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Quiz Instructions</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">{shuffledQuiz.title}</h3>
                <p className="text-sm text-blue-800">Skill: {shuffledQuiz.skillName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Questions</div>
                  <div className="text-2xl font-bold text-gray-800">{shuffledQuiz.questions.length}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Time Limit</div>
                  <div className="text-2xl font-bold text-gray-800">{shuffledQuiz.timeLimitMinutes ? `${shuffledQuiz.timeLimitMinutes} min` : 'No limit'}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Passing Score</div>
                  <div className="text-2xl font-bold text-gray-800">{shuffledQuiz.passingScore}%</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Your Attempt</div>
                  <div className="text-2xl font-bold text-gray-800">{(eligibility?.attemptsUsed || 0) + 1} of {maxAttempts}</div>
                </div>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Important Rules
                </h4>
                <ul className="text-sm text-orange-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>Maximum {maxAttempts} attempts allowed</strong> - This is attempt {(eligibility?.attemptsUsed || 0) + 1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>Browser navigation blocked</strong> - Back button will not work during quiz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>Auto-submit on timeout</strong> - Quiz submits automatically when time runs out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>Randomized options</strong> - Answer choices are shuffled for each attempt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>Leave Quiz option</strong> - Use "Leave Quiz" button if you need to exit (counts as attempt)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>No pausing</strong> - Timer cannot be paused once started</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/freelancer/skills-badges')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={startQuiz}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz - full screen without sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header with Timer */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{shuffledQuiz.title}</h2>
              <div className="text-xs text-gray-600">{shuffledQuiz.skillName}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">
                Attempt {(eligibility?.attemptsUsed || 0) + 1}/{maxAttempts}
              </span>
              {(eligibility?.attemptsUsed || 0) >= maxAttempts - 1 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-semibold animate-pulse">
                  Final Attempt!
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-2xl font-bold ${
                timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 
                timeLeft < 300 ? 'bg-orange-100 text-orange-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {Math.floor(timeLeft/60)}:{('0'+(timeLeft%60)).slice(-2)}
              </div>
            )}
            
            {/* Progress */}
            <div className="text-center">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-lg font-bold text-gray-800">{answered}/{total}</div>
            </div>
            
            {/* Leave Quiz Button */}
            <button 
              onClick={() => setShowLeaveConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition text-sm"
              disabled={submitting}
            >
              Leave Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {shuffledQuiz.description && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-700">{shuffledQuiz.description}</p>
              <p className="text-xs text-gray-600 mt-2">Passing Score: {shuffledQuiz.passingScore}%</p>
            </div>
          )}

          <div className="space-y-6">{shuffledQuiz.questions.map((q, qi) => (
    <div key={q._id} className="border rounded-lg p-4">
      <div className="font-medium mb-3">
        Question {qi+1} <span className="text-gray-600 text-sm">({q.marks} marks)</span>
      </div>
      <div className="mb-4 whitespace-pre-wrap">{q.text}</div>
      
      {/* Code Snippet Display - Fixed condition */}
      {q.codeSnippet && q.codeSnippet.trim() !== '' && (
        <div className="mb-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono uppercase">{q.codeLanguage || 'code'}</span>
            
          </div>
          <pre className="text-green-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap break-words">
            <code>{q.codeSnippet}</code>
          </pre>
        </div>
      )}

      <div className="space-y-2">
        {q.options.map((opt, oi) => {
          const originalIdx = opt.originalIndex !== undefined ? opt.originalIndex : oi;
          const isSelected = answers[q._id] === originalIdx;
          return (
            <div 
              key={oi} 
              className={`flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50 border-blue-500' : 'border-gray-300'}`}
              onClick={()=>select(q._id, originalIdx)}
            >
              <input type="radio" name={q._id} checked={isSelected} onChange={()=>select(q._id, originalIdx)} className="w-4 h-4" />
              <div>{opt.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  ))}
</div>

          {/* Submit Button - Fixed at bottom */}
          <div className="mt-8 flex justify-center">
            <button 
              className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition shadow-xl text-lg" 
              onClick={()=>setShowConfirm(true)} 
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>

        {showLeaveConfirm && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-2 text-red-600">Leave Quiz?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Leaving the quiz will submit your current answers and <strong>count as one attempt</strong>. You cannot resume this quiz session.
              </p>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 border rounded hover:bg-gray-50" onClick={()=>setShowLeaveConfirm(false)}>
                  Stay
                </button>
                <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={leaveQuiz}>
                  Leave & Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-2">Confirm Submission</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have answered {answered} out of {total} questions. Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 border rounded hover:bg-gray-50" onClick={()=>setShowConfirm(false)}>
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={onSubmit}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
