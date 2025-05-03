import { Routes, Route } from 'react-router-dom';

import Home from './pages/home';
import Contact from './pages/contact';
import PrivacyPolicy from './pages/privacy-policy';
import Header from './components/Header';
import Footer from './components/Footer';
import Alert from './components/Alert';

const App: React.FC = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
      </Routes>
      <Alert />
      <Footer />
    </>
  );
};

export default App;
