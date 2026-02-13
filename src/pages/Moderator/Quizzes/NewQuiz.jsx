import React, { useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

const emptyOption = () => ({ text: '', isCorrect: false });
const emptyQuestion = () => ({ 
  text: '', 
  marks: 1, 
  options: [
    { text: '', isCorrect: true },  // First option is correct by default
    { text: '', isCorrect: false }
  ], 
  correctOptionIndex: 0, 
  hasCode: false, 
  codeSnippet: '', 
  codeLanguage: 'javascript' 
});
export default function NewQuiz() {
  const [title, setTitle] = useState('');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
    
    // Basic fields validation
    const titleError = validateTitle(title);
    const skillError = validateSkillName(skillName);
    const timeLimitError = validateTimeLimit(timeLimit);
    const passingScoreError = validatePassingScore(passingScore);
    
    if (titleError) newErrors.title = titleError;
    if (skillError) newErrors.skillName = skillError;
    if (timeLimitError) newErrors.timeLimit = timeLimitError;
    if (passingScoreError) newErrors.passingScore = passingScoreError;

    // Questions validation
    questions.forEach((q, qi) => {
      const qTextError = validateQuestionText(q.text);
      const marksError = validateMarks(q.marks);
      
      if (qTextError) newErrors[`question_${qi}_text`] = qTextError;
      if (marksError) newErrors[`question_${qi}_marks`] = marksError;
      
      // Options validation
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
    const res = await fetch('/api/moderator/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      alert('Quiz created successfully!');
      // reset
      setTitle(''); setSkillName(''); setDescription(''); setQuestions([emptyQuestion()]); setErrors({});
    } else {
      alert('Failed: ' + JSON.stringify(data.error));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add New Skill Quiz</h2>
              <p className="text-sm text-gray-500 mt-1">Create assessment questions for skill evaluation</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="text-sm font-semibold text-blue-800 mb-2">Quiz Statistics</div>
              <div className="flex gap-6">
                <div>
                  <div className="text-xs text-gray-600">Total Questions</div>
                  <div className="text-2xl font-bold text-blue-600">{stats().totalQ}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Total Marks</div>
                  <div className="text-2xl font-bold text-blue-600">{stats().totalMarks}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Title *</label>
              <input 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter quiz title (e.g., JavaScript Fundamentals)" 
                value={title} 
                onChange={e=>{
                  setTitle(e.target.value);
                  const error = validateTitle(e.target.value);
                  setErrors(prev => ({...prev, title: error}));
                }}
                onBlur={e=>{
                  const error = validateTitle(e.target.value);
                  setErrors(prev => ({...prev, title: error}));
                }}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Name *</label>
              <input 
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.skillName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter skill name (e.g., JavaScript, Python, React)" 
                value={skillName} 
                onChange={e=>{
                  setSkillName(e.target.value);
                  const error = validateSkillName(e.target.value);
                  setErrors(prev => ({...prev, skillName: error}));
                }}
                onBlur={e=>{
                  const error = validateSkillName(e.target.value);
                  setErrors(prev => ({...prev, skillName: error}));
                }}
              />
              {errors.skillName && <p className="text-red-500 text-xs mt-1">{errors.skillName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                rows="3"
                placeholder="Brief description of the quiz" 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (minutes)</label>
                <input 
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.timeLimit ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Passing Score (%)</label>
                <input 
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.passingScore ? 'border-red-500 bg-red-50' : 'border-gray-300'
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

            {questions.map((q, qi) => (
              <div key={qi} className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 hover:border-blue-300 transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {qi+1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Question {qi+1}</h4>
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded mt-1">
                        {q.correctOptionIndex !== undefined ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Marks:</label>
                      <input 
                        className={`w-20 border rounded p-2 text-center font-semibold ${
                          errors[`question_${qi}_marks`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
                      {errors[`question_${qi}_marks`] && (
                        <p className="text-red-500 text-xs mt-1">Min 1</p>
                      )}
                    </div>
                    <button 
                      className="mt-5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm" 
                      onClick={()=>removeQuestion(qi)}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text *</label>
                  <textarea 
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                      errors[`question_${qi}_text`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    rows="2"
                    value={q.text} 
                    onChange={e=>{
                      updateQuestion(qi,{ text: e.target.value });
                      const error = validateQuestionText(e.target.value);
                      setErrors(prev => ({...prev, [`question_${qi}_text`]: error}));
                    }}
                    onBlur={e=>{
                      const error = validateQuestionText(e.target.value);
                      setErrors(prev => ({...prev, [`question_${qi}_text`]: error}));
                    }}
                    placeholder="Enter your question (minimum 10 characters)" 
                  />
                  {errors[`question_${qi}_text`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`question_${qi}_text`]}</p>
                  )}
                </div>

                {/* Code Editor Toggle */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.hasCode || false}
                      onChange={e => updateQuestion(qi, { hasCode: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                        Include code snippet with this question
                    </span>
                  </label>
                </div>

                {/* Code Editor Section */}
                {q.hasCode && (
                  <div className="mb-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-white">Code Snippet</label>
                      <select
                        value={q.codeLanguage || 'javascript'}
                        onChange={e => updateQuestion(qi, { codeLanguage: e.target.value })}
                        className="bg-gray-800 text-white text-xs px-3 py-1 rounded border border-gray-600"
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
                    <div className="relative">
                      <div className="absolute top-2 left-2 text-xs text-gray-500 font-mono">
                        {q.codeLanguage || 'javascript'}
                      </div>
                      <textarea
                        value={q.codeSnippet || ''}
                        onChange={e => updateQuestion(qi, { codeSnippet: e.target.value })}
                        placeholder={`Enter ${q.codeLanguage || 'javascript'} code here...`}
                        className="w-full bg-gray-800 text-green-400 font-mono text-sm p-4 pt-8 rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
                        style={{ tabSize: 2 }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        This code will be displayed with syntax highlighting when freelancers take the quiz
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Answer Options *</label>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Select correct answer</span>
                      {/* <span className="text-gray-400">Minimum 2 characters per option</span> */}
                    </div>
                    {q.options.map((opt, oi) => (
                      <div 
                        key={oi} 
                        className={`flex items-center gap-3 p-3 mb-2 border-2 rounded-lg transition ${
                          oi === (q.correctOptionIndex || 0) 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-blue-300'
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
                          className="w-5 h-5 text-green-600 cursor-pointer"
                        />
                        <div className="bg-white rounded px-2 py-1 text-sm font-semibold text-gray-500 min-w-[24px] text-center">
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <input 
                          className={`flex-1 border-0 p-2 focus:outline-none focus:ring-0 bg-transparent ${
                            errors[`question_${qi}_option_${oi}`] ? 'text-red-600' : ''
                          }`}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`} 
                          value={opt.text} 
                          onChange={e=>{
                            const newOpts = q.options.map((o,i)=> i===oi?{...o,text:e.target.value}:o);
                            updateQuestion(qi,{ options: newOpts });
                            const error = validateOptionText(e.target.value);
                            setErrors(prev => ({...prev, [`question_${qi}_option_${oi}`]: error}));
                          }}
                          onBlur={e=>{
                            const error = validateOptionText(e.target.value);
                            setErrors(prev => ({...prev, [`question_${qi}_option_${oi}`]: error}));
                          }}
                        />
                        {errors[`question_${qi}_option_${oi}`] && (
                          <span className="text-red-500 text-xs">✕</span>
                        )}
                        {q.options.length > 2 && (
                          <button 
                            className="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50" 
                            onClick={()=>removeOption(qi, oi)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 6 && (
                      <button 
                        className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition text-sm font-medium" 
                        onClick={()=>addOption(qi)}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-6 border-t border-gray-200 mt-6">
              <button 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm" 
                onClick={addQuestion}
              >
                + Add Question
              </button>
              <button 
                className="flex-1 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={submit} 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Create Skill Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
