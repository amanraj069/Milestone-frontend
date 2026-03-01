//take quiz – NTA JEE-style question palette + strict anti-cheat
import React, { useEffect, useState, useRef, useCallback } from 'react';
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

  // Anti-cheat state
  const [attemptId, setAttemptId] = useState(null);
  const [violations, setViolations] = useState([]);
  const [maxViolations, setMaxViolations] = useState(5);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [terminated, setTerminated] = useState(false);
  const [fullscreenBlocked, setFullscreenBlocked] = useState(false);

  // NTA JEE-style navigation state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));

  // Refs for dedup / cleanup
  const violationDedup = useRef(0); // timestamp of last violation to debounce blur+visibility double-fire
  const submittingRef = useRef(false);
  const escapeRef = useRef(false);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        const [eligibilityRes, quizRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/quizzes/${id}/eligibility`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/quizzes/${id}`, { withCredentials: true }),
        ]);

        if (eligibilityRes.data.success) {
          setEligibility(eligibilityRes.data);
          if (eligibilityRes.data.canAttempt === false) {
            setCooldownInfo({
              maxAttempts: eligibilityRes.data.maxAttempts,
              cooldownDays: eligibilityRes.data.cooldownDays,
              daysRemaining: eligibilityRes.data.daysRemaining || 0,
              hoursRemaining: eligibilityRes.data.hoursRemaining || 0,
              isPremium: eligibilityRes.data.isPremium,
            });
            setShowCooldownModal(true);
            setLoading(false);
            return;
          }
        }

        if (quizRes.data.success && quizRes.data.data) {
          const quizData = quizRes.data.data;
          const shuffled = {
            ...quizData,
            questions: quizData.questions.map((q) => {
              const shuffledOptions = shuffleArray(q.options.map((opt, idx) => ({ ...opt, originalIndex: idx })));
              return { ...q, options: shuffledOptions };
            }),
          };
          setQuiz(quizData);
          setShuffledQuiz(shuffled);
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

  async function startQuiz() {
    // Request fullscreen first
    const elem = document.documentElement;
    try {
      await elem.requestFullscreen();
      if (navigator.keyboard && navigator.keyboard.lock) {
        await navigator.keyboard.lock(['Escape']).catch(() => {});
      }
    } catch (err) {
      // Fullscreen denied — block quiz start
      setFullscreenBlocked(true);
      return;
    }

    // Call server to create in_progress attempt
    try {
      const res = await axios.post(`${API_BASE_URL}/api/quizzes/${id}/start`, {}, { withCredentials: true });
      if (res.data.success) {
        setAttemptId(res.data.data.attemptId);
        setMaxViolations(res.data.data.maxViolations || 5);
        setShowInstructions(false);
        setQuizStarted(true);
        if (shuffledQuiz?.timeLimitMinutes) {
          setTimeLeft(shuffledQuiz.timeLimitMinutes * 60);
        }
      } else {
        setError(res.data.error?.message || 'Failed to start quiz');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to start quiz');
    }
  }
  const reportViolation = useCallback(async (type) => {
    // Dedup: ignore if another violation fired within 500ms (blur + visibilitychange double-fire)
    const now = Date.now();
    if (now - violationDedup.current < 500) return;
    violationDedup.current = now;

    if (!attemptId || submittingRef.current || terminated) return;

    const newViolation = { type, timestamp: new Date() };
    setViolations((prev) => [...prev, newViolation]);
    setShowViolationModal(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/quizzes/report-violation`,
        { attemptId, type },
        { withCredentials: true }
      );
      if (res.data.success) {
        setMaxViolations(res.data.data.maxViolations);
        if (res.data.data.terminated) {
          setTerminated(true);
          autoSubmit('auto_terminated');
        }
      }
    } catch (err) {
      console.error('Failed to report violation:', err);
    }
  }, [attemptId, terminated]);
  useEffect(() => {
    if (!quizStarted || showInstructions || terminated) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submittingRef.current) {
        if (escapeRef.current) {
          escapeRef.current = false;
          document.documentElement.requestFullscreen().then(() => {
            if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {});
          }).catch(() => {});
        } else {
          reportViolation('fullscreen_exit');
          document.documentElement.requestFullscreen().then(() => {
            if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {});
          }).catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !submittingRef.current) {
        reportViolation('tab_switch');
      } else if (!document.hidden && !document.fullscreenElement && !submittingRef.current) {
        document.documentElement.requestFullscreen().then(() => {
          if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {});
        }).catch(() => {});
      }
    };

    const handleBlur = () => {
      if (!submittingRef.current) {
        reportViolation('window_blur');
      }
    };

    const handleFocus = () => {
      if (!document.fullscreenElement && !submittingRef.current) {
        document.documentElement.requestFullscreen().then(() => {
          if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {});
        }).catch(() => {});
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        // Browser will still exit fullscreen, but we flag it so
        // fullscreenchange re-enters immediately without a violation
        escapeRef.current = true;
        setShowLeaveConfirm(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizStarted, showInstructions, terminated, reportViolation]);
  useEffect(() => {
    if (!quizStarted || showInstructions) return;

    const block = (e) => {
      e.preventDefault();
      reportViolation('copy_attempt');
    };
    const blockSilent = (e) => e.preventDefault();

    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('contextmenu', blockSilent);
    document.addEventListener('selectstart', blockSilent);

    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('contextmenu', blockSilent);
      document.removeEventListener('selectstart', blockSilent);
    };
  }, [quizStarted, showInstructions, reportViolation]);
  useEffect(() => {
    if (!quizStarted || showInstructions) return;
    const interval = setInterval(() => {
      const threshold = 200;
      if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
        reportViolation('devtools_open');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [quizStarted, showInstructions, reportViolation]);
  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          autoSubmit('timed_out');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);
  useEffect(() => {
    if (!quizStarted || showInstructions) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Quiz in progress! Leaving will count as an attempt.';
      return e.returnValue;
    };
    const blockBackButton = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', blockBackButton);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', blockBackButton);
    };
  }, [quizStarted, showInstructions]);
  function select(qid, originalIndex) {
    setAnswers((a) => ({ ...a, [qid]: originalIndex }));
  }
  const goToQuestion = useCallback((idx) => {
    setCurrentQuestion(idx);
    setVisitedQuestions((prev) => { const s = new Set(prev); s.add(idx); return s; });
  }, []);

  const toggleMarkForReview = useCallback(() => {
    setMarkedForReview((prev) => {
      const s = new Set(prev);
      if (s.has(currentQuestion)) s.delete(currentQuestion);
      else s.add(currentQuestion);
      return s;
    });
  }, [currentQuestion]);

  const clearResponse = useCallback(() => {
    if (!shuffledQuiz) return;
    const qid = shuffledQuiz.questions[currentQuestion]?._id;
    if (qid) setAnswers((a) => { const n = { ...a }; delete n[qid]; return n; });
  }, [currentQuestion, shuffledQuiz]);

  const saveAndNext = useCallback(() => {
    if (!shuffledQuiz) return;
    if (currentQuestion < shuffledQuiz.questions.length - 1) goToQuestion(currentQuestion + 1);
  }, [currentQuestion, shuffledQuiz, goToQuestion]);

  const saveAndPrev = useCallback(() => {
    if (currentQuestion > 0) goToQuestion(currentQuestion - 1);
  }, [currentQuestion, goToQuestion]);

  const getQuestionStatus = useCallback((idx) => {
    if (!shuffledQuiz) return 'not-visited';
    const qid = shuffledQuiz.questions[idx]?._id;
    const isAnswered = qid && answers[qid] !== undefined;
    const isMarked = markedForReview.has(idx);
    const isVisited = visitedQuestions.has(idx);
    const isCurrent = idx === currentQuestion;
    if (isCurrent) return 'current';
    if (isMarked && isAnswered) return 'marked-answered';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not-answered';
    return 'not-visited';
  }, [shuffledQuiz, answers, markedForReview, visitedQuestions, currentQuestion]);
  function continueQuiz() {
    setShowViolationModal(false);
    const elem = document.documentElement;
    if (!document.fullscreenElement && elem.requestFullscreen) {
      elem.requestFullscreen().then(() => {
        if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(() => {});
      }).catch(() => {});
    }
  }
  function buildPayload() {
    return shuffledQuiz.questions.map((q) => ({
      questionId: q._id,
      selectedOptionIndex: answers[q._id] ?? null,
    }));
  }
  async function autoSubmit(reason) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    if (document.fullscreenElement) {
      if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock();
      document.exitFullscreen().catch(() => {});
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/quizzes/${id}/attempt`,
        { answers: buildPayload(), attemptId },
        { withCredentials: true }
      );
      if (response.data.success) {
        navigate('/quizzes/' + id + '/result', {
          state: {
            attempt: response.data.data.attempt,
            awardedBadges: response.data.data.awardedBadges || [],
            questionDetails: response.data.data.questionDetails || [],
            quizTitle: response.data.data.quizTitle,
            skillName: response.data.data.skillName,
            autoSubmitReason: reason,
          },
        });
      } else {
        navigate('/freelancer/skills-badges');
      }
    } catch {
      navigate('/freelancer/skills-badges');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  async function leaveQuiz() {
    setShowLeaveConfirm(false);
    await autoSubmit('left');
  }
  async function onSubmit() {
    setShowConfirm(false);
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    if (document.fullscreenElement) {
      if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock();
      document.exitFullscreen().catch(() => {});
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/quizzes/${id}/attempt`,
        { answers: buildPayload(), attemptId },
        { withCredentials: true }
      );
      if (response.data.success) {
        navigate('/quizzes/' + id + '/result', {
          state: {
            attempt: response.data.data.attempt,
            awardedBadges: response.data.data.awardedBadges || [],
            questionDetails: response.data.data.questionDetails || [],
            quizTitle: response.data.data.quizTitle,
            skillName: response.data.data.skillName,
          },
        });
      } else {
        alert('Submit failed: ' + (response.data.error?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Submit failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  const violationSeverity = () => {
    const count = violations.length;
    if (count <= 2) return 'warning';    // yellow
    if (count <= Math.floor(maxViolations * 0.8)) return 'danger'; // orange
    return 'critical'; // red — about to terminate
  };
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
            <button onClick={() => navigate('/freelancer/skills-badges')} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
              Back to Skills
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  if (showCooldownModal && cooldownInfo) {
    return (
      <DashboardLayout>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Maximum Attempts Reached</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-center text-red-800 font-semibold mb-3">
                You have used all {cooldownInfo.maxAttempts} attempts for this quiz.
              </p>
              <div className="text-center text-gray-700">
                <p className="mb-2">You can take your next attempt after <strong>{cooldownInfo.cooldownDays} days</strong>.</p>
                <p className="text-lg font-bold text-red-600">Time remaining: {cooldownInfo.daysRemaining} day(s)</p>
                <p className="text-sm text-gray-600">(approximately {cooldownInfo.hoursRemaining} hours)</p>
              </div>
            </div>
            {!cooldownInfo.isPremium && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Upgrade to Premium to get:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <strong>3 attempts</strong> instead of 2
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <strong>5-day cooldown</strong> instead of 10 days
                  </li>
                </ul>
              </div>
            )}
            <button onClick={() => { setShowCooldownModal(false); navigate('/freelancer/skills-badges'); }} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
              OK
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!shuffledQuiz) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Preparing quiz...</p>
        </div>
      </DashboardLayout>
    );
  }

  const answered = Object.keys(answers).length;
  const total = shuffledQuiz.questions.length;
  if (fullscreenBlocked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-amber-400">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-3">Fullscreen Required</h2>
          <p className="text-center text-gray-600 mb-6 text-sm">
            This quiz requires fullscreen mode to maintain exam integrity. Please allow fullscreen access to continue.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setFullscreenBlocked(false); navigate('/freelancer/skills-badges'); }} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 border border-gray-300">
              Go Back
            </button>
            <button onClick={() => { setFullscreenBlocked(false); startQuiz(); }} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (terminated && !submitting) {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border-4 border-red-500">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-red-700 mb-3">Quiz Terminated</h2>
          <p className="text-center text-gray-600 mb-4 text-sm">
            Your quiz has been automatically terminated due to excessive violations ({violations.length}/{maxViolations}).
            Your answers have been submitted as-is and penalties have been applied.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Violations detected:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              {violations.map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {v.type.replace(/_/g, ' ')} — {new Date(v.timestamp).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => navigate('/freelancer/skills-badges')} className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
            Back to Skills
          </button>
        </div>
      </div>
    );
  }
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" style={{ userSelect: 'none' }}>
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900 text-center">Quiz Instructions</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{shuffledQuiz.title}</h3>
                <p className="text-sm text-gray-600">Skill: {shuffledQuiz.skillName}</p>
              </div>

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

              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Strict Anti-Cheating Rules
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 font-bold">1.</span>
                    <span><strong>Fullscreen mode required</strong> — the quiz will not start without fullscreen. Exiting fullscreen counts as a violation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 font-bold">2.</span>
                    <span><strong>No tab switching</strong> — switching tabs or windows during the quiz will be recorded as a violation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 font-bold">3.</span>
                    <span><strong>No copy/paste/right-click</strong> — copying questions or pasting content is not allowed.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 font-bold">4.</span>
                    <span><strong>Max {maxViolations} violations</strong> — exceeding this limit will <strong>auto-terminate</strong> your quiz immediately.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 font-bold">5.</span>
                    <span><strong>Penalty per violation</strong> — each violation deducts marks from your final score.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 font-bold">6.</span>
                    <span><strong>Auto-submit on timeout</strong> — the quiz submits automatically when time runs out.</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => navigate('/freelancer/skills-badges')} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300">
                  Cancel
                </button>
                <button onClick={startQuiz} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ══  ACTIVE QUIZ – NTA JEE-style layout  ═════════════════════
  // ══════════════════════════════════════════════════════════════
  const q = shuffledQuiz.questions[currentQuestion];
  const currentQid = q?._id;
  const isCurrentMarked = markedForReview.has(currentQuestion);

  const paletteColor = (status) => {
    switch (status) {
      case 'current': return 'ring-2 ring-blue-500 bg-blue-600 text-white';
      case 'answered': return 'bg-green-500 text-white';
      case 'marked': return 'bg-purple-500 text-white';
      case 'marked-answered': return 'bg-purple-500 text-white ring-2 ring-green-400';
      case 'not-answered': return 'bg-red-500 text-white';
      case 'not-visited': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  // Progressive violation warning color
  const severity = violationSeverity();
  const severityConfig = {
    warning: { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', icon: 'text-yellow-600', iconBg: 'bg-yellow-100' },
    danger: { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-800', icon: 'text-orange-600', iconBg: 'bg-orange-100' },
    critical: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-800', icon: 'text-red-600', iconBg: 'bg-red-100' },
  };
  const sev = severityConfig[severity];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" style={{ userSelect: 'none' }}>
      {/*   Fixed Header with Timer     */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900 text-sm md:text-base">{shuffledQuiz.title}</h2>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium hidden sm:inline">
              Attempt {(eligibility?.attemptsUsed || 0) + 1}/{eligibility?.maxAttempts || 2}
            </span>
            {violations.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                violations.length >= maxViolations - 1 ? 'bg-red-100 text-red-700 animate-pulse' :
                violations.length >= Math.floor(maxViolations * 0.6) ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {violations.length}/{maxViolations} violations
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-base font-bold ${
                timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' :
                timeLeft < 300 ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
              </div>
            )}
            <button onClick={() => setShowLeaveConfirm(true)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors" disabled={submitting}>
              Leave Quiz
            </button>
          </div>
        </div>
      </div>

      {/*   Main Content: Question + Palette      */}
      <div className="flex-1 flex">
        {/* Left: Single question view */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Question {currentQuestion + 1} of {total}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-blue-100 text-xs">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  {isCurrentMarked && (
                    <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">Marked for Review</span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-900 text-base leading-relaxed mb-5">{q.text}</p>

                {q.codeSnippet && q.codeSnippet.trim() !== '' && (
                  <div className="mb-5 bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-400 font-mono uppercase mb-2">{q.codeLanguage || 'PYTHON'}</div>
                    <pre className="text-green-400 font-mono text-sm overflow-x-auto"><code>{q.codeSnippet}</code></pre>
                  </div>
                )}

                <div className="space-y-3">
                  {q.options.map((opt, oi) => {
                    const originalIdx = opt.originalIndex !== undefined ? opt.originalIndex : oi;
                    const isSelected = answers[currentQid] === originalIdx;
                    const optionLetter = String.fromCharCode(65 + oi);
                    return (
                      <label key={oi} className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>{optionLetter}</div>
                        <input type="radio" name={currentQid} checked={isSelected} onChange={() => select(currentQid, originalIdx)} className="hidden" />
                        <span className="text-sm text-gray-800 flex-1">{opt.text}</span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={toggleMarkForReview} className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isCurrentMarked ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    {isCurrentMarked ? 'Unmark' : 'Mark for Review'}
                  </button>
                  <button onClick={clearResponse} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" disabled={!answers[currentQid] && answers[currentQid] !== 0}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Clear Response
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={saveAndPrev} disabled={currentQuestion === 0} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Previous
                  </button>
                  {currentQuestion < total - 1 ? (
                    <button onClick={saveAndNext} className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                      Save & Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ) : (
                    <button onClick={() => setShowConfirm(true)} disabled={submitting} className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">
                      Submit Quiz
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/*   Right sidebar: Question Palette     */}
        <div className="hidden md:flex md:w-72 lg:w-80 bg-white border-l border-gray-200 flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900">Question Palette</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {shuffledQuiz.questions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                return (
                  <button key={idx} onClick={() => goToQuestion(idx)} className={`w-10 h-10 rounded-lg text-xs font-bold transition-all hover:scale-105 ${paletteColor(status)}`} title={`Question ${idx + 1}`}>
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500 flex-shrink-0"></span><span className="text-xs text-gray-600">Answered</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500 flex-shrink-0"></span><span className="text-xs text-gray-600">Not Answered</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-200 flex-shrink-0"></span><span className="text-xs text-gray-600">Not Visited</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-purple-500 flex-shrink-0"></span><span className="text-xs text-gray-600">Marked</span></div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-600 flex-shrink-0"></span><span className="text-xs text-gray-600">Current</span></div>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-900 to-gray-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300"><span className="text-green-400 font-bold">{answered}</span>/{total} answered</span>
              {markedForReview.size > 0 && <span className="text-purple-300">{markedForReview.size} marked</span>}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <button onClick={() => setShowConfirm(true)} disabled={submitting} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>

      {/*   Mobile bottom bar     */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="px-3 py-2 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {shuffledQuiz.questions.map((_, idx) => {
              const status = getQuestionStatus(idx);
              return (
                <button key={idx} onClick={() => goToQuestion(idx)} className={`w-8 h-8 rounded-md text-xs font-bold flex-shrink-0 ${paletteColor(status)}`}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500"><span className="text-green-600 font-bold">{answered}</span>/{total} answered</span>
          <button onClick={() => setShowConfirm(true)} disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/*   Progressive Violation Modal      */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className={`bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 ${sev.border}`}>
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${sev.iconBg} rounded-full flex items-center justify-center`}>
                <svg className={`w-8 h-8 ${sev.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-900 mb-3">
              {severity === 'warning' && 'Warning: Activity Detected'}
              {severity === 'danger' && 'Multiple Violations Detected!'}
              {severity === 'critical' && 'FINAL WARNING!'}
            </h3>

            <div className={`${sev.bg} border ${sev.border} rounded-lg p-4 mb-4`}>
              <p className={`text-center ${sev.text} text-sm mb-2`}>
                {severity === 'warning' && 'We detected that you left the quiz screen or switched tabs.'}
                {severity === 'danger' && 'You have committed multiple violations. Your quiz may be terminated.'}
                {severity === 'critical' && 'This is your FINAL WARNING. The next violation will terminate your quiz immediately!'}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex gap-1">
                  {Array.from({ length: maxViolations }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < violations.length ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                  ))}
                </div>
                <span className={`font-bold text-lg ${sev.text}`}>{violations.length}/{maxViolations}</span>
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs mb-1">
              Each violation deducts 5% of total marks from your score.
            </p>
            <p className="text-center text-gray-500 text-xs mb-5">
              Current penalty: <strong className="text-red-600">{violations.length * 5}%</strong> of total marks
            </p>

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 border border-gray-300" onClick={leaveQuiz}>
                Leave Quiz
              </button>
              <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700" onClick={continueQuiz}>
                Continue Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/*   Leave Confirm Modal    */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Leave Quiz?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Leaving the quiz will submit your current answers and <strong>count as one attempt</strong>. You cannot resume this quiz session.
            </p>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 border border-gray-300" onClick={() => setShowLeaveConfirm(false)}>Stay</button>
              <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700" onClick={leaveQuiz}>Leave & Submit</button>
            </div>
          </div>
        </div>
      )}

      {/*   Submit Confirm Modal     */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Submission</h3>
            <p className="text-sm text-gray-600 mb-2">
              You have answered <strong>{answered}</strong> out of <strong>{total}</strong> questions.
            </p>
            {violations.length > 0 && (
              <p className="text-sm text-red-600 mb-2">
                You have <strong>{violations.length}</strong> violation{violations.length !== 1 ? 's' : ''} — a <strong>{violations.length * 5}%</strong> penalty will be applied.
              </p>
            )}
            <p className="text-sm text-gray-500 mb-4">Are you sure you want to submit?</p>
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 border border-gray-300" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700" onClick={onSubmit}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
