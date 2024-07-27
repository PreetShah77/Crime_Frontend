import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, UserButton, useClerk, useUser } from "@clerk/clerk-react";
import "../styles/Header.css";
import { Link, useNavigate } from "react-router-dom";

function SignUpButton() {
  const clerk = useClerk();

  return (
    <button className="sign-up-btn" onClick={() => clerk.openSignUp({})}>
      Sign up
    </button>
  );
}

function SignInButton() {
  const clerk = useClerk();

  return (
    <button className="sign-in-btn" onClick={() => clerk.openSignIn({})}>
      Sign in
    </button>
  );
}

function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress.emailAddress;
      const authMethods = user.externalAccounts; // Get external accounts like Google

      // Check if user logged in via Google
      const loggedInWithGoogle = authMethods.some(account => account.provider === 'google');

      if (!loggedInWithGoogle) {
        const adminEmail = "preetashah21@gnu.ac.in";
        const adminPassword = "qweasd123../";

        if (email === adminEmail) {
          console.log("proper");
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }
  }, [user]);

  const handleSOS = () => {
    navigate('/sos');
  };

  return (
    <header>
      <Link to="/" className="logo-link">
        <img src="/logo.jpg" alt="Crime Watch Logo" className="logo" />
      </Link>
      <nav>
        <SignedOut>
          <ul>
            <li>
              <button onClick={handleSOS} className="sign-up-btn">SOS</button>  
            </li>
            <li>
              <SignUpButton />
            </li>
            <li>
              <SignInButton />
            </li>
          </ul>
        </SignedOut>

        <SignedIn>
          <ul>
            {isAdmin ? (
              <>
                <li>
                  <Link to='/dashboard' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      Dashboard
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to='/crimemap' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      Map
                    </button>
                  </Link>
                </li>
                <li>
              <UserButton className="user-button" afterSignOutUrl="/" />
            </li>
              </>
            ) : (
              <>
                <li>
                  <Link to='/crimemap' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      Map
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to='/report' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      Report Form
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to='/myreport' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      My Reports
                    </button>
                  </Link>
                </li>
                <li>
                <UserButton className="user-button" afterSignOutUrl="/" />
                </li>
              </>
            )}
          </ul>
        </SignedIn>
      </nav>
    </header>
  );
}

export default Header;