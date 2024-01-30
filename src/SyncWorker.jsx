import {useEffect, useRef, useState} from 'react';

export default function SyncWorker() {
  const [syncWorkingCnt, setHardWorkingCnt] = useState(0);
  const syncWorkingIntervalRef = useRef(null);

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

  useEffect(() => {
    return () => {
      clearInterval(syncWorkingIntervalRef.current);
    }
  }, []);

  return (
    <div>
      <h2>Do hard something</h2>
      {!!syncWorkingCnt
        ? <button onClick={syncWorkingController.stop}>Stop working!</button>
        : <button onClick={syncWorkingController.start}>Start working!</button>
      }
      <span>  worked count: {syncWorkingCnt}</span>
    </div>
  );
}
