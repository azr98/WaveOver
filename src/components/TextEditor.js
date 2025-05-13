"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import debounce from 'lodash.debounce';
import CountdownTimer from './CountdownTimer';

function TextEditor({ argument, userEmail }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      if (content) {
        debouncedSaveContent(content);
      }
    },
  });

  useEffect(() => {
    // Check if deadline has passed
    if (argument?.argument_deadline) {
      const deadline = new Date(argument.argument_deadline);
      const now = new Date();
      setIsDeadlinePassed(now > deadline);
    }

    // Load the correct response when the component mounts or when the argument changes
    console.log("Full arg in textEditor", argument);
    if (argument && userEmail && editor) {
      if (userEmail === argument.user_email) {
        editor.commands.setContent(argument.user_response);
      } else if (userEmail === argument.spouse_email) {
        editor.commands.setContent(argument.spouse_response);
      } else {
        setError('User not authorized to view this argument');
      }
    }
  }, [argument, userEmail, editor]);

  const saveContent = async (content) => {
    try {
      setIsSaving(true);
      setError(null);
      console.log('Saving content. First 100 chars of content here', {
        argument: argument,
        content: content.substring(0, 100) + '...',
        userEmail: userEmail
      });
      const response = await axios.post('/api/save_content', {
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

  const renderContent = () => {
    // If there's no deadline, don't show anything
    if (!argument?.argument_deadline) {
      return null;
    }

    // If deadline has passed, show the appropriate response
    if (isDeadlinePassed) {
      if (userEmail === argument.user_email) {
        return <div dangerouslySetInnerHTML={{ __html: argument.spouse_response }} />;
      } else if (userEmail === argument.spouse_email) {
        return <div dangerouslySetInnerHTML={{ __html: argument.user_response }} />;
      }
      return <p>Not authorized to view this response</p>;
    }

    // If deadline hasn't passed, show the editor
    return (
      <div className="editor-container">
        <div className="editor-toolbar">
          <button
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={editor?.isActive('paragraph') ? 'is-active' : ''}
          >
            Normal
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          >
            H1
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          >
            H2
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          >
            H3
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'is-active' : ''}
          >
            Bold
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'is-active' : ''}
          >
            Italic
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'is-active' : ''}
          >
            Bullet List
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'is-active' : ''}
          >
            Numbered List
          </button>
        </div>
        <EditorContent editor={editor} key={argument?.submission_time + userEmail} />
        {isSaving && <p>Saving...</p>}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 48,
        justifyContent: 'flex-start',
        marginBottom: 16,
      }}>
        <span style={{ fontWeight: 500, fontSize: '1.3rem' }}>
          With: {(() => {
            const isUser = userEmail === argument.user_email;
            const first = isUser ? argument.spouse_firstname : argument.user_firstname;
            const last = isUser ? argument.spouse_lastname : argument.user_lastname;
            const email = isUser ? argument.spouse_email : argument.user_email;
            return (first && last) ? `${first} ${last}` : email;
          })()}
        </span>
        <span style={{ fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'baseline' }}>
          Time remaining:
          <span style={{ marginLeft: 8, fontSize: '1.1rem', verticalAlign: 'baseline', display: 'inline-block' }}>
            {argument?.argument_deadline && (
              <CountdownTimer
                deadline={argument.argument_deadline}
                userEmail={argument.user_email}
                spouseEmail={argument.spouse_email}
              />
            )}
          </span>
        </span>
      </div>
      {renderContent()}
      {error && <p style={{ color: 'red', textAlign: 'left' }}>{error}</p>}
      <style jsx>{`
        .editor-container {
          border: 2px solid #e3f2fd;
          border-radius: 6px;
          padding: 1rem;
          background: #e3f2fd;
          margin: 0 auto;
          max-width: 100%;
        }
        .editor-toolbar {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0.5rem 1rem 0.5rem 1rem;
          border-bottom: 1px solid #eee;
          justify-content: flex-start;
        }
        .editor-toolbar button {
          padding: 0.25rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          margin-right: 0;
        }
        .editor-toolbar button:last-child {
          margin-right: 0;
        }
        .editor-toolbar button:hover {
          background: #f0f0f0;
        }
        .editor-toolbar button.is-active {
          background: #e0e0e0;
        }
        .ProseMirror {
          min-height: 160px;
          padding: 0.5rem;
          background: #e3f2fd;
          border-radius: 4px;
          border: 2px solid #e3f2fd;
          caret-color: #1976d2;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .ProseMirror:focus {
          outline: 2px solid #1976d2;
          border-color: #1976d2;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror:empty:before {
          content: 'Type your response here...';
          color: #bbb;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

export default TextEditor; 