import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import animationData1 from "../../../public/animations/loading-animation-2.json";

const animations = [animationData1];

const phrases: string[] = [
"Another call with the marketing director…",
"Junior designer forgot to save the file…",
"Re-exporting in the correct dimensions…",
"Fixing fonts nobody owns…",
"Adding the logo… bigger.", 
"Waiting for feedback from 12 stakeholders…",
"Starting from scratch (again)...",
"Polishing pixels you’ll never notice…",
"Manifesting moodboards…",
"Curating the perfect color palette…",
"Brewing inspiration from Pinterest…",
"Reticulating gradients…",
"Summoning bold typography…",
"Rendering your genius idea…",
"Rehearsing pitches in the mirror…",
"Teaching AI how to art-direct…",
"Outsourcing creativity to the cloud…",
"Bribing the algorithm with coffee…",
"Running last-minute brainstorm…",
"Making the banner pop!",
"Pretending deadlines don’t exist…"
];

export default function LoadingScreen() {
  const [index, setIndex] = useState<number>(0);
  const [animationIndex, setAnimationIndex] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
      setAnimationIndex((prev) => (prev + 1) % animations.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen text-white bg-gray-900">
      <h1 className="mb-8 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
        AdNate
      </h1>
      <div className="w-64 h-64">
        <Lottie 
          animationData={animations[animationIndex]} 
          loop={true} 
        />
      </div>

      {/* Phrase */}
      <p className="px-4 mt-4 max-w-md text-lg text-center text-gray-300 transition-opacity duration-500">
        {phrases[index]}
      </p>
    </div>
  );
}
