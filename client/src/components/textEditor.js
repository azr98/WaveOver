import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import debounce from 'lodash.debounce';
import CountdownTimer from './CountdownTimer';

function TextEditor({ argument, userEmail }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load the correct response when the component mounts or when the argument changes
    console.log("Full arg in textEditor", argument);
    if (argument && userEmail) {
      if (userEmail === argument.user_email) {
        setContent(argument.user_response);
      } else if (userEmail === argument.spouse_email) {
        setContent(argument.spouse_response);
      } else {
        setError('User not authorized to view this argument');
      }
    }
  }, [argument, userEmail]);

  const saveContent = async (content) => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('Saving content. First 100 chars of content here', {
        argument: argument,
        content: content.substring(0, 100) + '...',
        userEmail: userEmail
      });
      const response = await axios.post('http://10.0.0.8:5000/save_content', {
        argument: argument,
        content: content,
        userEmail: userEmail
      });
      console.log('Save content response:', response.data);
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving content:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      setError('Failed to save content. Please try again.');
      setIsSaving(false);
    }
  };

  const debouncedSaveContent = useCallback(
    debounce((content) => {
      if (content.trim()) {
        saveContent(content);
      }
    }, 1000),
    [argument, userEmail]
  );

  useEffect(() => {
    if (content) {
      debouncedSaveContent(content);
    }
  }, [content, debouncedSaveContent]);

  const handleChange = (value) => {
    setContent(value);
  };

  return (
    <div>
      <CountdownTimer 
        deadline={argument.argument_deadline}
        userEmail={argument.user_email}
        spouseEmail={argument.spouse_email}
      />
      <ReactQuill value={content} onChange={handleChange} />
      {isSaving && <p>Saving...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}

export default TextEditor;