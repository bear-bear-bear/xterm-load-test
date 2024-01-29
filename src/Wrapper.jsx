import {useEffect, useRef, useState} from 'react';
import {useStore} from './stores';
import {StoreProvider} from './stores';
import {observer} from 'mobx-react';
import Terminal from './same-with-origin/Terminal';
import styled from '@emotion/styled';

const Wrapper = observer(() => {
  const { serverStore: { session } } = useStore();
  const [showTerminal, setShowTerminal] = useState(false);
  const [syncWorkingCnt, setHardWorkingCnt] = useState(0);
  const syncWorkingIntervalRef = useRef(null);
  const autoTestIntervalRef = useRef(null);

  const syncWorkingController = {
    start: () => {
      const work = () => {
        const longText = Array.from({ length: 1000 }, () => Math.random() * 100).join(' ');
        window.test = Array.from({ length: 10000000 }).map(() => longText);
        setHardWorkingCnt(prev => prev + 1);
      };

      clearInterval(syncWorkingIntervalRef.current);
      work();
      syncWorkingIntervalRef.current = setInterval(() => {
        work();
      }, 500);
    },
    stop: () => {
      clearInterval(syncWorkingIntervalRef.current);
      syncWorkingIntervalRef.current = null;
      setHardWorkingCnt(0);
    },
  };

  const toggleTerminal = async () => {
    if (!showTerminal && !session.connected) {
      await session.connect();
    }

    setShowTerminal(prev => !prev);
  }

  const autoTestController = {
    start: async () => {
      toggleTerminal();
      clearInterval(autoTestIntervalRef.current);
      autoTestIntervalRef.current = setInterval(() => {
        toggleTerminal();
      }, 3000);

      setTimeout(() => {
        session.send('push', 'action');
        session.send('push', 'action');
        session.send('push', 'action');
        session.send('push', 'action');
        session.send('push', 'action');
      }, 1000);
    },
    stop: () => {
      clearInterval(autoTestIntervalRef.current);
      autoTestIntervalRef.current = null;
      session.send('clear', 'action');
    },
  }

  useEffect(() => {
    return () => {
      clearInterval(autoTestIntervalRef.current);
      clearInterval(syncWorkingIntervalRef.current);
    }
  }, []);

  return (
    <StoreProvider>
      <Container>
        <div>
          <h2>Do hard something</h2>
          {!!syncWorkingCnt
            ? <button onClick={syncWorkingController.stop}>Stop working!</button>
            : <button onClick={syncWorkingController.start}>Start working!</button>
          }
          <span>worked count: {syncWorkingCnt}</span>
        </div>
        <hr />

        {!autoTestIntervalRef.current ? (
          <>
            <button onClick={toggleTerminal}>{showTerminal ? 'Hide' : 'Show'} Terminal</button>
            <button onClick={autoTestController.start}>Auto Test</button>
          </>
        ) : (
          <button onClick={autoTestController.stop}>Stop Auto Test</button>
        )}
        {showTerminal &&
          <>
            <p>Connected: {session.connected.toString()}</p>

            <div className="toolbar">
              <div>
                {!autoTestIntervalRef.current && (
                  <>
                    <button onClick={() => session.send('push', 'action')}>Push(appendable)</button>
                    <button onClick={() => session.send('clear', 'action')} style={{ marginLeft: 10 }}>Clear</button>
                  </>
                )}

                <span id="notice">{session.notice}</span>
              </div>
            </div>

            <Terminal session={session} />
          </>
        }
      </Container>
    </StoreProvider>
  );
})

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 100px);
  gap: 20px;
  padding: 20px;
`;

export default Wrapper;
