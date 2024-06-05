import React, { useEffect, useState } from 'react';
import axios from 'axios';
import cognito_config from '../amplifyconfiguration.json'
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator} from '@aws-amplify/ui-react';
Amplify.configure(cognito_config);

function Dashboard({user}) {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [argumentTopic, setArgumentTopic] = useState('');
  const [initiated, setInitiated] = useState(false);

  const handleInitiate = async () => {

    const data = {
      user_id: 'user',  // This should be dynamically set based on logged-in user
      spouse_email: spouseEmail,
      argument_topic: argumentTopic,
    };
    await axios.post('http://localhost:5000/submit_argument', data);
    setInitiated(true);
  };


  return (
    <div>
      <h1>Start a discussion</h1>
      {!initiated ? (
        <>
          <input type="email" value={spouseEmail} onChange={(e) => setSpouseEmail(e.target.value)} placeholder="Spouse's Email" />
          <input type="text" value={argumentTopic} onChange={(e) => setArgumentTopic(e.target.value)} placeholder="Argument Topic" />
          <button onClick={handleInitiate}>Initiate Argument</button>
        </>
      ) : (
        <p>Argument initiated. Waiting for spouse to join.</p>
      )}
    </div>
  );
}

export default withAuthenticator(Dashboard);

// {
//   socialProviders: [
//     'google'
//   ]
// }
