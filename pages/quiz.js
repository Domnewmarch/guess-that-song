import axios from "axios";
import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import ModalOverlay from "../components/ModalOverlay";
import qs from "qs";
import Lottie from "react-lottie";
import animationData from "../data/record-data.json";
import JSConfetti from "js-confetti";
import DataContext from "../context/DataContext";

export default function Home() {
  const { playlistData, setPlaylistData, token, setToken, playlistId } =
    useContext(DataContext);

  const audioRef = useRef(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState({});

  const [showAnswer, setShowAnswer] = useState(false);

  const [loading, setLoading] = useState(true);

  const [selectedLetter, setSelectedLetter] = useState(false);

  const [gameInProgress, setGameInProgress] = useState(false);

  const [showFinalScreen, setShowFinalScreen] = useState(false);

  const [answerCriteria, setAnswerCriteria] = useState("name");

  const [runningTotal, setRunningTotal] = useState(0);
  const [answeringDisabled, setAnsweringDisabled] = useState(false);

  const router = useRouter();

  const { id } = router.query ?? playlistId;

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    const client_id = "d99c18fbd8354e78b92d5d46b09c103e";
    const client_secret = "17a84693860e4e5790443a25d089b737";
    if (!token) {
      axios
        .post(
          "https://accounts.spotify.com/api/token",
          qs.stringify({
            grant_type: "client_credentials",
            json: true,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization:
                "Basic " +
                new Buffer(client_id + ":" + client_secret).toString("base64"),
            },
          }
        )
        .then(function (response) {
          setToken(response.data.access_token);
        })
        .catch(function (err) {
          console.log("err:%o", err);
        });
    }
  }, []);

  useEffect(() => {
    // if (!id && !playlistData.length) router.push("/");

    if (id && token) {
      axios
        .get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
          params: {
            fields:
              "items(track(name,preview_url, artists(name),album(images)))",
          },
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        .then(function (response) {
          console.log("response:%o", response);
          setPlaylistData(
            response.data.items
              .filter((item) => item.track.preview_url)
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
          );
          setLoading(false);
        })
        .catch(function (error) {
          console.log(error);
        });
    } else {
    }
  }, [id, token]);

  const letterClickHandle = (selection) => {
    setAnsweringDisabled(true);
    console.log("selection:%o", selection);
    setSelectedLetter(selection);

    if (
      selection ===
      playlistData[currentIndex].track[answerCriteria].split("")[0]
    ) {
      const right = new JSConfetti().addConfetti({
        emojis: ["🥳", "✅", "🎉", "🔈"],
        emojiSize: 100,
        confettiNumber: 100,
        confettiRadius: 30,
      });
      setRunningTotal(runningTotal + 1);
    } else {
      const wrong = new JSConfetti().addConfetti({
        emojis: ["😰", "❌", "🔇"],
        emojiSize: 100,
        confettiNumber: 100,
        confettiRadius: 30,
      });
    }
    setTimeout(() => {
      setShowAnswer(true);
      setAnsweringDisabled(true);
      if (currentIndex + 1 === playlistData.length) setCurrentIndex(0);
      else {
        // setCurrentIndex(currentIndex + 1);
      }
      setAnsweringDisabled(false);
    }, 1000);
  };

  useEffect(() => {
    if (gameInProgress) audioRef.current.play();
  }, [currentIndex, gameInProgress]);

  useEffect(() => {
    setCurrentSong(playlistData[currentIndex]?.track);
  }, [currentIndex]);

  const [isShowing, setIsShowing] = useState(false);
  return (
    <div className="min-h-screen bg-gray-600 text-white">
      Your Score: {runningTotal}
      <button onClick={() => setIsShowing((isShowing) => !isShowing)}>
        Toggle
      </button>
      {showFinalScreen ? (
        <>end of the game m8</>
      ) : (
        <div className="flex items-center justify-center">
          <audio
            src={playlistData[currentIndex]?.track?.preview_url}
            ref={audioRef}
          />

          <div className="grid grid-cols-6 w-full gap-5 p-5">
            {alphabet.split("").map((letter) => (
              <button
                key={letter}
                onClick={() => letterClickHandle(letter)}
                className={`aspect-square border border-white rounded-md hover:bg-slate-800 text-5xl ${
                  answeringDisabled ? "opacity-50" : ""
                }`}
                disabled={answeringDisabled}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}
      <ModalOverlay
        isOpen={showAnswer}
        openModal={showAnswer}
        closeModal={() => {
          setShowAnswer(false);
          setTimeout(() => {
            setCurrentIndex(currentIndex + 1);
          }, 200);
        }}
      >
        {currentSong && (
          <>
            <img
              src={currentSong?.album?.images[1]?.url}
              className="w-[150px] h-[150px] shadow-md mb-5 mx-auto"
            />
            <h2 className="text-2xl">{currentSong?.name}</h2>
            {console.log(currentSong.album)}
            <ul className="flex flex-wrap mt-3 justify-center">
              {currentSong?.artists?.map((artist) => (
                <li
                  className="text-sm mx-2 bg-pink-500 rounded-full px-3 py-1 mb-2 text-white"
                  key={artist.name}
                >
                  {artist.name}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="border-t border-slate-200 my-5"></div>
        <button
          className="mt-5 bg-blue-700 px-5 py-3 rounded-full text-white mx-auto block"
          onClick={() => {
            setShowAnswer(false);
            setTimeout(() => {
              setCurrentIndex(currentIndex + 1);
            }, 200);
          }}
        >
          Next song
        </button>
      </ModalOverlay>
      <ModalOverlay
        isOpen={!gameInProgress && !loading}
        openModal={!gameInProgress}
        closeModal={() => setGameInProgress(true)}
      >
        <p>
          Select the letter or number that corresponds to the name of the song
          you hear.
        </p>
        &nbsp;
        <p>There are 15 randomly selected songs from the playlist.</p>
        <button
          className="mt-5 bg-blue-700 px-5 py-3 rounded-full text-white mx-auto block"
          onClick={() => {
            setGameInProgress(true);
            setCurrentIndex(0);
          }}
        >
          Start listening!
        </button>
      </ModalOverlay>
      <Transition
        show={loading}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed h-screen w-screen z-100 bg-black inset-0 flex items-center justify-center">
          <div className="text-center">
            <Lottie options={defaultOptions} height={400} width={400} />
            <p className="text-5xl">Loading....</p>
          </div>
        </div>
      </Transition>
    </div>
  );
}
