import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Props {
  image?: string;
  alt?: string;
  video?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");
  const [imgError, setImgError] = useState(false);

  const handleMouseEnter = async () => {
    if (props.video) {
      try {
        setIsVideo(true);
        const response = await fetch(`/assets/${props.video}`);
        if (!response.ok) return;
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setVideo(blobUrl);
      } catch (e) {
        console.warn("Could not load preview video", e);
      }
    }
  };

  const handleImageLoad = () => {
    ScrollTrigger.refresh();
  };

  const content = (
    <>
      <div className="work-browser-bar" aria-hidden="true">
        <span className="dot dot-red"></span>
        <span className="dot dot-yellow"></span>
        <span className="dot dot-green"></span>
        <span className="work-browser-url">{props.alt || "Dashboard Preview"}</span>
      </div>
      {props.link && (
        <div className="work-link" title="Open Repository">
          <MdArrowOutward />
        </div>
      )}
      {props.image && !imgError ? (
        <img
          src={props.image}
          alt={props.alt ?? ""}
          loading="eager"
          decoding="async"
          onLoad={handleImageLoad}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="work-project-art" aria-label={props.alt}>
          <span>{props.alt}</span>
        </div>
      )}
      {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
    </>
  );

  return (
    <div className="work-image">
      {props.link ? (
        <a
          className="work-image-in"
          href={props.link}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsVideo(false)}
          target="_blank"
          rel="noreferrer"
          data-cursor="disable"
          aria-label={`View ${props.alt ?? "project"} on GitHub`}
        >
          {content}
        </a>
      ) : (
        <div className="work-image-in">{content}</div>
      )}
    </div>
  );
};

export default WorkImage;
