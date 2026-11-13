import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          Education <span>&</span>
          <br /> Experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Bachelor of Computer Applications (BCA)</h4>
                <h5>Chandigarh University</h5>
              </div>
              <h3>2024</h3>
            </div>
            <p>
              Pursuing BCA with a deep focus on Computer Science foundations, Core
              Java, Data Structures &amp; Algorithms, and Database Management Systems.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Full-Stack Java Developer</h4>
                <h5>Web Applications &amp; APIs</h5>
              </div>
              <h3>2025</h3>
            </div>
            <p>
              Architecting full-stack web solutions utilizing Spring Boot, React,
              and MySQL. Building secure RESTful APIs, real-time integrations, and responsive UIs.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Software Engineer (Upcoming Grad)</h4>
                <h5>Chandigarh University</h5>
              </div>
              <h3>2027</h3>
            </div>
            <p>
              Actively solving complex DSA challenges in Java, mastering system design,
              and contributing to scalable real-world projects that create meaningful impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
