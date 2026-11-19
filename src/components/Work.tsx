import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import "./styles/Work.css";
import WorkImage from "./WorkImage";

const projects = [
  {
    title: "TruthLine - Fake News Detection",
    category: "AI Verification Engine",
    tools: "Python, Flask, Machine Learning, NLP",
    image: "/projects/truthline-fake-news.jpg",
    link: "https://github.com/princerajakzk/FAKE-NEWS-DETECTION-SYSTEM",
  },
  {
    title: "Jai Maa Kali Marriage Palace",
    category: "Wedding Venue Website",
    tools: "HTML, CSS, JavaScript, Python",
    image: "/projects/jai-maa-kali-palace.jpg",
    link: "https://github.com/princerajakzk/WEBSITE-MARRIAGE-PALACE",
  },
  {
    title: "BBBB Store",
    category: "Luxury E-commerce Platform",
    tools: "HTML, CSS, JavaScript, Node.js, MongoDB, Three.js",
    image: "/projects/bbbb-store.jpg",
    link: "https://github.com/princerajakzk/BBBB-STORE",
  },
  {
    title: "Civitas - Online Voting System",
    category: "Secure Election Workspace",
    tools: "Node.js, Express, MongoDB, Aadhaar Verification",
    image: "/projects/civitas-voting.jpg",
  },
  {
    title: "SpendWise",
    category: "Expense Tracker Dashboard",
    tools: "HTML, CSS, JavaScript, Node.js, MongoDB, Chart.js",
    image: "/projects/spendwise.jpg",
    link: "https://github.com/princerajakzk/spendwise",
  },
];

const Work = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const showPreviousProject = () => {
    setActiveIndex((index) => (index - 1 + projects.length) % projects.length);
  };
  const showNextProject = () => {
    setActiveIndex((index) => (index + 1) % projects.length);
  };

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-carousel" aria-label="My projects">
          <button
            className="work-arrow work-arrow-previous"
            type="button"
            onClick={showPreviousProject}
            aria-label="Show previous project"
          >
            <MdKeyboardArrowLeft />
          </button>
          <div className="work-viewport">
            <div
              className="work-flex"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {projects.map((project, index) => (
                <article
                  className="work-box"
                  key={project.title}
                  aria-label={`${index + 1} of ${projects.length}: ${project.title}`}
                >
                  <div className="work-info">
                    <div className="work-title">
                      <h3>{String(index + 1).padStart(2, "0")}</h3>
                      <div className="work-details">
                        <h4>{project.title}</h4>
                        <p>{project.category}</p>
                        <div className="work-tools">
                          <h4>Tools and features</h4>
                          <p>{project.tools}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <WorkImage
                    image={project.image}
                    alt={project.title}
                    link={project.link}
                  />
                </article>
              ))}
            </div>
          </div>
          <button
            className="work-arrow work-arrow-next"
            type="button"
            onClick={showNextProject}
            aria-label="Show next project"
          >
            <MdKeyboardArrowRight />
          </button>
          <div className="work-pagination" aria-label="Choose a project">
            {projects.map((project, index) => (
              <button
                className={`work-dot${index === activeIndex ? " active" : ""}`}
                key={project.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show project ${index + 1}: ${project.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
