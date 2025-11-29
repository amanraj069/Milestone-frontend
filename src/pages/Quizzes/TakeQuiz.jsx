import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { loadQuiz, selectCurrentQuiz, selectQuizzesLoading, selectQuizzesError } from '../../store/slices/quizzesSlice';
import { submitAttempt, countUserAttemptsForQuiz, selectAttemptCount, selectLastSubmission, selectAttemptsLoading } from '../../store/slices/attemptsSlice';
import { selectUserId } from '../../store/slices/authSlice';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redux selectors
  const quiz = useSelector(selectCurrentQuiz);
  const quizLoading = useSelector(selectQuizzesLoading);
  const quizError = useSelector(selectQuizzesError);
  const userId = useSelector(selectUserId) || user?.id;
  const attemptCount = useSelector((state) => selectAttemptCount(state, id, userId));
  const lastSubmission = useSelector(selectLastSubmission);
  const submitting = useSelector(selectAttemptsLoading);
  
  // Local state
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [shuffledQuiz, setShuffledQuiz] = useState(null);

  // Load quiz and attempt count on mount
  useEffect(() => {
    dispatch(loadQuiz(id));
    if (userId) {
      dispatch(countUserAttemptsForQuiz({ quizId: id, userId }));
    }
  }, [id, userId, dispatch]);

  // Shuffle quiz options when quiz loads
  useEffect(() => {
    if (quiz && !shuffledQuiz) {
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
  }, [quiz, shuffledQuiz]);

  // Check attempt limit
  useEffect(() => {
    if (attemptCount >= 3) {
      alert('You have already completed 3 attempts for this quiz. Maximum attempts reached.');
      navigate('/freelancer/skills-badges');
    }
  }, [attemptCount, navigate]);

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
    
    const resultAction = await dispatch(submitAttempt({ quizId: id, answers: payload }));
    
    if (submitAttempt.fulfilled.match(resultAction)) {
      navigate('/quizzes/' + id + '/result', { state: { result: resultAction.payload.attempt } });
    } else {
      // Even if submission fails, navigate away
      navigate('/freelancer/skills-badges');
    }
  }

  async function onSubmit() {
    setShowConfirm(false);
    const payload = shuffledQuiz.questions.map((q) => ({ 
      questionId: q._id, 
      selectedOptionIndex: answers[q._id] ?? null 
    }));
    
    console.log('Submitting quiz attempt:', { quizId: id, payload });
    
    const resultAction = await dispatch(submitAttempt({ quizId: id, answers: payload }));
    
    if (submitAttempt.fulfilled.match(resultAction)) {
      console.log('Submission successful:', resultAction.payload);
      navigate('/quizzes/' + id + '/result', { state: { result: resultAction.payload.attempt } });
    } else {
      console.error('Submission failed:', resultAction.error);
      alert('Submit failed: ' + (resultAction.error?.message || resultAction.payload));
    }
  }

  // Navigate to result when lastSubmission updates
  useEffect(() => {
    if (lastSubmission) {
      navigate('/quizzes/' + id + '/result', { state: { result: lastSubmission } });
    }
  }, [lastSubmission, id, navigate]);

  if (quizLoading || !shuffledQuiz) {
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

  if (quizError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            Error loading quiz: {quizError}
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
      <DashboardLayout>
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
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
                  <div className="text-2xl font-bold text-gray-800">{attemptCount + 1} of 3</div>
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
                    <span><strong>Maximum 3 attempts allowed</strong> - This is attempt {attemptCount + 1}</span>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">{shuffledQuiz.title}</h2>
              <div className="text-sm text-gray-600">{shuffledQuiz.skillName}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold">
                  Attempt {attemptCount + 1} of 3
                </span>
                {attemptCount >= 2 && (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-semibold">
                    Final Attempt!
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {timeLeft!==null && (
                <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                  {Math.floor(timeLeft/60)}:{('0'+(timeLeft%60)).slice(-2)}
                </div>
              )}
              <div className="text-sm text-gray-600">Progress: {answered}/{total}</div>
            </div>
          </div>

          {shuffledQuiz.description && (
            <div className="mb-6 p-4 bg-blue-50 rounded border-l-4 border-blue-500">
              <p className="text-sm">{shuffledQuiz.description}</p>
              <p className="text-xs text-gray-600 mt-2">Passing Score: {shuffledQuiz.passingScore}%</p>
            </div>
          )}

          <div className="space-y-6">
  {shuffledQuiz.questions.map((q, qi) => (
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

          <div className="mt-6 flex justify-between items-center gap-4">
            <button 
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition" 
              onClick={()=>setShowLeaveConfirm(true)} 
              disabled={submitting}
            >
              Leave Quiz
            </button>
            <button 
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-lg" 
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
    </DashboardLayout>
  );
}
