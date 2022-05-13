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
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function Home() {
  const { playlistData, setPlaylistData, token, setToken, playlistId } =
    useContext(DataContext);

  const router = useRouter();

  const { id, limit } = router.query;

  const [animationPaused, setAnimationPaused] = useState(true);

  const audioRef = useRef(null);
  const recordScratchAudio = useRef(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState({});

  const [showAnswer, setShowAnswer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [numberOfSongs, setNumberOfSongs] = useState(limit ?? 10);

  const [loading, setLoading] = useState(true);

  const [playlistUrl, setPlaylistUrl] = useState("");

  const [selectedLetter, setSelectedLetter] = useState(false);

  const [playlistPreview, setPlaylistPreview] = useState(false);

  const [gameInProgress, setGameInProgress] = useState(false);

  const [showFinalScreen, setShowFinalScreen] = useState(false);

  const [answerCriteria, setAnswerCriteria] = useState("name");

  const [runningTotal, setRunningTotal] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [answeringDisabled, setAnsweringDisabled] = useState(false);

  const [copied, setCopied] = useState(false);
  const [userPlaylistId, setUserPlaylistId] = useState(false);

  const defaultOptions = {
    loop: true,
    autoplay: false,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const progressSong = () => {
    setShowAnswer(false);
    if (currentIndex + 1 < playlistData.length) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 200);
    } else {
      setShowFinalScreen(true);
    }
  };

  const checkPlaylistData = (url) => {
    console.log("url:%o", url);
    const id = url
      ?.split("https://open.spotify.com/playlist/")[1]
      ?.split("?")[0];
    if (!id) return;
    setUserPlaylistId(id);

    axios
      .get(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then(function (response) {
        setPlaylistPreview(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
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
          setPlaylistData(
            response.data.items
              .filter((item) => item.track.preview_url)
              .sort(() => Math.random() - 0.5)
              .slice(0, numberOfSongs)
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
      setUserAnswers([
        ...userAnswers,
        {
          ...currentSong,
          correct: true,
        },
      ]);
    } else {
      const wrong = new JSConfetti().addConfetti({
        emojis: ["😰", "❌", "🔇"],
        emojiSize: 100,
        confettiNumber: 100,
        confettiRadius: 30,
      });
      setUserAnswers([
        ...userAnswers,
        {
          ...currentSong,
          correct: false,
        },
      ]);
    }
    setTimeout(() => {
      setShowAnswer(true);
    }, 1000);
  };

  useEffect(() => {
    if (gameInProgress) {
      setAnimationPaused(false);
      audioRef.current.play();
      // let score = 300;
      // const scoreTimer = setInterval(() => {
      //   score - 100;
      // }, 1000);
    }
  }, [currentIndex, gameInProgress]);

  useEffect(() => {
    setCurrentSong(playlistData[currentIndex]?.track);
  }, [currentIndex, playlistData]);

  return (
    <div className="min-h-screen bg-gray-600 text-white">
      <div className="fixed -z-1 inset-0 h-screen w-screen flex items-center justify-center">
        <div className="h-[400px] w-[400px] relative">
          <Lottie
            options={defaultOptions}
            height={400}
            width={400}
            isPaused={animationPaused}
          />
          <img
            className="absolute rounded-full inset-0"
            src="/img/cat-vibe.gif"
            alt=""
          />
        </div>
      </div>
      <div className="flex items-center justify-center relative">
        <audio
          src={playlistData[currentIndex]?.track?.preview_url}
          ref={audioRef}
          onEnded={() => recordScratchAudio.current.play()}
        />
        <audio
          src="/audio/recordScratch.mp3"
          ref={recordScratchAudio}
          onEnded={() => setAnimationPaused(true)}
        />

        <div className="grid grid-cols-4 md:grid-cols-6 w-full gap-5 p-5">
          {alphabet.split("").map((letter) => (
            <button
              key={letter}
              onClick={() => letterClickHandle(letter)}
              className="aspect-square border border-white rounded-md hover:bg-slate-800 md:text-5xl bg-blue-900/20"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
      <ModalOverlay
        isOpen={showFinalScreen}
        openModal={showFinalScreen}
        closeModal={() => {}}
      >
        <span className="text-2xl">
          You scored: {runningTotal}/{playlistData.length}
        </span>
        <ul>
          {userAnswers.map((answer) => (
            <li
              key={answer.name}
              className="flex justify-between items-center my-5 last:mb-0 pt-5 border-t border-slate-300"
            >
              <div className="text-left">
                <span className="text-sm mb-2 block">{answer.name}</span>
                <ul className="flex flex-wrap">
                  {answer.artists.map((artist) => (
                    <li key={artist.name} className="text-xs mr-2">
                      {artist.name}
                    </li>
                  ))}
                </ul>
                {answer.correct ? <>👍</> : <>👎</>}
              </div>
              <img
                className="flex-shrink-0 ml-2 w-[64px] h-[64px]"
                src={answer.album.images[2].url}
              />
            </li>
          ))}
        </ul>
      </ModalOverlay>
      <ModalOverlay
        isOpen={showAnswer}
        openModal={showAnswer}
        closeModal={() => {
          progressSong();
        }}
      >
        {currentSong && (
          <>
            <img
              src={currentSong?.album?.images[1]?.url}
              className="w-[150px] h-[150px] shadow-md mb-5 mx-auto"
            />
            <h2 className="text-2xl">{currentSong?.name}</h2>

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
            progressSong();
          }}
        >
          {currentIndex + 1 < playlistData.length ? (
            <span>Next song</span>
          ) : (
            <span>See results</span>
          )}
        </button>
      </ModalOverlay>
      <ModalOverlay
        isOpen={!gameInProgress && !loading}
        openModal={!gameInProgress}
        closeModal={() => setGameInProgress(true)}
      >
        <p>Press the letter or number that matches the name of the song</p>
        &nbsp;
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
      <ModalOverlay
        isOpen={showCreateModal}
        openModal={showCreateModal}
        closeModal={() => setShowCreateModal(false)}
      >
        <label htmlFor="playlistUrl">Enter a playlist URL below:</label>
        <input
          id="playlistUrl"
          name="playlistUrl"
          value={playlistUrl}
          className="bg-transparent border-blue-700 border rounded-full px-5 py-2 mt-3 text-xl"
          onChange={(e) => {
            setPlaylistUrl(e.target.value);
          }}
        />
        <label className="mt-5 block" htmlFor="playlistUrl">
          Number of songs:
        </label>
        <input
          type="number"
          value={numberOfSongs}
          className="bg-transparent border-blue-700 border rounded-full px-5 py-2 mt-3 text-xl"
          onChange={(e) => {
            setNumberOfSongs(e.target.value);
          }}
        />
        <button
          className="mt-5 bg-blue-700 px-5 py-3 rounded-full text-white mx-auto block"
          onClick={() => {
            checkPlaylistData(playlistUrl);
          }}
        >
          Submit!
        </button>
        {playlistPreview && (
          <div>
            <div className="mt-5 bg-slate-800 text-left p-3 flex rounded-lg items-center">
              <img
                className="w-[75px] h-[75px]"
                src={playlistPreview.images[0].url}
                alt=""
              />
              <span className="ml-5 text-xl">{playlistPreview.name}</span>
            </div>
            <CopyToClipboard
              text={`${window.location.origin}/?id=${userPlaylistId}&limit=${numberOfSongs}`}
              onCopy={() => setCopied(true)}
            >
              <button className="px-5 py-2 rounded-full bg-white text-slate-900 flex items-center justify-center mx-auto mt-5">
                <span>Copy link</span>
              </button>
            </CopyToClipboard>
          </div>
        )}
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
          <div className="text-center relative">
            
            <p className="text-5xl">Loading....</p>
            <p className="my-2">Or no playlist data...😅</p>
            <p className="my-2">
              Why dont you{" "}
              <button
                className="underline text-blue-500"
                onClick={() => {
                  setShowCreateModal(true);
                }}
              >
                make your own?
              </button>
            </p>
          </div>
        </div>
      </Transition>
    </div>
  );
}
