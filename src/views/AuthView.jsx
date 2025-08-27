import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const AuthView = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (error) alert(error.message);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await signUp(email, password, username);
    if (error) alert(error.message);
  };

  return (
    <div className="p-4">
      <form onSubmit={handleLogin}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"/>
        <button type="submit">Login</button>
      </form>

      <form onSubmit={handleSignup}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"/>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"/>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"/>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default AuthView;
