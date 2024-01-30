import { useEffect, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import { WebLinksAddon } from 'xterm-addon-web-links';
import QPTerminal from './QPTerminal';
import SshAddon from './SshAddon';
import { useContainerSize } from './useContainerSize';

const webLinksAddon = new WebLinksAddon();

const Terminal = ({ session }) => {
  const containerRef = useRef(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef, []);
  const timeoutRef = useRef();

  const sshAddon = useMemo(() => {
    if (session.socket?.readyState !== WebSocket.OPEN) return;
    return new SshAddon(session.socket);
  }, [session.socket]);

  const onDidMount = ({ terminal }) => {
    console.log('onDidMount', session.messageStore.messages);
    terminal.write(session.messageStore.messages.join(''));
    if (sshAddon) {
      timeoutRef.current = setTimeout(() => {
        sshAddon.readyToInput(terminal);
        terminal.focus();
      }, 500 /* FIXME: "커넥트 직후" 바로 focus 하면 왠지모를 이유로 그즉시 풀려서 일단 500 ms 딜레이 걸어둠, "이미 커넥트된 세션으로 탭이동" 등에선 문제 없음. 원인 파악 필요. */);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Container ref={containerRef}>
      <Wrapper>
        <QPTerminal
          addons={[webLinksAddon, sshAddon].filter(Boolean)}
          onDidMount={onDidMount}
          style={{
            overflow: 'hidden',
            width: containerWidth - 6,
            height: containerHeight,
          }}
        />
      </Wrapper>
    </Container>
  )
};

const Container = styled.div `
  flex: 1;
  position: relative;
  background: #000;
`;
const Wrapper = styled.div`
  position: absolute;
  padding: 5px;
`;

export default Terminal;
