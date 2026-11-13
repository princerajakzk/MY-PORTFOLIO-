import { useState } from "react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import "./styles/Work.css";
import WorkImage from "./WorkImage";

const projects = [
  {
    title: "Fake News Detection System",
    category: "Machine Learning Application",
    tools: "Python, Flask, Machine Learning",
    image: "/projects/fake-news-detection.svg",
    link: "https://github.com/princerajakzk/FAKE-NEWS-DETECTION-SYSTEM",
  },
  {
    title: "Jai Maa Kali Palace",
    category: "Tent Booking Website",
    tools: "HTML, CSS, Python",
    image: "/projects/jai-maa-kali-palace.svg",
    link: "https://github.com/princerajakzk/WEBSITE-MARRIAGE-PALACE",
  },
  {
    title: "MY SHOP",
    category: "E-commerce Website",
    tools: "HTML, CSS, JavaScript, Node.js, MongoDB",
    image: "/projects/my-shop.svg",
    link: "https://github.com/princerajakzk/BBBB-STORE",
  },
  {
    title: "Online Voting System",
    category: "Web Application",
    tools: "Node.js, Express, MongoDB",
    image: "/projects/online-voting.svg",
  },
  {
    title: "Spendwise",
    category: "Expense Tracker",
    tools: "HTML, CSS, JavaScript, Node.js, MongoDB",
    image: "/projects/spendwise.svg",
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
                      <div>
                        <h4>{project.title}</h4>
                        <p>{project.category}</p>
                      </div>
                    </div>
                    <h4>Tools and features</h4>
                    <p>{project.tools}</p>
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
