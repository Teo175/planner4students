import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./components/loginPage/loginPage";
import { ProtectedRoute } from "./api/server/protectedRoute";
import Schedule from "./components/dashboard/schedule/schedule";
import EditProfile from "./components/editProfile/editProfile";
import Signup from "./components/signupPage/signUpPage";
import RoomMaps from "./components/roomMaps/roomMaps";
import Professors from "./components/professors/professors";


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
        <Route path="/roomsMaps" element={<ProtectedRoute>
        <RoomMaps/>
        </ProtectedRoute>} />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute>
              <Schedule/>
            </ProtectedRoute>
          }
        />
        <Route path="professors" element={<ProtectedRoute><Professors/></ProtectedRoute>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
