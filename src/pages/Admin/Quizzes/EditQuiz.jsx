import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';

const emptyOption = () => ({ text: '', isCorrect: false });
const emptyQuestion = () => ({ text: '', marks: 1, options: [emptyOption(), emptyOption()], correctOptionIndex: 0, hasCode: false, codeSnippet: '', codeLanguage: 'javascript' });

export default function EditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const quiz = data.data;
        setTitle(quiz.title || '');
        setSkillName(quiz.skillName || '');
        setDescription(quiz.description || '');
        setTimeLimit(quiz.timeLimitMinutes || '');
        setPassingScore(quiz.passingScore || 70);
        setQuestions(quiz.questions.map(q => ({
          ...q,
          correctOptionIndex: q.options.findIndex(opt => opt.isCorrect),
          hasCode: q.hasCode || false,
          codeSnippet: q.codeSnippet || '',
          codeLanguage: q.codeLanguage || 'javascript'
        })) || [emptyQuestion()]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateTitle = (value) => {
    if (!value.trim()) return 'Title is required';
    if (value.trim().length < 3) return 'Title must be at least 3 characters';
    return '';
  };

  const validateSkillName = (value) => {
    if (!value.trim()) return 'Skill name is required';
    if (value.trim().length < 2) return 'Skill name must be at least 2 characters';
    return '';
  };

  const validateTimeLimit = (value) => {
    if (value && (Number(value) < 1 || Number(value) > 180)) {
      return 'Time limit must be between 1 and 180 minutes';
    }
    return '';
  };

  const validatePassingScore = (value) => {
    if (Number(value) < 0 || Number(value) > 100) {
      return 'Passing score must be between 0 and 100';
    }
    return '';
  };

  const validateQuestionText = (value) => {
    if (!value.trim()) return 'Question text is required';
    if (value.trim().length < 10) return 'Question must be at least 10 characters';
    return '';
  };

  const validateOptionText = (value) => {
    if (!value.trim()) return 'Option text is required';
    if (value.trim().length < 1) return 'Option must be at least 1 character';
    return '';
  };

  const validateMarks = (value) => {
    if (!value || Number(value) < 1) return 'Marks must be at least 1';
    return '';
  };

  const addQuestion = () => setQuestions(qs => [...qs, emptyQuestion()]);
  const removeQuestion = idx => setQuestions(qs => qs.filter((_, i) => i !== idx));

  const updateQuestion = (idx, data) => setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...data } : q));

  const addOption = qidx => setQuestions(qs => qs.map((q, i) => i === qidx ? { ...q, options: [...q.options, emptyOption()] } : q));
  const removeOption = (qidx, optidx) => setQuestions(qs => qs.map((q, i) => i === qidx ? { ...q, options: q.options.filter((_, oi) => oi !== optidx) } : q));

  function stats() {
    const totalQ = questions.length;
    const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
    return { totalQ, totalMarks };
  }

  const submit = async () => {
    // Validate all fields
    const newErrors = {};
    
    const titleError = validateTitle(title);
    const skillError = validateSkillName(skillName);
    const timeLimitError = validateTimeLimit(timeLimit);
    const passingScoreError = validatePassingScore(passingScore);
    
    if (titleError) newErrors.title = titleError;
    if (skillError) newErrors.skillName = skillError;
    if (timeLimitError) newErrors.timeLimit = timeLimitError;
    if (passingScoreError) newErrors.passingScore = passingScoreError;

    questions.forEach((q, qi) => {
      const qTextError = validateQuestionText(q.text);
      const marksError = validateMarks(q.marks);
      
      if (qTextError) newErrors[`question_${qi}_text`] = qTextError;
      if (marksError) newErrors[`question_${qi}_marks`] = marksError;
      
      q.options.forEach((opt, oi) => {
        const optError = validateOptionText(opt.text);
        if (optError) newErrors[`question_${qi}_option_${oi}`] = optError;
      });
    });

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      alert('Please fix all validation errors before submitting');
      return;
    }

    setSaving(true);
    const payload = { title, skillName, description, timeLimitMinutes: timeLimit ? Number(timeLimit) : undefined, passingScore, questions };
    const res = await fetch(`/api/admin/quizzes/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include', 
      body: JSON.stringify(payload) 
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      alert('Quiz updated successfully!');
      navigate('/admin/quizzes/list');
    } else {
      alert('Failed: ' + JSON.stringify(data.error));
    }
  };

  if (loading) {
    return (
      <DashboardPage title="Edit Skill Quiz">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
          <span className="ml-3 text-gray-500">Loading quiz...</span>
        </div>
      </DashboardPage>
    );
  }

  const headerAction = (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Quiz Statistics</p>
      <div className="flex gap-6">
        <div>
          <p className="text-xs text-gray-500">Total Questions</p>
          <p className="text-xl font-semibold text-gray-900">{stats().totalQ}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Marks</p>
          <p className="text-xl font-semibold text-gray-900">{stats().totalMarks}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardPage title="Edit Skill Quiz" headerAction={headerAction}>
      <p className="text-gray-500 -mt-6 mb-6">Update quiz details and questions</p>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quiz Title *</label>
            <input 
              className={`w-full border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter quiz title" 
              value={title} 
              onChange={e=>{
                setTitle(e.target.value);
                const error = validateTitle(e.target.value);
                setErrors(prev => ({...prev, title: error}));
              }}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skill Name *</label>
            <input 
              className={`w-full border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.skillName ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter skill name" 
              value={skillName} 
              onChange={e=>{
                setSkillName(e.target.value);
                const error = validateSkillName(e.target.value);
                setErrors(prev => ({...prev, skillName: error}));
              }}
            />
            {errors.skillName && <p className="text-red-500 text-xs mt-1">{errors.skillName}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea 
              className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              rows="3"
              placeholder="Brief description of the quiz" 
              value={description} 
              onChange={e=>setDescription(e.target.value)} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Limit (minutes)</label>
              <input 
                className={`w-full border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.timeLimit ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                type="number" 
                min="1"
                max="180"
                placeholder="e.g., 20" 
                value={timeLimit} 
                onChange={e=>{
                  setTimeLimit(e.target.value);
                  const error = validateTimeLimit(e.target.value);
                  setErrors(prev => ({...prev, timeLimit: error}));
                }}
              />
              {errors.timeLimit && <p className="text-red-500 text-xs mt-1">{errors.timeLimit}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Score (%)</label>
              <input 
                className={`w-full border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.passingScore ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                type="number" 
                min="0"
                max="100"
                placeholder="e.g., 70" 
                value={passingScore} 
                onChange={e=>{
                  setPassingScore(e.target.value);
                  const error = validatePassingScore(e.target.value);
                  setErrors(prev => ({...prev, passingScore: error}));
                }}
              />
              {errors.passingScore && <p className="text-red-500 text-xs mt-1">{errors.passingScore}</p>}
            </div>
          </div>

          {/* Questions Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Questions</h3>
            
            {questions.map((q, qi) => (
              <div key={qi} className="border border-gray-200 rounded-lg p-5 mb-4 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-900 text-white rounded-md w-7 h-7 flex items-center justify-center text-sm font-medium">
                      {qi+1}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">Question {qi+1}</h4>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded mt-1 ${
                        q.correctOptionIndex !== undefined && q.text.trim() 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {q.correctOptionIndex !== undefined && q.text.trim() ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Marks:</label>
                      <input 
                        className={`w-16 border rounded-md px-2 py-1.5 text-sm text-center font-medium ${
                          errors[`question_${qi}_marks`] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        type="number" 
                        min="1"
                        value={q.marks} 
                        onChange={e=>{
                          updateQuestion(qi,{ marks: Number(e.target.value) });
                          const error = validateMarks(e.target.value);
                          setErrors(prev => ({...prev, [`question_${qi}_marks`]: error}));
                        }}
                      />
                    </div>
                    {questions.length > 1 && (
                      <button 
                        className="mt-5 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors" 
                        onClick={()=>removeQuestion(qi)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Text *</label>
                  <textarea 
                    className={`w-full border rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                      errors[`question_${qi}_text`] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    rows="2"
                    value={q.text} 
                    onChange={e=>{
                      updateQuestion(qi,{ text: e.target.value });
                      const error = validateQuestionText(e.target.value);
                      setErrors(prev => ({...prev, [`question_${qi}_text`]: error}));
                    }}
                    placeholder="Enter your question" 
                  />
                  {errors[`question_${qi}_text`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`question_${qi}_text`]}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.hasCode || false}
                      onChange={e => updateQuestion(qi, { hasCode: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Include code snippet with this question</span>
                  </label>
                </div>

                {q.hasCode && (
                  <div className="mb-4 bg-gray-900 rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-300">Code Snippet</label>
                      <select
                        value={q.codeLanguage || 'javascript'}
                        onChange={e => updateQuestion(qi, { codeLanguage: e.target.value })}
                        className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="sql">SQL</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                      </select>
                    </div>
                    <textarea
                      value={q.codeSnippet || ''}
                      onChange={e => updateQuestion(qi, { codeSnippet: e.target.value })}
                      placeholder={`Enter ${q.codeLanguage || 'javascript'} code here...`}
                      className="w-full bg-gray-800 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                      style={{ tabSize: 2 }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options *</label>
                  <p className="text-xs text-gray-500 mb-3">Select the correct answer by clicking the radio button</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div 
                        key={oi} 
                        className={`flex items-center gap-3 p-3 border rounded-md bg-white transition-colors ${
                          oi === (q.correctOptionIndex || 0) 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`correct-${qi}`} 
                          checked={oi === (q.correctOptionIndex || 0)} 
                          onChange={()=>{
                            const newOpts = q.options.map((o,i)=> ({...o, isCorrect: i===oi}));
                            updateQuestion(qi,{ options: newOpts, correctOptionIndex: oi });
                          }}
                          className="w-4 h-4 text-green-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <input 
                          className={`flex-1 border-0 p-0 text-sm focus:outline-none focus:ring-0 bg-transparent ${
                            errors[`question_${qi}_option_${oi}`] ? 'text-red-600' : 'text-gray-900'
                          }`}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`} 
                          value={opt.text} 
                          onChange={e=>{
                            const newOpts = q.options.map((o,i)=> i===oi?{...o,text:e.target.value}:o);
                            updateQuestion(qi,{ options: newOpts });
                            const error = validateOptionText(e.target.value);
                            setErrors(prev => ({...prev, [`question_${qi}_option_${oi}`]: error}));
                          }}
                        />
                        {q.options.length > 2 && (
                          <button 
                            className="text-gray-400 hover:text-red-600 text-sm transition-colors" 
                            onClick={()=>removeOption(qi, oi)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 6 && (
                      <button 
                        className="w-full py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm" 
                        onClick={()=>addOption(qi)}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button 
              className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium mb-6" 
              onClick={addQuestion}
            >
              + Add Question
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors" 
              onClick={() => navigate('/admin/quizzes/list')}
            >
              Cancel
            </button>
            <button 
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={submit} 
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Quiz'}
            </button>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
