import React, { useState , useEffect } from 'react';
import { signUp } from 'aws-amplify/auth';
import axios from 'axios';
import cognito_config from '../../amplifyconfiguration.json'


// googleAccessToken = 'fdjslsghafjlau543895743985shkajhdsa'
function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [realName, setDisplayName] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [clientId, setClientId] = useState('');

    useEffect(() => {
        // Assuming you have a way to access environment variables (e.g., process.env.REACT_APP_COGNITO_CLIENT_ID)
        setClientId(cognito_config['aws_user_pools_web_client_id']);
      }, []);
    // For the Flask googlesignup route
    const signUpWithGoogle = async () => {
        try {
                const authorizationUrl = `https://waveover-dev.auth.eu-west-1.amazoncognito.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid+phone&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fdashboard`;
                window.location.href = authorizationUrl;
            } catch (error) {
                console.error('Error signing up with Google:', error);
            }
    };

    const manualSignup = async () => {
        const data = {
            email: email,  // This should be dynamically set based on logged-in user
            real_name: realName,
            password : password
        };
        try{
            
          const response = await axios.post('http://localhost:5000//manualsignup', data);
          console.log('cognito signup response:', response)
          if (response['ResponseMetadata']['HTTPStatusCode'] == 200){
            setIsSubmitted(true);
            //[] import mfa checkbox at top and render in jsx. Also need to code back end to submit the mfa code 
          }
        } catch (error) {
            console.error('Error signing up', error);
        }
    }



    return (
        <div>
            {/*<input type="text" value={realName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display Name" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" /> */}
            <button onClick={() => signUpWithGoogle('Google')}>Sign Up</button>
            {/*<button onClick={() => manualSignup()}>Sign Up </button> */}
        </div>
    );
}

export default Signup;

