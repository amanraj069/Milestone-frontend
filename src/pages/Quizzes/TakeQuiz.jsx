//take quiz
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';


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
  const [violations, setViolations] = useState([]);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState(null);

  // Load quiz and check eligibility on mount (only when id changes)
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Load both in parallel
        const [eligibilityRes, quizRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/quizzes/${id}/eligibility`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/quizzes/${id}`, { withCredentials: true })
        ]);
        
        console.log('Eligibility check:', eligibilityRes.data);
        
        if (eligibilityRes.data.success) {
          setEligibility(eligibilityRes.data);
          
          // If can't attempt, show cooldown modal and don't proceed
          if (eligibilityRes.data.canAttempt === false) {
            console.log('Cannot attempt - showing cooldown modal');
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
        
        console.log('Can attempt quiz - loading quiz data');
        
        if (quizRes.data.success && quizRes.data.data) {
          const quizData = quizRes.data.data;
          // Shuffle immediately
          const shuffled = {
            ...quizData,
            questions: quizData.questions.map(q => {
              const shuffledOptions = shuffleArray(q.options.map((opt, idx) => ({ ...opt, originalIndex: idx })));
              return {
                ...q,
                options: shuffledOptions
              };
            })
          };
          setQuiz(quizData);
          setShuffledQuiz(shuffled);
          console.log('Quiz loaded and shuffled successfully');
        } else {
          setError('Failed to load quiz');
        }
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(err.response?.data?.error?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id]);

  // Remove the separate shuffle effect - now done inline above

  function startQuiz() {
    setShowInstructions(false);
    setQuizStarted(true);
    if (shuffledQuiz?.timeLimitMinutes) {
      setTimeLeft(shuffledQuiz.timeLimitMinutes * 60);
    }
    
    // Request fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
  }

  // Fullscreen and violation detection
  useEffect(() => {
    if (!quizStarted || showInstructions) return;

    const addViolation = (type) => {
      setViolations(prev => [...prev, { type, timestamp: new Date() }]);
      setShowViolationWarning(true);
      setTimeout(() => setShowViolationWarning(false), 3000);
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && quizStarted && !showInstructions) {
        addViolation('fullscreen_exit');
      }
    };

    // Detect tab visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted && !showInstructions) {
        addViolation('tab_switch');
      }
    };

    // Detect blur (window/tab loses focus)
    const handleBlur = () => {
      if (quizStarted && !showInstructions) {
        addViolation('window_blur');
      }
    };

    // Handle ESC key - show leave confirmation
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && quizStarted && !showInstructions) {
        e.preventDefault();
        setShowLeaveConfirm(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizStarted, showInstructions]);

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
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error('Failed to exit fullscreen:', err));
    }
    
    // Submit current answers (even if incomplete) as the attempt
    const payload = shuffledQuiz.questions.map((q) => ({ 
      questionId: q._id, 
      selectedOptionIndex: answers[q._id] ?? null 
    }));
    
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/quizzes/${id}/attempt`,
        { 
          answers: payload,
          violationsCount: violations.length // Send violations count
        },
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
      navigate('/freelancer/skills-badges');
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit() {
    setShowConfirm(false);
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error('Failed to exit fullscreen:', err));
    }
    
    const payload = shuffledQuiz.questions.map((q) => ({ 
      questionId: q._id, 
      selectedOptionIndex: answers[q._id] ?? null 
    }));
    
    try {
      setSubmitting(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/quizzes/${id}/attempt`,
        { 
          answers: payload,
          violationsCount: violations.length // Send violations count
        },
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
        alert('Submit failed: ' + (response.data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Submit failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  // Show loading only if truly loading
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
            <p className="text-gray-500">Loading quiz...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-lg font-medium text-red-600 mb-2">Error loading quiz</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={() => navigate('/freelancer/skills-badges')} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Skills
            </button>
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

  // Must have shuffledQuiz to proceed
  if (!shuffledQuiz) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500">Preparing quiz...</p>
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Quiz Instructions</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Quiz Info Card */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{shuffledQuiz.title}</h3>
                <p className="text-sm text-gray-600">Skill: {shuffledQuiz.skillName}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{shuffledQuiz.questions.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Questions</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{shuffledQuiz.timeLimitMinutes ? `${shuffledQuiz.timeLimitMinutes} min` : 'No limit'}</p>
                  <p className="text-xs text-gray-500 mt-1">Time Limit</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{shuffledQuiz.passingScore}%</p>
                  <p className="text-xs text-gray-500 mt-1">Passing Score</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-2xl font-semibold text-gray-900">{(eligibility?.attemptsUsed || 0) + 1} of {eligibility?.maxAttempts || 2}</p>
                  <p className="text-xs text-gray-500 mt-1">Your Attempt</p>
                </div>
              </div>

              {/* Important Rules */}
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Important Rules</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>Maximum {eligibility?.maxAttempts || 2} attempts allowed</strong> — This is attempt {(eligibility?.attemptsUsed || 0) + 1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>Fullscreen mode required</strong> — Quiz will start in fullscreen; exiting triggers warnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>No tab switching</strong> — Switching tabs or windows will be detected and logged</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>Press ESC to leave</strong> — Pressing ESC will prompt you to leave the quiz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>Browser navigation blocked</strong> — Back button will not work during quiz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>Auto-submit on timeout</strong> — Quiz submits automatically when time runs out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>Randomized options</strong> — Answer choices are shuffled for each attempt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span><strong>No pausing</strong> — Timer cannot be paused once started</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => navigate('/freelancer/skills-badges')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={startQuiz}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz - full screen without sidebar
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Violation Warning Banner */}
      {showViolationWarning && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white px-4 py-3 text-center font-medium shadow-lg animate-pulse">
          Warning: Suspicious activity detected! Your actions are being monitored.
        </div>
      )}

      {/* Fixed Header with Timer */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">{shuffledQuiz.title}</h2>
              <div className="text-xs text-gray-500">{shuffledQuiz.skillName}</div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
              Attempt {(eligibility?.attemptsUsed || 0) + 1}/{eligibility?.maxAttempts || 2}
            </span>
            {violations.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                ⚠️ {violations.length} violation{violations.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-lg font-semibold ${
                timeLeft < 60 ? 'bg-red-100 text-red-700' : 
                timeLeft < 300 ? 'bg-amber-100 text-amber-700' : 
                'bg-gray-100 text-gray-700'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {Math.floor(timeLeft/60)}:{('0'+(timeLeft%60)).slice(-2)}
              </div>
            )}
            
            {/* Progress */}
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Progress</div>
              <div className="font-semibold text-gray-900">{answered}/{total}</div>
            </div>
            
            {/* Leave Quiz Button */}
            <button 
              onClick={() => setShowLeaveConfirm(true)}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
              disabled={submitting}
            >
              Leave Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-5xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Quiz Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">{shuffledQuiz.description || 'Answer all questions below'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Passing Score: {shuffledQuiz.passingScore}%</p>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="divide-y divide-gray-200">
            {shuffledQuiz.questions.map((q, qi) => (
              <div key={q._id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-medium text-gray-900">Question {qi+1}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{q.marks} marks</span>
                </div>
                <div className="mb-4 text-gray-700">{q.text}</div>
                
                {/* Code Snippet Display */}
                {q.codeSnippet && q.codeSnippet.trim() !== '' && (
                  <div className="mb-4 bg-gray-900 rounded-md p-4">
                    <div className="text-xs text-gray-400 font-mono uppercase mb-2">{q.codeLanguage || 'code'}</div>
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
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-500' 
                            : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                        }`}
                        onClick={()=>select(q._id, originalIdx)}
                      >
                        <input 
                          type="radio" 
                          name={q._id} 
                          checked={isSelected} 
                          onChange={()=>select(q._id, originalIdx)} 
                          className="w-4 h-4 text-blue-600" 
                        />
                        <span className="text-sm text-gray-700">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-center">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors" 
                onClick={()=>setShowConfirm(true)} 
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>

        {/* Leave Confirm Modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Leave Quiz?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Leaving the quiz will submit your current answers and <strong>count as one attempt</strong>. You cannot resume this quiz session.
              </p>
              <div className="flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300" 
                  onClick={()=>setShowLeaveConfirm(false)}
                >
                  Stay
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors" 
                  onClick={leaveQuiz}
                >
                  Leave & Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Submission</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have answered {answered} out of {total} questions. Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button 
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300" 
                  onClick={()=>setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" 
                  onClick={onSubmit}
                >
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
