import React, { useState } from 'react';
import { signUp } from 'aws-amplify/auth';
import axios from 'axios';

// For the Flask googlesignup route
const signUpWithGoogle = async () => {
    // try {
    //     await axios.post('http://localhost:5000/googlesignup');
    // } catch (error) {
    //     console.error('Error signing up with Google:', error);
    // }
    try {
        console.log('Hi Xd');
        const response = await axios.post('http://localhost:5000/googlesignup');
        console.log('Response obj', response);
        const initial_auth_object = response.data
        console.log('Initial auth object:', initial_auth_object);
        // You can also redirect the user to the authorizationUrl here
        } catch (error) {
        console.error('Error signing up with Google:', error);
        }
};

// googleAccessToken = 'fdjslsghafjlau543895743985shkajhdsa'
function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    // const handleSignup = async () => {
    //     try {
    //         const signupResponse = await signUp({
    //             username: email,
    //             password: password,
    //             attributes: {
    //                 email: email,
    //                 'custom:displayName': displayName
    //             }
    //         });
    //         console.log('Signup success!', signupResponse);
    //     } catch (error) {
    //         console.error('Error signing up:', error);
    //     }
    // };



    return (
        <div>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display Name" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleSignup}>Sign Up</button>
            <button onClick={() => signUpWithGoogle('Google')}>Sign Up with Google</button>
            <button onClick={() => signUp()}>Sign Up </button>
        </div>
    );
}

export default Signup;

