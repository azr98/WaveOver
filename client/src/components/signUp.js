import React, { useState } from 'react';
import Amplify, { Auth } from 'aws-amplify';

Amplify.configure({
    Auth: {
        region: 'eu-west-1',
        userPoolId: 'eu-west-1_Nr58LE83N',
        userPoolWebClientId: '4rnflukdkhjrsguh2rp3gkuk91',
        oauth: {
            domain: 'https://waveover-dev.auth.eu-west-1.amazoncognito.com',
            scope: ['email', 'profile', 'openid'],
            redirectSignIn: 'http://localhost:5000/dashboard',
            redirectSignOut: 'http://localhost:5000/signup',
            responseType: 'code'  // or 'token', depending on your needs
        }
    }
});

Auth.configure({
    Auth: {
        region: 'eu-west-1',
        userPoolId: 'eu-west-1_Nr58LE83N',
        userPoolWebClientId: '4rnflukdkhjrsguh2rp3gkuk91',
        oauth: {
            domain: 'https://waveover-dev.auth.eu-west-1.amazoncognito.com',
            scope: ['email', 'profile', 'openid'],
            redirectSignIn: 'http://localhost:5000/dashboard',
            redirectSignOut: 'http://localhost:5000/signup',
            responseType: 'code'  // or 'token', depending on your needs
        }
    }
});


function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSignup = async () => {
        try {
            const signupResponse = await Auth.signUp({
                username: email,
                password: password,
                attributes: {
                    email: email,
                    'custom:displayName': displayName
                }
            });
            console.log('Signup success!', signupResponse);
        } catch (error) {
            console.error('Error signing up:', error);
        }
    };

    const signInWithProvider = (provider) => {
        Auth.federatedSignIn({ provider });
    };

    return (
        <div>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display Name" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleSignup}>Sign Up</button>
            <button onClick={() => signInWithProvider('Google')}>Sign Up with Google</button>
            <button onClick={() => signInWithProvider('Twitter')}>Sign Up with Twitter</button>
        </div>
    );
}

export default Signup;