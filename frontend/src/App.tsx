import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/loginPage/loginPage";
import Signup from "./components/signupPage/signupPage";
import { ProtectedRoute } from "./server/protectedRoute";
import Schedule from "./components/dashboard/schedule/schedule";
import EditProfile from "./components/editProfile/editProfile";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/editProfile" element={<ProtectedRoute>
              <EditProfile/>
            </ProtectedRoute>} />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <Schedule/>
            </ProtectedRoute>
          }
        />
        {/* Future routes would be added here*/}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
