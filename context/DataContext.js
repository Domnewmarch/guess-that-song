import { useState, createContext } from "react";
// import { useSessionStorage } from "react-use";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [playlistId, setPlaylistId] = useState("37i9dQZF1DWXF8Nf1uycDZ");

  const [playlistData, setPlaylistData] = useState({});

  const [token, setToken] = useState(false);

  return (
    <DataContext.Provider
      value={{
        playlistId,
        setPlaylistId,
        playlistData,
        setPlaylistData,
        token,
        setToken,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
