import {useEffect, useState} from 'react';
import {storeInit} from './stores';
import {StoreProvider} from './stores';
import Terminal from './Terminal';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await storeInit();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div>
        Loading...
      </div>
    );
  }
  return (
    <StoreProvider>
      <Terminal />
    </StoreProvider>
  );
}

export default App;
