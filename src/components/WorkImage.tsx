import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";

interface Props {
  image?: string;
  alt?: string;
  video?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");
  const handleMouseEnter = async () => {
    if (props.video) {
      setIsVideo(true);
      const response = await fetch(`src/assets/${props.video}`);
      if (!response.ok) {
        throw new Error(`Failed to load project video: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideo(blobUrl);
    }
  };

  const content = (
    <>
      {props.link && (
        <div className="work-link">
          <MdArrowOutward />
        </div>
      )}
      {props.image ? (
        <img src={props.image} alt={props.alt ?? ""} />
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
