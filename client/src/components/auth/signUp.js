import React, { useState , useEffect } from 'react';
import { signUp } from 'aws-amplify/auth';
import axios from 'axios';
import cognito_config from '../../amplifyconfiguration.json'
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react';



// googleAccessToken = 'fdjslsghafjlau543895743985shkajhdsa'
function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [realName, setDisplayName] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [clientId, setClientId] = useState('');

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

export default withAuthenticator(Signup);