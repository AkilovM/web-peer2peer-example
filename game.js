const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let localPlayer = { x: 50, y: 50, color: 'blue' };
let remotePlayer = { x: 100, y: 100, color: 'red' };

const peerConnection = new RTCPeerConnection();
let dataChannel;

// Инициализация канала передачи данных WebRTC
peerConnection.ondatachannel = (event) => {
    dataChannel = event.channel;

    dataChannel.onopen = () => {
        console.log('Data channel is open');
    };

    dataChannel.onmessage = (event) => {
        const remotePosition = JSON.parse(event.data);
        remotePlayer.x = remotePosition.x;
        remotePlayer.y = remotePosition.y;
    };
};

// Отправка позиции локального игрока
function sendPosition() {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(localPlayer));
    }
}

// Рендеринг игрового состояния
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = localPlayer.color;
    ctx.fillRect(localPlayer.x, localPlayer.y, 50, 50);

    ctx.fillStyle = remotePlayer.color;
    ctx.fillRect(remotePlayer.x, remotePlayer.y, 50, 50);

    sendPosition();
    requestAnimationFrame(gameLoop);
}

// Управление движением игрока
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            localPlayer.y -= 10;
            break;
        case 'ArrowDown':
            localPlayer.y += 10;
            break;
        case 'ArrowLeft':
            localPlayer.x -= 10;
            break;
        case 'ArrowRight':
            localPlayer.x += 10;
            break;
    }
});

// Создание и отправка SDP предложения
document.getElementById('offerButton').addEventListener('click', async () => {
    dataChannel = peerConnection.createDataChannel('game');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    document.getElementById('localDescription').value = JSON.stringify(peerConnection.localDescription);
});

// Установка удалённого SDP ответа
document.getElementById('answerButton').addEventListener('click', async () => {
    const remoteDesc = JSON.parse(document.getElementById('remoteDescription').value);
    await peerConnection.setRemoteDescription(remoteDesc);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    document.getElementById('localDescription').value = JSON.stringify(peerConnection.localDescription);
});

// Установка удалённого SDP предложения
document.getElementById('connectButton').addEventListener('click', async () => {
    const remoteDesc = JSON.parse(document.getElementById('remoteDescription').value);
    await peerConnection.setRemoteDescription(remoteDesc);
});

// Обработка ICE кандидатов
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        console.log('ICE Candidate:', event.candidate);
    }
};

// Начинаем игровой цикл
gameLoop();
