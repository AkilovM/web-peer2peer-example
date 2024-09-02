document.addEventListener('DOMContentLoaded', () => {
    let peerConnection = null;
    let dataChannel = null;
    let iceCandidatesFromRemote = [];

    async function startConnection() {
        console.log('Starting connection...');
        peerConnection = new RTCPeerConnection();

        dataChannel = peerConnection.createDataChannel('game');
        dataChannel.onopen = () => console.log('Data channel opened');
        dataChannel.onmessage = (event) => {
            const data = JSON.parse(event.data);
            window.updateGameState(data.ball, data.paddle);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('New ICE candidate:', event.candidate);
                document.getElementById('answerBox').value = JSON.stringify({
                    type: 'candidate',
                    candidate: event.candidate
                });
            }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Offer created and set as local description:', offer);
        document.getElementById('answerBox').value = JSON.stringify(peerConnection.localDescription);
    }

    async function receiveOffer(offer) {
        try {
            console.log('Receiving offer...', offer);
            peerConnection = new RTCPeerConnection();

            peerConnection.ondatachannel = (event) => {
                dataChannel = event.channel;
                dataChannel.onopen = () => console.log('Data channel opened');
                dataChannel.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    window.updateGameState(data.ball, data.paddle);
                };
            };

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('New ICE candidate:', event.candidate);
                    document.getElementById('answerBox').value = JSON.stringify({
                        type: 'candidate',
                        candidate: event.candidate
                    });
                }
            };

            // Устанавливаем удаленное описание
            const remoteDesc = new RTCSessionDescription(offer);
            await peerConnection.setRemoteDescription(remoteDesc);
            console.log('Remote description set:', remoteDesc);

            // Создаем и устанавливаем локальное описание (answer)
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log('Answer created and set as local description:', answer);
            document.getElementById('answerBox').value = JSON.stringify(peerConnection.localDescription);

            // Обрабатываем отложенные ICE-кандидаты
            if (iceCandidatesFromRemote.length > 0) {
                console.log('Processing stored ICE candidates...');
                for (let candidate of iceCandidatesFromRemote) {
                    console.log('Adding stored ICE candidate:', candidate);
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
                iceCandidatesFromRemote = []; // Очистка списка кандидатов после их добавления
            }
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async function receiveAnswer(answer) {
        try {
            console.log('Receiving answer...', answer);
            const remoteDesc = new RTCSessionDescription(answer);
            await peerConnection.setRemoteDescription(remoteDesc);
            console.log('Remote description set:', remoteDesc);
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async function receiveIceCandidate(candidate) {
        try {
            console.log('Receiving ICE candidate...', candidate);
            if (peerConnection && peerConnection.remoteDescription) {
                console.log('Adding ICE candidate:', candidate);
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                console.log('Storing ICE candidate for later use:', candidate);
                iceCandidatesFromRemote.push(candidate);
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    document.getElementById('startButton').onclick = async () => {
        console.log('Button clicked');
        const offerText = document.getElementById('offerBox').value;
        if (offerText) {
            console.log('Offer text found');
            const parsedOffer = JSON.parse(offerText);
            if (parsedOffer.type === 'offer') {
                await receiveOffer(parsedOffer);
            } else if (parsedOffer.type === 'answer') {
                await receiveAnswer(parsedOffer);
            } else if (parsedOffer.type === 'candidate') {
                await receiveIceCandidate(parsedOffer.candidate);
            }
        } else {
            console.log('No offer text found, starting new connection');
            await startConnection();
        }
    };

    window.dataChannel = dataChannel;
});
