import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { getUserDisplayName } from "@/components/utils/userHelpers";

/**
 * MentionInput - Textarea with @mention support
 * Exposes getMentions() via ref to get list of mentioned user emails
 */
const MentionInput = forwardRef(function MentionInput(
  { value, onChange, placeholder, users = [], className = "" },
  ref
) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionedEmails, setMentionedEmails] = useState([]);
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getMentions: () => mentionedEmails,
  }));

  const handleChange = (e) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart;
    const textUpToCursor = text.slice(0, cursorPos);
    const atIndex = textUpToCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const query = textUpToCursor.slice(atIndex + 1).toLowerCase();
      if (!query.includes(' ') && query.length >= 0) {
        const filtered = users.filter(u => {
          const name = getUserDisplayName(u).toLowerCase();
          const email = (u.email || '').toLowerCase();
          return name.includes(query) || email.includes(query);
        }).slice(0, 6);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setMentionStart(atIndex);
        return;
      }
    }

    setShowSuggestions(false);
  };

  const handleSelectMention = (user) => {
    const name = getUserDisplayName(user);
    const before = value.slice(0, mentionStart);
    const after = value.slice(textareaRef.current?.selectionStart || value.length);
    const newText = `${before}@${name} ${after}`;
    onChange(newText);

    setMentionedEmails(prev =>
      prev.includes(user.email) ? prev : [...prev, user.email]
    );
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const pos = mentionStart + name.length + 2;
        textareaRef.current.setSelectionRange(pos, pos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative" dir="rtl">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none ${className}`}
        dir="rtl"
      />

      {showSuggestions && (
        <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-64 right-0 overflow-hidden">
          {suggestions.map(user => (
            <button
              key={user.id || user.email}
              type="button"
              onClick={() => handleSelectMention(user)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-right"
            >
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getUserDisplayName(user).charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-medium text-gray-800 truncate">{getUserDisplayName(user)}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default MentionInput;