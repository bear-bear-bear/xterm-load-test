import {useEffect, useState} from 'react';
import {storeInit} from './stores';
import {StoreProvider} from './stores';
import Page from './Page';
import './App.css';
import 'xterm/css/xterm.css';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await storeInit();
      setReady(true);
    })();
  }, []);

  if (!ready) return <div>Loading...</div>;
  return (
    <StoreProvider>
      <Page />
    </StoreProvider>
  );
}

export default App;
