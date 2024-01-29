import {useEffect, useState} from 'react';
import {storeInit} from './stores';
import {StoreProvider} from './stores';
import Wrapper from './Wrapper';
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
      <Wrapper />
    </StoreProvider>
  );
}

export default App;
