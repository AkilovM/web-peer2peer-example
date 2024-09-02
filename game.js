const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 4, dy: 4 };
let localPaddle = { x: 0, y: canvas.height - 20, width: 100, height: 10, speed: 20 };
let remotePaddle = { x: 0, y: 10, width: 100, height: 10 };

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle(paddle) {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }

    if(ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
    }

    if(ball.y + ball.radius > localPaddle.y && ball.x > localPaddle.x && ball.x < localPaddle.x + localPaddle.width) {
        ball.dy = -ball.dy;
    }

    if(ball.y - ball.radius < remotePaddle.y + remotePaddle.height && ball.x > remotePaddle.x && ball.x < remotePaddle.x + remotePaddle.width) {
        ball.dy = -ball.dy;
    }
}

function movePaddle(paddle, dir) {
    paddle.x += dir * paddle.speed;

    if(paddle.x < 0) paddle.x = 0;
    if(paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle(localPaddle);
    drawPaddle(remotePaddle);
    moveBall();

    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ ball, paddle: localPaddle }));
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') movePaddle(localPaddle, -1);
    if(e.key === 'ArrowRight') movePaddle(localPaddle, 1);
});

// WebRTC Connection
let peerConnection = null;
let dataChannel = null;

async function startConnection() {
    peerConnection = new RTCPeerConnection();

    dataChannel = peerConnection.createDataChannel('game');
    dataChannel.onopen = () => console.log('Data channel opened');
    dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        ball = data.ball;
        remotePaddle = data.paddle;
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('New ICE candidate:', event.candidate);
            // Здесь нужно передать кандидата на другой пир (например, через WebSocket)
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Offer created:', offer);

    // Передайте offer другому пиру, чтобы он мог создать ответ
}

// Предположим, вы получили ответ от другого пира
async function receiveAnswer(answer) {
    const remoteDesc = new RTCSessionDescription(answer);
    await peerConnection.setRemoteDescription(remoteDesc);
    console.log('Answer received and set as remote description');
}

startConnection();
gameLoop();
