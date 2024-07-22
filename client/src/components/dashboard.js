import React, { useEffect, useState } from 'react';
import axios from 'axios';
import cognito_config from '../amplifyconfiguration.json'
import { Amplify } from 'aws-amplify';
import { getCurrentUser , fetchUserAttributes } from '@aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator} from '@aws-amplify/ui-react';
Amplify.configure(cognito_config);

function Dashboard() {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [argumentTopic, setArgumentTopic] = useState('');
  const [initiated, setInitiated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  


  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
          if (userAttributes.email) {
            console.log("Pulled email" , userAttributes.email)
            setUserEmail(userAttributes.email);
            console.log("userEmail var:", userEmail);
          } else {
              console.log("Error: User email not found in attributes");
            }
         
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserEmail();
  }, []);

  useEffect(() => {
    console.log("userEmail state updated:", userEmail);
  }, [userEmail]);

  const handleInitiate = async () => {


    try {
      if (userEmail){

      const argumentSubmitData = {
        user_id: userEmail,  // This is dynamically set based on logged-in user
        spouse_email: spouseEmail,
        argument_topic: argumentTopic,
      };

      const response = await axios.post('http://localhost:5000/submit_argument', argumentSubmitData);
      console.log('API call successful:', response.data);
      setInitiated(true);
      }

      else {
        document.write("Wait for WavOver to fetch your user email");
      }
      // You can add more success handling here if needed
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log(error.config);
    
    }
    
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
