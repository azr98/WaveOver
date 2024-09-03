import React from 'react';
import { useLocation } from 'react-router-dom';
import TextEditor from './textEditor.js';
import { withAuthenticator} from '@aws-amplify/ui-react';

function ArgumentPage() {
  const location = useLocation();
  const { argument } = location.state;

  return (
    <div>
      <h1>Argument: {argument.argument_topic}</h1>
      <TextEditor argumentId={argument.argument_topic} initialContent={argument.content || ''} />
    </div>
  );
}

export default withAuthenticator(ArgumentPage);

//{
  //   socialProviders: [
  //     'google'
  //   ]
  // }
  
