const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 4, dy: 4 };
let paddle = { x: 0, y: canvas.height - 20, width: 100, height: 10, speed: 20 };

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
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

    if(ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    if(ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        // Ball missed the paddle
    }

    if(ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.y + ball.radius > paddle.y) {
        ball.dy = -ball.dy;
    }
}

function movePaddle(dir) {
    paddle.x += dir * paddle.speed;

    if(paddle.x < 0) paddle.x = 0;
    if(paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    moveBall();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') movePaddle(-1);
    if(e.key === 'ArrowRight') movePaddle(1);
});

gameLoop();

// WebRTC Connection
let peerConnection = null;
let dataChannel = null;

async function startConnection() {
    peerConnection = new RTCPeerConnection();

    dataChannel = peerConnection.createDataChannel('game');
    dataChannel.onopen = () => console.log('Data channel opened');
    dataChannel.onmessage = (event) => console.log('Message received:', event.data);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('New ICE candidate:', event.candidate);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Offer created:', offer);
}

startConnection();
