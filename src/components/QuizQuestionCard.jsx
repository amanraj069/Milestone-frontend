import React from 'react';

export default function QuizQuestionCard({ question, onSelect, selectedIndex }){
  return (
    <div className="border p-3 rounded">
      <div className="font-medium">{question.text}</div>
      <div className="mt-2 space-y-2">
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name={question._id} checked={selectedIndex===i} onChange={()=>onSelect(i)} />
            <div>{opt.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
