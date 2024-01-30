import {useStore} from './stores';
import {observer} from 'mobx-react';
import Terminal from './same-with-origin/Terminal';
import styled from '@emotion/styled';
import SyncWorker from './SyncWorker';
import {useState} from 'react';

const Page = observer(() => {
  const { serverStore: { sessions, activatedSession, setActivatedSession, addSession } } = useStore();
  const [showTerminal, setShowTerminals] = useState(true);

  if (!activatedSession) return <div>Initializing...</div>
  return (
    <Container>
      <SyncWorker />
      <hr />

      <Toolbar>
        <button onClick={() => activatedSession.send('push', 'action')}>Start Push Message (appendable)</button>
        <button onClick={() => {
          activatedSession.send('clear', 'action');
          window.location.reload();
        }} style={{ marginLeft: 10 }}>Clear</button>

        <span id="notice">{activatedSession.notice}</span>
      </Toolbar>

      <CheckboxWrap>
        Show terminals
        <input type="checkbox" checked={showTerminal} onChange={e => setShowTerminals(e.target.checked)} />
      </CheckboxWrap>

      {showTerminal && (
        <>
          <TabsWrap>
            <PlusButton onClick={addSession}>+</PlusButton>

            <Tabs>
              {sessions.map((session, idx) => (
                <Tab
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActivatedSession(session.id)}
                  activated={session.id === activatedSession.id}
                  connected={session.connected}
                >
                  Tab {idx + 1}
                </Tab>
              ))}
            </Tabs>
          </TabsWrap>
          <p>Connected: <Status connected={activatedSession.connected}>{activatedSession.connected.toString()}</Status></p>
          <Terminal key={activatedSession.id} session={activatedSession} />
        </>
      )}
    </Container>
  );
})

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 100px);
  gap: 20px;
  padding: 20px;
`;
const Toolbar = styled.div`
  margin-bottom: 10px;
 
  button {
   font-size: 16px;
   padding: 4px;
  }
  #notice {
   margin-left: 10px;
   font-size: 16px;
   color: red;
  }
`;
const CheckboxWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
`
const Status = styled.span`
  color: ${({connected}) => connected ? 'blue' : 'tomato'};
`;
const TabsWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;
const Tabs = styled.div`
  display: flex;
`;
const Tab = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #aaa;
  cursor: pointer;
 ${({activated}) => activated && 'outline: 2px solid blue'};
 ${({connected}) => !connected && 'background: tomato'};
`;
const PlusButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 24px;
  cursor: pointer;
`;

export default Page;
