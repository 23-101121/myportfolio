import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Projects from './pages/Projects.jsx';
import ProjectsList from './pages/ProjectsList.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import CaseStudy from './pages/CaseStudy.jsx';
import Services from './pages/Services.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import Resume from './pages/Resume.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/list" element={<ProjectsList />} />
        <Route path="project/:slug" element={<ProjectDetail />} />
        <Route path="case-study/:slug" element={<CaseStudy />} />
        <Route path="services" element={<Services />} />
        <Route path="contact" element={<Contact />} />
        <Route path="resume" element={<Resume />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
