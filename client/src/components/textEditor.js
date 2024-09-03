import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import debounce from 'lodash.debounce';

function TextEditor({ argumentId, initialContent }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  const saveContent = async (content) => {
    try {
      setIsSaving(true);
      await axios.post('http://localhost:5000/save_content', { argumentId, content });
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving content:', error);
      setIsSaving(false);
    }
  };

  const debouncedSaveContent = useCallback(debounce(saveContent, 1000), []);

  useEffect(() => {
    const interval = setInterval(() => {
      debouncedSaveContent(content);
    }, 5000);

    return () => clearInterval(interval);
  }, [content, debouncedSaveContent]);

  const handleChange = (value) => {
    setContent(value);
    debouncedSaveContent(value);
  };

  return (
    <div>
      <ReactQuill value={content} onChange={handleChange} />
      {isSaving && <p>Saving...</p>}
    </div>
  );
}

export default TextEditor;