import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignUp from "./components/signupPage/signUpPage";
import LogIn from "./components/loginPage/loginPage";
import Dashboard from "./components/dashboard/dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/logIn" element={<LogIn/>} />
        <Route path="/signUp" element={<SignUp/>} />
        <Route path="/dashboard" element={<Dashboard/>}/>
        {/* Future routes would be added here*/}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
