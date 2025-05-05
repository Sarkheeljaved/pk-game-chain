import { BrowserRouter, Routes, Route } from "react-router";
import AdminDataPage from "./pages/AdminDataPage";
import ChatApp from "./pages/ChatApp";
function App() {
  return (
    <div style={{ width: "100%" }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminDataPage />} />
          <Route path="/chat-Page" element={<ChatApp />} />
        </Routes>
      </BrowserRouter>
      {/* <Main/> */}
    </div>
  );
}

export default App;
