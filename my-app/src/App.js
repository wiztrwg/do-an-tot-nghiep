import "./App.css";
import Header from "./components/layout/Header/Header";
import Footer from "./components/layout/Footer/Footer";
import { UserProvider } from "./context/UserContext";

const App = (props) => {
  return (
    <UserProvider>
      <div className="app-shell">
        <Header />
        <main className="app-main">{props.children}</main>
        <Footer />
      </div>
    </UserProvider>
  );
};

export default App;
